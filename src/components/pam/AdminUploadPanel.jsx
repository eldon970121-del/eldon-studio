import { useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { deliverProject } from "../../services/pamService";

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ZipFileInput({ label, sublabel, file, onFile, disabled }) {
  const ref = useRef(null);
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className={[
          "w-full border border-dashed px-6 py-8 text-left text-sm transition",
          file
            ? "border-white/40 text-white"
            : "border-white/20 text-white/30 hover:border-white/40 hover:text-white/60",
          disabled ? "pointer-events-none opacity-30" : "",
        ].join(" ")}
      >
        {file ? (
          <span className="flex items-center justify-between gap-4">
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-white/40">{formatFileSize(file.size)}</span>
          </span>
        ) : (
          <span>{sublabel}</span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function AdminUploadPanel({ projects }) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [highResFile, setHighResFile] = useState(null);
  const [webResFile, setWebResFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | uploading | success | error
  const [error, setError] = useState("");

  const canSubmit =
    selectedSlug && (highResFile || webResFile) && phase !== "uploading" && phase !== "success";

  async function uploadZip(file, slug, filename) {
    const path = `${slug}/${filename}`;
    const { error: storageError } = await supabase.storage
      .from("deliverables")
      .upload(path, file, { upsert: true, contentType: "application/zip" });
    if (storageError) throw new Error(storageError.message);
    const { data: urlData } = supabase.storage.from("deliverables").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleDeliver() {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    if (!selectedSlug) {
      setError("Select a project first.");
      return;
    }
    if (!highResFile && !webResFile) {
      setError("Attach at least one ZIP file.");
      return;
    }

    setPhase("uploading");
    setError("");
    setProgress(0);

    try {
      let downloadUrlHigh = null;
      let downloadUrlWeb = null;

      if (highResFile) {
        setProgress(15);
        downloadUrlHigh = await uploadZip(highResFile, selectedSlug, "high_res.zip");
        setProgress(50);
      }

      if (webResFile) {
        setProgress(highResFile ? 55 : 15);
        downloadUrlWeb = await uploadZip(webResFile, selectedSlug, "web_res.zip");
        setProgress(85);
      }

      await deliverProject(selectedSlug, { downloadUrlHigh, downloadUrlWeb });
      setProgress(100);
      setPhase("success");
    } catch (err) {
      setError(err?.message || "Upload failed.");
      setPhase("error");
      setProgress(0);
    }
  }

  function reset() {
    setSelectedSlug("");
    setHighResFile(null);
    setWebResFile(null);
    setProgress(0);
    setPhase("idle");
    setError("");
  }

  if (phase === "success") {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">Delivered</span>
          <p className="font-serif text-2xl font-light text-white">Files sent to client.</p>
          <p className="text-sm text-white/40">
            Project <span className="text-white/70">{selectedSlug}</span> is now marked as{" "}
            <span className="text-white/70">delivered</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-4 border border-white/20 px-6 py-2 text-sm text-white/50 transition hover:border-white/60 hover:text-white"
        >
          Deliver Another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="mb-8">
        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/40">Project</p>
        <select
          value={selectedSlug}
          disabled={phase === "uploading"}
          onChange={(e) => {
            setSelectedSlug(e.target.value);
            setError("");
          }}
          className="w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm text-white disabled:opacity-40"
        >
          <option value="" className="bg-[#131313]">
            Select project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.slug} className="bg-[#131313]">
              {p.client_name || p.name || p.slug} — {p.slug}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4">
        <ZipFileInput
          label="High-Res ZIP (For Print)"
          sublabel="Click to select high_res.zip"
          file={highResFile}
          onFile={setHighResFile}
          disabled={phase === "uploading"}
        />
        <ZipFileInput
          label="Web-Res ZIP (For Social Media)"
          sublabel="Click to select web_res.zip"
          file={webResFile}
          onFile={setWebResFile}
          disabled={phase === "uploading"}
        />
      </div>

      {phase === "uploading" && (
        <div className="mt-8">
          <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.15em] text-white/30">
            <span>Uploading</span>
            <span>{progress}%</span>
          </div>
          <div className="h-px w-full bg-white/10">
            <div
              className="h-px bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {error && (
          <p className="text-[11px] uppercase tracking-[0.15em] text-red-400/80">{error}</p>
        )}
        <button
          type="button"
          onClick={handleDeliver}
          disabled={!canSubmit}
          className="w-full bg-white py-3 text-sm text-black transition hover:bg-white/90 disabled:opacity-30"
        >
          {phase === "uploading" ? "Uploading…" : "Upload & Deliver"}
        </button>
      </div>
    </div>
  );
}
