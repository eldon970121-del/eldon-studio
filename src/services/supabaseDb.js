import { supabase } from "../lib/supabaseClient";

/**
 * Load all portfolios from Supabase DB.
 * Returns raw portfolio objects (not shaped), or null on failure.
 */
export async function loadPortfoliosFromCloud() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("portfolios")
      .select("id, data, updated_at")
      .order("updated_at", { ascending: true });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    return data.map((row) => row.data);
  } catch {
    return null;
  }
}

/**
 * Upsert all portfolios to Supabase DB and delete any removed ones.
 */
export async function savePortfoliosToCloud(portfolios) {
  if (!supabase || !Array.isArray(portfolios)) return;
  try {
    const rows = portfolios.map((p) => ({
      id: String(p.id),
      data: p,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("portfolios")
      .upsert(rows, { onConflict: "id" });
    if (error) return;

    // Delete rows that are no longer in the current list
    const currentIds = portfolios.map((p) => String(p.id));
    const { data: existing } = await supabase.from("portfolios").select("id");
    if (existing) {
      const toDelete = existing
        .map((r) => r.id)
        .filter((id) => !currentIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from("portfolios").delete().in("id", toDelete);
      }
    }
  } catch {
    // Silently fail — localStorage is the fallback
  }
}

/**
 * Load site profile from Supabase DB.
 * Returns raw profile object or null on failure.
 */
export async function loadProfileFromCloud() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("site_profile")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}

/**
 * Upsert site profile to Supabase DB.
 */
export async function saveProfileToCloud(profile) {
  if (!supabase || !profile) return;
  try {
    await supabase.from("site_profile").upsert(
      { id: 1, data: profile, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  } catch {
    // Silently fail
  }
}
