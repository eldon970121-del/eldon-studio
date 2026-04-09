import { useState, useRef, useEffect } from "react";
import { getLocalizedText } from "../../utils/siteHelpers";

// ─── SVG icons ────────────────────────────────────────────────────────────────
function IconDouyin() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

function IconXHS() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 7.5h-2.25v-.75a.75.75 0 0 0-1.5 0v.75H10.5a.75.75 0 0 0 0 1.5h.44l-.94 3.75H9a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-1l-.94-3.75h.44a.75.75 0 0 0 0-1.5zm-4.06 5.25.94-3.75h1.24l.94 3.75H12.44z"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}

// ─── Social button with click-to-copy tooltip ─────────────────────────────────
const SOCIALS = [
  { id: "douyin",  Icon: IconDouyin,   label: "抖音",  handle: "勿阅星光",    copy: "勿阅星光" },
  { id: "xhs",     Icon: IconXHS,      label: "小红书", handle: "勿阅星光",   copy: "勿阅星光" },
  { id: "ig",      Icon: IconInstagram, label: "Instagram", handle: "@eldonstudio", copy: "@eldonstudio" },
];

function SocialButton({ social }) {
  const [state, setState] = useState("idle"); // idle | shown | copied
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleClick() {
    if (state === "idle") {
      setState("shown");
      return;
    }
    // shown or copied — attempt copy
    try {
      await navigator.clipboard.writeText(social.copy);
      setState("copied");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  // Click outside to dismiss
  const btnRef = useRef(null);
  useEffect(() => {
    if (state === "idle") return;
    function onOutside(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setState("idle");
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [state]);

  return (
    <div ref={btnRef} className="relative flex flex-col items-center">
      {/* Tooltip */}
      <div
        className="absolute bottom-full mb-3 pointer-events-none transition-all duration-300"
        style={{
          opacity: state !== "idle" ? 1 : 0,
          transform: state !== "idle" ? "translateY(0)" : "translateY(6px)",
          pointerEvents: state !== "idle" ? "auto" : "none",
        }}
        onClick={state === "shown" ? handleClick : undefined}
      >
        <div
          className="whitespace-nowrap rounded-lg px-3 py-2 text-[9px] tracking-[0.15em] cursor-pointer"
          style={{
            background: "rgba(15,15,15,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: state === "copied"
              ? "1px solid rgba(201,168,76,0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            color: state === "copied" ? "#c9a84c" : "rgba(255,255,255,0.65)",
            transition: "border-color 0.3s, color 0.3s",
          }}
        >
          {state === "copied"
            ? "✓ 已复制"
            : `${social.label}: ${social.handle} · 点击复制`}
        </div>
        {/* Arrow */}
        <div className="mx-auto mt-0.5 h-0 w-0"
          style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(255,255,255,0.1)" }} />
      </div>

      {/* Icon button */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={social.label}
        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300"
        style={{
          border: state !== "idle"
            ? "1px solid rgba(255,255,255,0.2)"
            : "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: state !== "idle" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
        }}
      >
        <social.Icon />
      </button>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer({ profile, copy, locale, luminaUrl }) {
  return (
    <footer id="footer" className="section-space-tight mx-auto max-w-7xl border-t border-[color:var(--site-border-soft)] px-4 sm:px-6 lg:px-10">
      <div className="rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.4em" }}>
              © 2026 {getLocalizedText(profile.name, locale)}
            </p>
            <p className="mt-3 max-w-md text-sm leading-[1.85]"
              style={{ color: "rgba(255,255,255,0.22)", letterSpacing: "0.02em" }}>
              {copy.footer.text}
            </p>
            <a
              href={luminaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[10px] uppercase tracking-[0.38em] transition-opacity hover:opacity-70"
              style={{ color: "rgba(201,168,76,0.6)" }}
            >
              {copy.footer.poweredBy}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {SOCIALS.map(s => <SocialButton key={s.id} social={s} />)}
          </div>
        </div>
      </div>
    </footer>
  );
}
