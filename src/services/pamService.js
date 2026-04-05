/**
 * pamService.js — Client Proofing data layer
 * Backed by Supabase table: proofing_projects
 */
import { supabase } from "../lib/supabaseClient";

export async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .select("id, slug, client_name, status, images, selections, download_url_high, download_url_web, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function verifyPasscode(slug, passcode) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .select("passcode")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return false;
  return data.passcode === passcode;
}

export async function submitSelection(slug, selectionsData) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .update({ selections: selectionsData, status: "selection_completed" })
    .eq("slug", slug)
    .select("id, slug, client_name, status, images, selections, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProject(projectData) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .insert({
      slug: projectData.slug,
      client_name: projectData.client_name,
      passcode: projectData.passcode,
      images: projectData.images ?? [],
      selections: [],
      status: "awaiting_selection",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listProjects() {
  const { data, error } = await supabase
    .from("proofing_projects")
    .select("id, slug, client_name, status, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateProjectStatus(slug, status) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .update({ status })
    .eq("slug", slug)
    .select("id, slug, status, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from("proofing_projects")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deliverProject(slug, { downloadUrlHigh, downloadUrlWeb }) {
  const { data, error } = await supabase
    .from("proofing_projects")
    .update({
      status: "delivered",
      download_url_high: downloadUrlHigh ?? null,
      download_url_web: downloadUrlWeb ?? null,
    })
    .eq("slug", slug)
    .select("id, slug, status, download_url_high, download_url_web, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export const insertImages = async (slug, newImages) => { console.log('Mock insertImages', slug, newImages); return { success: true }; };
export const togglePaid = async (projectId) => { console.log('Mock togglePaid', projectId); return { success: true }; };
export const addNote = async (projectId, imageId, note) => { console.log('Mock addNote', projectId, imageId, note); return { success: true }; };
export const deleteImage = async (projectId, imageId) => { console.log('Mock deleteImage', projectId, imageId); return { success: true }; };
export const getSelections = async (projectId) => { console.log('Mock getSelections', projectId); return []; };
export const listImages = async (projectId) => { console.log('Mock listImages', projectId); return []; };
export const listNotes = async (projectId) => { console.log('Mock listNotes', projectId); return []; };
