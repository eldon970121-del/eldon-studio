import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORAGE_BUCKET = "portfolio-images";
const STORAGE_PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

function getFileExtension(file) {
  const rawName = typeof file?.name === "string" ? file.name : "";
  const nameParts = rawName.split(".");
  const ext = nameParts.length > 1 ? nameParts.pop() : "";
  return (ext || "webp").toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
}

/**
 * 将图片直传至 Supabase Storage
 * @param {File} file - 待上传的图片
 * @returns {Promise<string>} - 返回公开访问 URL
 */
export async function uploadImageToCloud(file) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  if (!(file instanceof File)) {
    throw new Error("Invalid upload file.");
  }

  const fileExt = getFileExtension(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase 上传失败:", error.message);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return {
    publicUrl: publicUrlData.publicUrl,
    path: filePath,
  };
}

export function getStoragePathFromUrl(url) {
  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const markerIndex = parsedUrl.pathname.indexOf(STORAGE_PUBLIC_PREFIX);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + STORAGE_PUBLIC_PREFIX.length));
  } catch {
    return null;
  }
}

export async function deleteImagesFromCloud(paths) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const validPaths = Array.from(
    new Set((Array.isArray(paths) ? paths : []).filter((path) => typeof path === "string" && path.length > 0)),
  );

  if (validPaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(validPaths);

  if (error) {
    console.error("Supabase 删除失败:", error.message);
    throw error;
  }
}
