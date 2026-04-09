/**
 * pamService.js — Client Proofing data layer
 * Backed by Railway API: /api/projects
 */
const API_BASE = import.meta.env.VITE_LUMINA_API || 'https://lumina-server-production.up.railway.app';
const getToken = () => localStorage.getItem('lumina_token') || '';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getProjectBySlug(slug) {
  const data = await apiFetch(`/api/projects/slug/${slug}`);
  return data.project ?? data ?? null;
}

export async function verifyPasscode(slug, passcode) {
  try {
    const data = await apiFetch(`/api/projects/slug/${slug}/verify`, {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
    return data.valid === true;
  } catch {
    return false;
  }
}

export async function submitSelection(slug, selectionsData) {
  const data = await apiFetch(`/api/projects/slug/${slug}/selections`, {
    method: 'PUT',
    body: JSON.stringify({ selections: selectionsData }),
  });
  return data.project ?? data;
}

export async function createProject(projectData) {
  const data = await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
  return data.project ?? data;
}

export async function listProjects() {
  const data = await apiFetch('/api/projects');
  return Array.isArray(data.projects) ? data.projects : Array.isArray(data) ? data : [];
}

export async function updateProjectStatus(slug, status) {
  const data = await apiFetch(`/api/projects/slug/${slug}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return data.project ?? data;
}

export async function deleteProject(id) {
  await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
}

export async function deliverProject(slug, { downloadUrlHigh, downloadUrlWeb }) {
  const data = await apiFetch(`/api/projects/slug/${slug}/deliver`, {
    method: 'POST',
    body: JSON.stringify({ download_url_high: downloadUrlHigh, download_url_web: downloadUrlWeb }),
  });
  return data.project ?? data;
}

export const insertImages = async (slug, newImages) => {
  const data = await apiFetch(`/api/projects/slug/${slug}/images`, {
    method: 'POST',
    body: JSON.stringify({ images: newImages }),
  });
  return data;
};

export const togglePaid = async (projectId) => {
  const data = await apiFetch(`/api/projects/${projectId}/toggle-paid`, { method: 'POST' });
  return data;
};

export const addNote = async (projectId, imageId, note) => {
  const data = await apiFetch(`/api/projects/${projectId}/images/${imageId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return data;
};

export const deleteImage = async (projectId, imageId) => {
  await apiFetch(`/api/projects/${projectId}/images/${imageId}`, { method: 'DELETE' });
  return { success: true };
};

export const getSelections = async (projectId) => {
  const data = await apiFetch(`/api/projects/${projectId}/selections`);
  return Array.isArray(data.selections) ? data.selections : [];
};

export const listImages = async (projectId) => {
  const data = await apiFetch(`/api/projects/${projectId}/images`);
  return Array.isArray(data.images) ? data.images : [];
};

export const listNotes = async (projectId) => {
  const data = await apiFetch(`/api/projects/${projectId}/notes`);
  return Array.isArray(data.notes) ? data.notes : [];
};
