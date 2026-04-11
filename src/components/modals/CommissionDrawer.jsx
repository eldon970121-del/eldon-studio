import { useEffect, useRef, useState } from "react";

/* ── 关闭图标 ── */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ── 铅笔图标 ── */
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/* ── 套餐编辑面板 ── */
function PackageEditPanel({ pkg, onSave, onCancel, copy }) {
  const [draft, setDraft] = useState({ ...pkg, featuresText: pkg.features.join("\n") });
  function upd(k, v) { setDraft(d => ({ ...d, [k]: v })); }
  function save() {
    onSave({ ...draft, features: draft.featuresText.split("\n").map(s => s.trim()).filter(Boolean) });
  }
  const inputStyle = {
    background: "transparent", border: "0", borderBottom: "1px solid rgba(255,255,255,0.1)",
    color: "var(--site-text)", padding: "0.5rem 0", fontSize: "0.82rem", outline: "none",
    fontFamily: "var(--font-body)", width: "100%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {[["name", draft.name], ["price", draft.price], ["priceNote", draft.priceNote]].map(([k, v]) => (
        <input key={k} value={v} onChange={e => upd(k, e.target.value)} style={inputStyle} placeholder={k} />
      ))}
      <textarea value={draft.description} onChange={e => upd("description", e.target.value)} rows={2}
        style={{ ...inputStyle, resize: "none" }} />
      <textarea value={draft.featuresText} onChange={e => upd("featuresText", e.target.value)} rows={3}
        placeholder="One feature per line" style={{ ...inputStyle, resize: "none" }} />
      <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
        <button onClick={onCancel} style={{ padding: "0.35rem 0.875rem", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "var(--site-muted)", borderRadius: "9999px", cursor: "pointer" }}>
          {copy.cancelLabel || "Cancel"}
        </button>
        <button onClick={save} style={{ padding: "0.35rem 0.875rem", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", border: "1px solid var(--site-accent)", background: "transparent", color: "var(--site-accent)", borderRadius: "9999px", cursor: "pointer" }}>
          {copy.savePackageLabel || "Save"}
        </button>
      </div>
    </div>
  );
}

/* ── 单个套餐卡片 ── */
function PricingCard({ pkg, isAdmin, editingId, onEditStart, onEditSave, onEditCancel, copy }) {
  const isEditing = editingId === pkg.id;
  return (
    <div style={{
      padding: "2rem 1.75rem",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.015)",
      borderRadius: "1rem",
      position: "relative",
    }}>
      {isAdmin && !isEditing && (
        <button onClick={() => onEditStart(pkg.id)}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", width: "1.75rem", height: "1.75rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", background: "rgba(255,255,255,0.04)", color: "var(--site-muted)", cursor: "pointer" }}>
          <PencilIcon />
        </button>
      )}
      {isEditing ? (
        <PackageEditPanel pkg={pkg} onSave={onEditSave} onCancel={onEditCancel} copy={copy} />
      ) : (
        <>
          <span style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
            {pkg.id} / {pkg.tier}
          </span>
          <h3 style={{ marginBottom: "0.75rem", fontFamily: "var(--font-display)", fontSize: "1.35rem", letterSpacing: "-0.03em", color: "var(--site-text)", lineHeight: 1.2 }}>
            {pkg.name}
          </h3>
          <p style={{ marginBottom: "1.25rem", fontSize: "0.8rem", lineHeight: 1.75, color: "var(--site-muted)", fontWeight: 300 }}>
            {pkg.description}
          </p>
          <ul style={{ marginBottom: "1.5rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {pkg.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8rem", color: "var(--site-text)" }}>
                <span style={{ marginTop: "0.3em", width: "5px", height: "5px", borderRadius: "9999px", background: "var(--site-accent)", flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "-0.03em", color: "var(--site-text)" }}>{pkg.price}</div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{pkg.priceNote}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   CommissionDrawer — 主组件
   Props:
     isOpen: boolean
     onClose: () => void
     copy: siteCopy[locale]
     isAdmin: boolean
══════════════════════════════════════════ */
export function CommissionDrawer({ isOpen, onClose, copy, isAdmin }) {
  const b = copy.booking;
  const [packages, setPackages] = useState(() => b.packages || []);
  const [editingId, setEditingId] = useState(null);
  const drawerRef = useRef(null);

  // 同步 copy 变化
  useEffect(() => { if (b.packages) setPackages(b.packages); }, [b.packages]);

  // 锁定 body 滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* ── 蒙层 ── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── 抽屉面板 ── */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
          width: "min(520px, 100vw)",
          background: "linear-gradient(160deg, #111114 0%, #0d0d10 60%, #0a0a0c 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "-40px 0 120px rgba(0,0,0,0.6)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* 顶部栏 */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.5rem 2rem",
          background: "rgba(10,10,12,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div>
            <span style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)", marginBottom: "0.25rem" }}>
              {b.eyebrow || "Curated Services"}
            </span>
            <span style={{ fontSize: "1rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--site-text)" }}>
              {b.dialogueHeading || "Commission"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.25rem", height: "2.25rem",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              color: "var(--site-muted)",
              cursor: "pointer",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--site-text)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--site-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>

          {/* 简介文案 */}
          <p style={{ fontSize: "0.82rem", lineHeight: 1.85, color: "var(--site-muted)", fontWeight: 300, paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {b.dialogueText}
          </p>

          {/* 套餐列表 */}
          {packages.map((pkg) => (
            <PricingCard
              key={pkg.id}
              pkg={pkg}
              isAdmin={isAdmin}
              editingId={editingId}
              onEditStart={id => setEditingId(id)}
              onEditSave={updated => { setPackages(ps => ps.map(p => p.id === updated.id ? updated : p)); setEditingId(null); }}
              onEditCancel={() => setEditingId(null)}
              copy={b}
            />
          ))}

          {/* 微信二维码 CTA */}
          <div style={{
            marginTop: "0.5rem",
            padding: "1.75rem",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: "1rem",
            background: "rgba(212,175,55,0.03)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            textAlign: "center",
          }}>
            <div style={{
              width: "160px", height: "160px",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: "0.75rem",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.625rem",
              background: "rgba(212,175,55,0.03)",
            }}>
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5">
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
              <span style={{ fontSize: "0.52rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)", fontFamily: "var(--font-body)" }}>
                微信扫码
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", lineHeight: 1.8, color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
              请使用微信扫码进入 Lumina 专属小程序<br />
              <span style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.65rem", letterSpacing: "0.12em" }}>影像定制 · 选片 · 交付 · 一站完成</span>
            </p>
          </div>

          {/* 底部说明 */}
          <p style={{ fontSize: "0.7rem", lineHeight: 1.8, color: "rgba(255,255,255,0.2)", textAlign: "center", paddingBottom: "2rem" }}>
            {b.responseNote}
          </p>
        </div>
      </div>
    </>
  );
}
