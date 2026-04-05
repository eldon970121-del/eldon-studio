import { useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";

const SUPABASE_ERROR = "Supabase not configured";

export function useAdminAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin =
    user?.email?.toLowerCase() ===
    import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();

  if (!supabase) {
    return {
      user: null,
      isAdmin: false,
      loading: false,
      signIn: async () => ({ data: null, error: new Error(SUPABASE_ERROR) }),
      signOut: async () => ({ data: null, error: new Error(SUPABASE_ERROR) }),
    };
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    return supabase.auth.signOut();
  }

  return { user, isAdmin, loading, signIn, signOut };
}
