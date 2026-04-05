import { useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { insertImages } from "../../services/pamService";

function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectUploader({ projects }) {
  const inputRef = useRef(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [files, setFiles] = useState([]);
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === selectedProjectId) || null,
    [projects, selectedProjectId],
  );
  const projectSlug = slugifyValue(selectedProject?.slug || selectedProject?.name || "project");

  function stageFiles(nextFiles) {
    if (!nextFiles.length) {
      return;
    }

    setFiles((current) => [...current, ...nextFiles]);
    setUploadError("");
    setUploadSuccess(false);
  }

  function handleFileInputChange(event) {
    stageFiles(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    stageFiles(Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith("image/")));
  }

  function handleRemoveFile(indexToRemove) {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setUploadError("");
    setUploadSuccess(false);
  }

  async function handleUpload() {
    if (!supabase) {
      setUploadError("Supabase not configured");
      return;
    }

    if (!selectedProject || files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const timestamp = Date.now();
      const rows = [];

      for (const [index, file] of files.entries()) {
        const path = `proof/${selectedProjectId}/${projectSlug}_${index + 1}_${timestamp}.jpg`;
        const { error: uploadStorageError } = await supabase.storage
          .from("proof-images")
          .upload(path, file, { upsert: true });

        if (uploadStorageError) {
          throw uploadStorageError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("proof-images").getPublicUrl(path);

        rows.push({
          project_id: selectedProjectId,
          storage_path: path,
          preview_url: publicUrl,
          full_url: publicUrl,
          file_name: file.name,
          sort_order: index,
          is_delivery: false,
        });
      }

      const { error } = await insertImages(rows);

      if (error) {
        throw error;
      }

      setFiles([]);
      setUploadSuccess(true);
    } catch (error) {
      setUploadError(error?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[#131313] text-white">
      <select
        value={selectedProjectId}
        onChange={(event) => {
          setSelectedProjectId(event.target.value);
          setUploadError("");
          setUploadSuccess(false);
        }}
        className="w-full max-w-xs border border-white/20 bg-transparent px-3 py-2 text-sm text-white"
      >
        <option value="" className="bg-[#131313] text-white">
          Select project
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id} className="bg-[#131313] text-white">
            {project.name} ({project.slug})
          </option>
        ))}
      </select>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          "mt-6 cursor-pointer border-2 border-dashed p-16 text-center text-white/30 transition",
          isDragging ? "border-white/40" : "border-white/20 hover:border-white/40",
        ].join(" ")}
      >
        Drag images here, or click to browse
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      <div className="mt-4 max-h-48 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${index}`}
            className="flex items-start justify-between gap-4 border-b border-white/10 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-white">{file.name}</p>
              <p className="text-white/40">{formatFileSize(file.size)}</p>
              <p className="truncate text-white/30">→ {projectSlug || "project"}_{index + 1}.jpg</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="text-lg leading-none text-white/40 transition hover:text-white"
              aria-label={`Remove ${file.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm text-white/70">
          Watermark Opacity: {watermarkOpacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={watermarkOpacity}
          onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
          className="w-full accent-white"
        />
      </div>

      <button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || !selectedProjectId || uploading}
        className="mt-6 w-full bg-white py-3 text-sm text-black transition hover:bg-white/90 disabled:opacity-30"
      >
        Upload {files.length} Image{files.length === 1 ? "" : "s"}
      </button>

      <div className="mt-4 min-h-5 text-sm">
        {uploadError ? <p className="text-red-400">{uploadError}</p> : null}
        {!uploadError && uploadSuccess ? <p className="text-white/60">Upload complete.</p> : null}
      </div>
    </div>
  );
}
