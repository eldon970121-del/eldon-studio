import { useState, useEffect } from "react";
import { getProjectBySlug, submitSelection, verifyPasscode } from "../services/pamService";

function loadStoredSelection(slug) {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(`pam_sel_${slug}`) || "[]";
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function persistSelection(slug, nextSelection) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`pam_sel_${slug}`, JSON.stringify([...nextSelection]));
}

function normalizeSelections(value) {
  if (!Array.isArray(value)) {
    return new Set();
  }

  return new Set(
    value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          return entry.image_id ?? entry.id ?? null;
        }

        return entry;
      })
      .filter((entry) => entry !== null && entry !== undefined)
      .map(String),
  );
}

function getImageId(image, index) {
  if (image && typeof image === "object") {
    return String(image.id ?? image.storage_path ?? image.full_url ?? image.preview_url ?? image.url ?? index);
  }

  return String(index);
}

function getImageSrc(image) {
  if (typeof image === "string") {
    return image;
  }

  if (image && typeof image === "object") {
    return image.preview_url ?? image.full_url ?? image.url ?? "";
  }

  return "";
}

export function ClientPortalPage(props) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slug =
    props.slug ??
    (typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() : "") ??
    "";

  useEffect(() => {
    setIsUnlocked(false);
    setProjectData(null);
    setPasscode("");
    setError("");
    setLoading(false);
    setHasSubmitted(false);
    setSelectedIds(loadStoredSelection(slug));

    if (typeof window === "undefined") {
      return;
    }

    const savedSlug = sessionStorage.getItem("unlocked_slug");
    if (savedSlug && savedSlug === slug) {
      getProjectBySlug(slug)
        .then((data) => {
          if (data) {
            setProjectData(data);
            setIsUnlocked(true);
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    if (!projectData) {
      return;
    }

    const storedSelection = loadStoredSelection(slug);
    if (storedSelection.size > 0) {
      setSelectedIds(storedSelection);
      return;
    }

    setSelectedIds(normalizeSelections(projectData.selections));
  }, [projectData, slug]);

  async function handlePasscodeSubmit(e) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const valid = await verifyPasscode(slug, passcode.trim());
      if (valid) {
        const data = await getProjectBySlug(slug);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("unlocked_slug", slug);
        }
        setProjectData(data);
        setIsUnlocked(true);
      } else {
        setError("Incorrect Passcode");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(imageId) {
    const key = String(imageId);
    const nextSelection = new Set(selectedIds);

    if (nextSelection.has(key)) {
      nextSelection.delete(key);
    } else {
      nextSelection.add(key);
    }

    setSelectedIds(nextSelection);
    persistSelection(slug, nextSelection);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const payload = [...selectedIds].map((imageId) => ({ imageId: String(imageId) }));
      await submitSelection(slug, payload);
      persistSelection(slug, selectedIds);
      setHasSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const images = Array.isArray(projectData?.images) ? projectData.images : [];
  const projectTitle = projectData?.client_name || projectData?.name || slug || "Private Gallery";
  const projectStatus = projectData?.status || "";

  if (!isUnlocked) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
        <form onSubmit={handlePasscodeSubmit} className="flex w-full max-w-xs flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">Client Area</span>
            <p className="text-sm uppercase tracking-[0.28em] text-white/60">{slug || "Private Gallery"}</p>
          </div>
          <div className="relative w-full">
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              placeholder="Passcode"
              autoComplete="current-password"
              className="w-full border-b border-white/20 bg-transparent pb-3 text-center text-sm uppercase tracking-[0.28em] text-white outline-none placeholder:text-white/25 focus:border-white/60"
            />
            {error ? (
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-red-400/80">{error}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/50 transition duration-300 hover:border-white/60 hover:text-white disabled:opacity-30"
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : (
              <span className="text-base leading-none">→</span>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <span className="h-5 w-5 animate-spin rounded-full border border-white/20 border-t-white/80" />
      </div>
    );
  }

  if (projectStatus === "selection_completed" || hasSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div className="flex flex-col items-center gap-6">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">Eldon Studio</span>
          <h1 className="font-serif text-3xl font-light tracking-wide">Editing in Progress</h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/50">
            Your selections have been submitted. Eldon Studio is now applying the final cinematic touch.
          </p>
        </div>
      </div>
    );
  }

  if (projectStatus === "delivered") {
    const urlHigh = projectData?.download_url_high ?? null;
    const urlWeb = projectData?.download_url_web ?? null;
    const linksReady = urlHigh || urlWeb;

    function triggerDownload(url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">Eldon Studio</span>
            <h1 className="font-serif text-3xl font-light tracking-wide">Your Collection is Ready.</h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/50">
              Thank you for creating with Eldon Studio.
            </p>
          </div>

          {!linksReady ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Preparing links…</p>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
              {urlHigh ? (
                <button
                  type="button"
                  onClick={() => triggerDownload(urlHigh)}
                  className="w-56 border border-white/30 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-white hover:text-black"
                >
                  Download High-Res
                  <span className="mt-0.5 block text-[10px] tracking-[0.15em] opacity-50">For Print</span>
                </button>
              ) : null}
              {urlWeb ? (
                <button
                  type="button"
                  onClick={() => triggerDownload(urlWeb)}
                  className="w-56 border border-white/30 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-white hover:text-black"
                >
                  Download Web-Res
                  <span className="mt-0.5 block text-[10px] tracking-[0.15em] opacity-50">For Social Media</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#131313]/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="font-serif text-sm">{projectTitle}</p>
          <p className="text-sm text-white/50">{selectedIds.size} selected</p>
        </div>
      </header>

      <div className="columns-2 gap-3 p-6 md:columns-3 lg:columns-4">
        {images.map((image, index) => {
          const imageId = getImageId(image, index);
          const imageSrc = getImageSrc(image);
          const isSelected = selectedIds.has(imageId);

          if (!imageSrc) {
            return null;
          }

          return (
            <button
              key={imageId}
              type="button"
              onClick={() => handleToggle(imageId)}
              className={[
                "group relative mb-3 block w-full cursor-pointer overflow-hidden text-left",
                isSelected ? "ring-2 ring-white" : "",
              ].join(" ")}
            >
              <img src={imageSrc} className="w-full object-cover" loading="lazy" alt="" />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
              <span className="absolute bottom-2 right-2 p-2 text-xl">
                {isSelected ? (
                  <span className="text-white">♥</span>
                ) : (
                  <span className="text-white/40 transition group-hover:text-white/70">♡</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#131313] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-sm text-white/60">{selectedIds.size} photos selected</p>
          <div className="flex flex-col items-end gap-2">
            {error ? <p className="text-sm text-red-400/80">{error}</p> : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || submitting}
              className="bg-white px-6 py-2 text-sm text-black transition hover:bg-white/90 disabled:opacity-30"
            >
              Submit Selection →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
