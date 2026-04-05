import { useEffect, useState } from "react";
import { createProject } from "../../services/pamService";

function deriveSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [passcode, setPasscode] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPasscode(String(Math.floor(1000 + Math.random() * 9000)));
    } else {
      setName("");
      setSlug("");
      setPasscode("");
      setSlugManuallyEdited(false);
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createProject({
        name: name.trim(),
        slug: slug.trim(),
        passcode: passcode.trim(),
      });

      await onCreated();
      onClose();
    } catch (submitError) {
      setError(submitError?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
      <div className="w-full max-w-md rounded-sm border border-white/10 bg-[#1a1a1a] p-8 text-white">
        <h2 className="mb-6 font-serif text-xl">New Project</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/40">
              Project Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);

                if (!slugManuallyEdited) {
                  setSlug(deriveSlug(nextName));
                }
              }}
              className="w-full bg-transparent border-b border-white/30 text-white py-2 text-sm outline-none focus:border-white placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/40">Slug</label>
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={slug}
              onChange={(event) => {
                setSlugManuallyEdited(true);
                setSlug(event.target.value);
              }}
              className="w-full bg-transparent border-b border-white/30 text-white py-2 text-sm outline-none focus:border-white placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/40">
              Passcode
            </label>
            <input
              type="text"
              required
              minLength={4}
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="w-full bg-transparent border-b border-white/30 text-white py-2 text-sm outline-none focus:border-white placeholder:text-white/20"
            />
          </div>

          {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}

          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-white/40 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-sm bg-white text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
