import { useEffect, useState } from "react";

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PackageEditPanel({ pkg, onSave, onCancel, copy }) {
  const [draft, setDraft] = useState({ ...pkg, featuresText: pkg.features.join("\n") });
  function upd(k, v) { setDraft(d => ({ ...d, [k]: v })); }
  function save() {
    onSave({ ...draft, features: draft.featuresText.split("\n").map(s => s.trim()).filter(Boolean) });
  }
  return (
    <div style={{ background: "var(--site-bg-soft)", border: "1px solid var(--site-border-strong)", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {[["name", draft.name], ["price", draft.price], ["priceNote", draft.priceNote]].map(([k, v]) => (
        <input key={k} value={v} onChange={e => upd(k, e.target.value)}
          style={{ background: "transparent", border: "0", borderBottom: "1px solid var(--site-border)", color: "var(--site-text)", padding: "0.5rem 0", fontSize: "0.85rem", outline: "none", fontFamily: "var(--font-body)" }}
          placeholder={k} />
      ))}
      <textarea value={draft.description} onChange={e => upd("description", e.target.value)} rows={3}
        style={{ background: "transparent", border: "0", borderBottom: "1px solid var(--site-border)", color: "var(--site-muted)", padding: "0.5rem 0", fontSize: "0.8rem", resize: "none", outline: "none", fontFamily: "var(--font-body)" }} />
      <textarea value={draft.featuresText} onChange={e => upd("featuresText", e.target.value)} rows={4}
        placeholder="One feature per line"
        style={{ background: "transparent", border: "0", borderBottom: "1px solid var(--site-border)", color: "var(--site-muted)", padding: "0.5rem 0", fontSize: "0.8rem", resize: "none", outline: "none", fontFamily: "var(--font-body)" }} />
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "0.4rem 1rem", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", border: "1px solid var(--site-border)", background: "transparent", color: "var(--site-muted)", borderRadius: "9999px", cursor: "pointer" }}>{copy.cancelLabel || "Cancel"}</button>
        <button onClick={save} style={{ padding: "0.4rem 1rem", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", border: "1px solid var(--site-accent)", background: "transparent", color: "var(--site-accent)", borderRadius: "9999px", cursor: "pointer" }}>{copy.savePackageLabel || "Save"}</button>
      </div>
    </div>
  );
}

function PricingCard({ pkg, isAdmin, editingId, onEditStart, onEditSave, onEditCancel, copy, idx, total }) {
  const isEditing = editingId === pkg.id;
  const borderRight = idx < total - 1 ? "1px solid rgba(255,255,255,0.07)" : "none";
  if (isEditing) {
    return (
      <div style={{ padding: "3.5rem 2.5rem", borderRight }}>
        <PackageEditPanel pkg={pkg} onSave={onEditSave} onCancel={onEditCancel} copy={copy} />
      </div>
    );
  }
  return (
    <div style={{ position: "relative", padding: "3.5rem 2.5rem", borderRight, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "420px", transition: "background 0.5s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {isAdmin && (
        <button onClick={() => onEditStart(pkg.id)} title={copy.editPackageLabel || "Edit"}
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", border: "1px solid var(--site-border)", borderRadius: "0.6rem", background: "var(--site-bg-deep)", color: "var(--site-muted)", cursor: "pointer" }}>
          <PencilIcon />
        </button>
      )}
      <div>
        <span style={{ display: "block", marginBottom: "3rem", fontSize: "0.625rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
          {pkg.id} / {pkg.tier}
        </span>
        <h2 style={{ marginBottom: "1.5rem", fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", letterSpacing: "-0.04em", color: "var(--site-text)", lineHeight: 1.1 }}>{pkg.name}</h2>
        <p style={{ marginBottom: "2.5rem", fontSize: "0.875rem", lineHeight: 1.75, color: "var(--site-muted)", fontWeight: 300 }}>{pkg.description}</p>
        <ul style={{ marginBottom: "3rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {pkg.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.875rem", color: "var(--site-text)" }}>
              <span style={{ marginTop: "0.2em", width: "6px", height: "6px", borderRadius: "9999px", background: "var(--site-accent)", flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div style={{ marginBottom: "0.375rem", fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", letterSpacing: "-0.04em", color: "var(--site-text)" }}>{pkg.price}</div>
        <div style={{ fontSize: "0.625rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{pkg.priceNote}</div>
      </div>
    </div>
  );
}

export function BookingProjectsSection({ copy, locale, isAdmin }) {
  const b = copy.booking;
  const [packages, setPackages] = useState(() => b.packages || []);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { if (b.packages) setPackages(b.packages); }, [b.packages]);

  const borderColor = "rgba(255,255,255,0.07)";

  return (
    <section id="booking" style={{ background: "var(--site-bg)" }}>
      {/* Hero */}
      <div style={{ maxWidth: "80rem", padding: "8rem 3rem 6rem" }}>
        <span style={{ display: "block", marginBottom: "1.5rem", fontSize: "0.625rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
          {b.eyebrow || "Curated Services"}
        </span>
        <h1 style={{ maxWidth: "52rem", fontFamily: "var(--font-display)", fontSize: "clamp(3rem,7vw,6rem)", lineHeight: 1.0, letterSpacing: "-0.055em", color: "var(--site-text)" }}>
          {b.heroHeading || "Visual Excellence"}<br />
          Tailored for the <em style={{ fontStyle: "italic" }}>{b.heroHeadingItalic || "Modern Aesthete"}</em>.
        </h1>
      </div>

      {/* Packages grid */}
      <div style={{ padding: "0 3rem 8rem" }}>
        <div style={{ borderTop: `1px solid ${borderColor}`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {packages.map((pkg, i) => (
            <PricingCard key={pkg.id} pkg={pkg} idx={i} total={packages.length}
              isAdmin={isAdmin} editingId={editingId}
              onEditStart={id => setEditingId(id)}
              onEditSave={updated => { setPackages(ps => ps.map(p => p.id === updated.id ? updated : p)); setEditingId(null); }}
              onEditCancel={() => setEditingId(null)}
              copy={b} />
          ))}
        </div>
      </div>

      {/* Miniprogram CTA */}
      <div style={{ background: "var(--site-bg-deep)", padding: "8rem 3rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexDirection: "row", gap: "5rem", flexWrap: "wrap", alignItems: "center" }}>

          {/* Left: copy */}
          <div style={{ flex: "0 0 28%", minWidth: "220px" }}>
            <span style={{ display: "block", marginBottom: "1.25rem", fontSize: "0.625rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
              Booking &amp; Inquiry
            </span>
            <h3 style={{ marginBottom: "1.5rem", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1, letterSpacing: "-0.045em", color: "var(--site-text)" }}>
              预约专属<br />
              <em style={{ fontStyle: "italic" }}>拍摄委托</em>
            </h3>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.85, color: "var(--site-muted)", fontWeight: 300 }}>
              请使用微信扫码进入 Lumina 专属小程序，开启您的影像定制之旅。
            </p>
          </div>

          {/* Right: QR placeholder */}
          <div style={{ flex: "1 1 0", minWidth: "280px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2rem" }}>
            {/* QR code box */}
            <div style={{
              width: "200px",
              height: "200px",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              borderRadius: "0.75rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              background: "rgba(212,175,55,0.03)",
              boxShadow: "0 0 40px rgba(212,175,55,0.06)",
            }}>
              {/* Grid icon suggesting QR */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5">
                <rect x="6" y="6" width="14" height="14" rx="1.5" />
                <rect x="28" y="6" width="14" height="14" rx="1.5" />
                <rect x="6" y="28" width="14" height="14" rx="1.5" />
                <rect x="10" y="10" width="6" height="6" fill="rgba(212,175,55,0.4)" stroke="none" />
                <rect x="32" y="10" width="6" height="6" fill="rgba(212,175,55,0.4)" stroke="none" />
                <rect x="10" y="32" width="6" height="6" fill="rgba(212,175,55,0.4)" stroke="none" />
                <rect x="28" y="28" width="6" height="6" fill="rgba(212,175,55,0.25)" stroke="none" />
                <rect x="36" y="28" width="6" height="6" fill="rgba(212,175,55,0.25)" stroke="none" />
                <rect x="28" y="36" width="6" height="6" fill="rgba(212,175,55,0.25)" stroke="none" />
                <rect x="36" y="36" width="6" height="6" fill="rgba(212,175,55,0.25)" stroke="none" />
              </svg>
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)", fontFamily: "var(--font-body)" }}>
                微信扫码
              </span>
            </div>

            <p style={{ fontSize: "0.625rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)", lineHeight: 1.8 }}>
              Lumina Miniprogram · WeChat Exclusive<br />
              <span style={{ color: "rgba(212,175,55,0.5)" }}>影像定制 · 选片 · 交付 · 一站完成</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
