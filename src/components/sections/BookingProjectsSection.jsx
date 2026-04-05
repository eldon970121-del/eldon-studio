import { useEffect, useState } from "react";
import { submitBookingToLumina } from "../../services/booking";

const EMPTY_FORM = { name: "", email: "", projectType: "editorial", preferredDate: "", narrative: "" };

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

export function BookingProjectsSection({ copy, locale, luminaUrl, isAdmin }) {
  const b = copy.booking;
  const [packages, setPackages] = useState(() => b.packages || []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => { if (b.packages) setPackages(b.packages); }, [b.packages]);

  function handleChange(e) { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setIsSubmitted(false);
    try {
      const result = await submitBookingToLumina({ clientName: form.name.trim(), contactEmail: form.email.trim(), shootType: form.projectType, preferredDate: form.preferredDate, budgetRange: "", createdAt: new Date().toISOString() });
      if (result?.ok) { setForm(EMPTY_FORM); setIsSubmitted(true); }
    } catch {
      setSubmitError(b.submitError || (locale === "zh" ? "提交失败，请稍后重试。" : "Submission failed. Please try again shortly."));
    } finally { setIsSubmitting(false); }
  }

  const projectTypes = b.shootTypeOptions || [];

  const sectionBg = "var(--site-bg)";
  const deepBg = "var(--site-bg-deep)";
  const borderColor = "rgba(255,255,255,0.07)";
  const inputBase = { background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "var(--site-text)", padding: "0.75rem 0", fontSize: "0.875rem", outline: "none", width: "100%", fontFamily: "var(--font-body)", transition: "border-color 0.25s" };

  return (
    <section id="booking" style={{ background: sectionBg }}>
      {/* Hero */}
      <div style={{ maxWidth: "80rem", padding: "8rem 3rem 6rem", marginBottom: 0 }}>
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

      {/* Contact form */}
      <div style={{ background: deepBg, padding: "8rem 3rem" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexDirection: "row", gap: "5rem", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 28%", minWidth: "220px" }}>
            <h3 style={{ marginBottom: "2rem", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.1, letterSpacing: "-0.045em", color: "var(--site-text)" }}>
              {(b.dialogueHeading || "Start the Dialogue").split(" ").slice(0, 2).join(" ")}<br />
              {(b.dialogueHeading || "Start the Dialogue").split(" ").slice(2).join(" ")}
            </h3>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.85, color: "var(--site-muted)", fontWeight: 300 }}>
              {b.dialogueText || "Each project is a unique collaboration. Please share your vision, and we will contact you within 24 hours to schedule a deep-dive consultation."}
            </p>
          </div>

          <div style={{ flex: "1 1 0", minWidth: "280px" }}>
            {isSubmitted ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderBottom: `1px solid ${borderColor}`, padding: "2rem 0" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "9999px", background: "var(--site-accent)", flexShrink: 0 }} />
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>
                  {b.successMsg || (locale === "zh" ? "感谢您的询问，我们将在 24 小时内联系您。" : "Inquiry received. We will reach out within 24 hours.")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem 3rem" }}>
                {[
                  { label: b.nameLabel || "Name", name: "name", type: "text", placeholder: b.namePlaceholder || "E.g. Julian Vayne", required: true, span: false },
                  { label: b.emailLabel || "Email Address", name: "email", type: "email", placeholder: b.emailPlaceholder || "your@email.com", required: true, span: false },
                ].map(({ label, name, type, placeholder, required }) => (
                  <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.625rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{label}</label>
                    <input type={type} name={name} required={required} placeholder={placeholder} value={form[name]} onChange={handleChange} style={inputBase} />
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.625rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{b.projectTypeLabel || "Project Type"}</label>
                  <select name="projectType" value={form.projectType} onChange={handleChange} style={{ ...inputBase, appearance: "none", backgroundColor: "transparent" }}>
                    {projectTypes.map(opt => <option key={opt.value} value={opt.value} style={{ background: "var(--site-bg-deep)" }}>{opt.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.625rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{b.dateLabel || "Preferred Date"}</label>
                  <input type="date" name="preferredDate" required value={form.preferredDate} onChange={handleChange} style={{ ...inputBase, colorScheme: "dark" }} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.625rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--site-muted)", fontFamily: "var(--font-body)" }}>{b.narrativeLabel || "Project Narrative"}</label>
                  <textarea name="narrative" rows={4} placeholder={b.narrativePlaceholder || "Briefly describe..."} value={form.narrative} onChange={handleChange} style={{ ...inputBase, resize: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }} />
                </div>
                {submitError && (
                  <p style={{ gridColumn: "1 / -1", fontSize: "0.625rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#f87171", fontFamily: "var(--font-body)" }}>{submitError}</p>
                )}
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={isSubmitting}
                    style={{ padding: "1.1rem 3.5rem", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", background: "var(--site-text)", color: "var(--site-bg-deep)", fontFamily: "var(--font-body)", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.55 : 1, transition: "opacity 0.25s" }}>
                    {isSubmitting ? (b.sendingBtn || (locale === "zh" ? "提交中..." : "Sending...")) : (b.sendBtn || (locale === "zh" ? "发送询问" : "Send Inquiry"))}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
