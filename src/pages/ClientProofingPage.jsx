import { useEffect, useState } from "react";
import { submitSelection } from "../services/pamService";
import { CLIENT_VAULTS } from "./mockClientData";

const LUMINA_API = import.meta.env.VITE_LUMINA_API || 'https://lumina-server-production.up.railway.app';

const aspectRatioMap = {
  portrait: "4 / 5",
  square: "1 / 1",
  landscape: "3 / 2",
};

function GatekeeperView({ vault, slug, onUnlock }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const authKey = `client-proofing-auth:${slug}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !pin.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${LUMINA_API}/api/auth/client-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), pin: pin.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('lumina_client_token', data.token);
        sessionStorage.setItem(authKey, "true");
        onUnlock(data);
        return;
      }

      // 兜底：若后端尚未实装，降级至 vault passcode 校验
      if (vault && pin === vault.passcode) {
        sessionStorage.setItem(authKey, "true");
        onUnlock({});
        return;
      }

      throw new Error(data.message || "Verification failed");
    } catch (err) {
      setError(err.message === "Verification failed" ? err.message : "无法连接到 Lumina 引擎，请稍后重试");
      setShakeKey((v) => v + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div
        key={shakeKey}
        className="w-full max-w-xl rounded-[2rem] border px-6 py-8 shadow-soft sm:px-8 sm:py-10"
        style={{
          animation: error ? "proof-shake 360ms ease-in-out" : undefined,
          borderColor: "var(--site-border-soft)",
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.025) 100%), var(--site-bg-deep)",
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.42em]" style={{ color: "var(--site-accent)" }}>
          Client Vault
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
          {vault?.clientName ?? "Private Archive"}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 sm:text-[15px]" style={{ color: "var(--site-muted)" }}>
          Enter your registered email and the exclusive access PIN to unlock your image archive.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="field-shell">
            <span className="field-label">Email</span>
            <input
              autoComplete="email"
              className="field-input"
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="field-shell">
            <span className="field-label">专属访问码 / Access PIN</span>
            <input
              autoComplete="one-time-code"
              className="field-input tracking-[0.3em]"
              maxLength={8}
              onChange={(e) => { setPin(e.target.value.toUpperCase()); setError(""); }}
              placeholder="XXXXXX"
              required
              type="password"
              value={pin}
            />
          </label>

          {error ? (
            <p className="text-sm" style={{ color: "#ffb4b4" }}>{error}</p>
          ) : null}

          <button
            className="micro-button mt-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] disabled:opacity-50 transition-opacity"
            disabled={loading}
            style={{
              backgroundColor: "var(--site-accent)",
              color: "var(--site-bg-deep)",
            }}
            type="submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Verifying...
              </span>
            ) : "Unlock Vault →"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ProofImageCard({ image, note, selected, onNoteChange, onToggle }) {
  return (
    <article
      className="proof-masonry-item group relative overflow-hidden rounded-[1.65rem] border"
      style={{
        borderColor: selected ? "var(--site-accent)" : "var(--site-border-soft)",
        backgroundColor: "var(--site-bg-deep)",
        boxShadow: selected ? "0 18px 42px rgba(0, 0, 0, 0.28)" : "none",
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: aspectRatioMap[image.aspect] || "4 / 5" }}>
        <img
          alt=""
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
          loading="lazy"
          src={image.url}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background: "linear-gradient(180deg, rgba(15, 16, 20, 0) 0%, rgba(15, 16, 20, 0.84) 100%)",
          }}
        />

        <button
          aria-label={selected ? `Remove ${image.id} from selections` : `Select ${image.id}`}
          className={`micro-button absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border text-lg ${
            selected ? "text-white" : "text-white/30"
          }`}
          onClick={() => onToggle(image.id)}
          style={{
            borderColor: selected ? "var(--site-accent)" : "rgba(255, 255, 255, 0.16)",
            backgroundColor: selected ? "var(--site-accent)" : "rgba(15, 16, 20, 0.68)",
          }}
          type="button"
        >
          {selected ? "\u2665" : "\u2661"}
        </button>

        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 px-4 pb-4">
          <span
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
            style={{
              backgroundColor: "rgba(15, 16, 20, 0.78)",
              color: "var(--site-muted)",
            }}
          >
            {image.id}
          </span>

          {selected ? (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
              style={{
                backgroundColor: "rgba(124, 156, 255, 0.18)",
                color: "var(--site-accent)",
              }}
            >
              Selected
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="border-t px-4 py-4"
        style={{
          borderColor: "var(--site-border-soft)",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <input
          aria-label={`Add note for ${image.id}`}
          className="w-full rounded-full border px-4 py-3 text-sm outline-none transition"
          onChange={(event) => onNoteChange(image.id, event.target.value)}
          placeholder="Add retouch note"
          style={{
            borderColor: "rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(15, 16, 20, 0.72)",
            color: "var(--site-text)",
          }}
          type="text"
          value={note}
        />
      </div>
    </article>
  );
}

function ProofingGallery({ slug, vault, onSubmit }) {
  const images = vault?.images ?? [];
  const proofingSlug = slug ?? "";
  const storageKey = `client-proofing-selection:${proofingSlug}`;
  const [localSelections, setLocalSelections] = useState(() =>
    images.map((img) => ({ imageId: img.id, isSelected: false, clientNote: "" }))
  );
  const [submitState, setSubmitState] = useState("idle");

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return;
      }

      setLocalSelections(
        images.map((img) => {
          const saved = parsed.find((item) => item?.imageId === img.id);
          return {
            imageId: img.id,
            isSelected: Boolean(saved?.isSelected),
            clientNote: typeof saved?.clientNote === "string" ? saved.clientNote : "",
          };
        })
      );
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [images, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(localSelections));
  }, [localSelections, storageKey]);

  const selectedCount = localSelections.filter((selection) => selection.isSelected).length;

  function toggleSelect(imageId) {
    setLocalSelections((prev) =>
      prev.map((selection) =>
        selection.imageId === imageId ? { ...selection, isSelected: !selection.isSelected } : selection
      )
    );
  }

  function updateNote(imageId, note) {
    setLocalSelections((prev) =>
      prev.map((selection) => (selection.imageId === imageId ? { ...selection, clientNote: note } : selection))
    );
  }

  async function handleSubmit() {
    const payload = localSelections
      .filter((selection) => selection.isSelected)
      .map((selection) => ({ imageId: selection.imageId, note: selection.clientNote || undefined }));

    setSubmitState("loading");

    try {
      await submitSelection(proofingSlug, payload);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black px-6 text-center">
        <span className="mb-6 text-[10px] uppercase tracking-[0.4em] text-white/30">Confirmed</span>
        <p className="max-w-sm text-lg font-light leading-relaxed tracking-wide text-white/80">
          Selection Received. We will begin the final retouching process.
        </p>
      </div>
    );
  }

  return (
    <section className="min-h-screen px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--site-border-soft)" }}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em]" style={{ color: "var(--site-accent)" }}>
              Client Proofing
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
              {vault.projectTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-[15px]" style={{ color: "var(--site-muted)" }}>
              Review the full edit, tap the heart on any frame you want to keep, and submit once your final shortlist is ready.
            </p>
          </div>

          <div
            className="rounded-[1.5rem] border px-5 py-4 text-sm"
            style={{
              borderColor: "var(--site-border-soft)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%), var(--site-bg-deep)",
            }}
          >
            <p style={{ color: "var(--site-text)" }}>{vault.clientName}</p>
            <p className="mt-2" style={{ color: "var(--site-muted)" }}>
              {selectedCount} selected
            </p>
          </div>
        </header>

        <div className="mt-8 proof-masonry">
          {images.map((image) => {
            const selection = localSelections.find((item) => item.imageId === image.id);

            return (
              <ProofImageCard
                image={image}
                key={image.id}
                note={selection?.clientNote ?? ""}
                onNoteChange={updateNote}
                onToggle={toggleSelect}
                selected={selection?.isSelected ?? false}
              />
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8">
          <div
            className="mx-auto flex max-w-4xl flex-col gap-4 rounded-[1.8rem] border px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{
              borderColor: "var(--site-border-soft)",
              background:
                "linear-gradient(180deg, rgba(23, 25, 32, 0.96) 0%, rgba(15, 16, 20, 0.98) 100%)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em]" style={{ color: "var(--site-accent)" }}>
                Selection Status
              </p>
              <p className="mt-2 text-sm sm:text-[15px]" style={{ color: "var(--site-text)" }}>
                {selectedCount} selected
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--site-muted)" }}>
                Add optional notes to any selected frame before you submit your final shortlist.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              {submitState === "error" ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/80">
                  Submission failed. Please try again.
                </p>
              ) : null}

              <button
                className="micro-button rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitState === "loading" || !selectedCount}
                onClick={handleSubmit}
                style={{
                  backgroundColor: "var(--site-accent)",
                  color: "var(--site-bg-deep)",
                }}
                type="button"
              >
                Submit Selections
              </button>
            </div>
          </div>
        </div>
      </div>

      {submitState === "loading" ? (
        <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-black">
          <span className="h-6 w-6 animate-spin rounded-full border border-white/20 border-t-white/80" />
        </div>
      ) : null}
    </section>
  );
}

function SuccessView({ clientName, count }) {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div
        className="w-full max-w-2xl rounded-[2rem] border px-6 py-10 text-center shadow-soft sm:px-10"
        style={{
          animation: "proof-fade-in 420ms ease-out",
          borderColor: "var(--site-border-soft)",
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%), var(--site-bg-deep)",
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.42em]" style={{ color: "var(--site-accent)" }}>
          Selections Received
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
          Thank you, {clientName}
        </h1>
        <p className="mt-4 text-sm leading-7 sm:text-[15px]" style={{ color: "var(--site-muted)" }}>
          Your shortlist has been recorded. We received {count} selected {count === 1 ? "image" : "images"} and
          will use this set for the next review round.
        </p>
      </div>
    </section>
  );
}

export default function ClientProofingPage({ slug }) {
  const vault = CLIENT_VAULTS[slug];
  const [phase, setPhase] = useState(vault ? "gate" : "missing");
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    if (!vault) {
      setPhase("missing");
      return;
    }

    const authKey = `client-proofing-auth:${slug}`;
    const isAuthorized = sessionStorage.getItem(authKey) === "true";
    setPhase(isAuthorized ? "proofing" : "gate");
  }, [slug, vault]);

  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(124, 156, 255, 0.16), transparent 28%), radial-gradient(circle at 85% 18%, rgba(124, 156, 255, 0.1), transparent 18%), linear-gradient(180deg, var(--site-bg) 0%, var(--site-bg-deep) 100%)",
        color: "var(--site-text)",
      }}
    >
      <style>{`
        @keyframes proof-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        @keyframes proof-fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .proof-masonry {
          column-count: 1;
          column-gap: 1.25rem;
        }

        .proof-masonry-item {
          break-inside: avoid;
          margin-bottom: 1.25rem;
        }

        @media (min-width: 768px) {
          .proof-masonry {
            column-count: 2;
          }
        }

        @media (min-width: 1100px) {
          .proof-masonry {
            column-count: 3;
          }
        }
      `}</style>

      {phase === "missing" ? (
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
          <div
            className="w-full max-w-xl rounded-[2rem] border px-6 py-8 text-center shadow-soft sm:px-8 sm:py-10"
            style={{
              borderColor: "var(--site-border-soft)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.025) 100%), var(--site-bg-deep)",
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.42em]" style={{ color: "var(--site-accent)" }}>
              Client Vault
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">Vault Not Found</h1>
            <p className="mt-4 text-sm leading-7 sm:text-[15px]" style={{ color: "var(--site-muted)" }}>
              This proofing link is unavailable. Check the client slug and try again.
            </p>
          </div>
        </section>
      ) : null}

      {phase === "gate" && vault ? (
        <GatekeeperView
          onUnlock={() => {
            setPhase("proofing");
          }}
          slug={slug}
          vault={vault}
        />
      ) : null}

      {phase === "proofing" && vault ? (
        <ProofingGallery
          onSubmit={(selectedIds) => {
            setSubmittedCount(selectedIds.length);
            setPhase("success");
          }}
          slug={slug}
          vault={vault}
        />
      ) : null}

      {phase === "success" && vault ? (
        <SuccessView clientName={vault.clientName} count={submittedCount} />
      ) : null}
    </main>
  );
}
