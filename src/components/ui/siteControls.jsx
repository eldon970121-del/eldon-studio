import { motion, useMotionValue, useSpring } from "framer-motion";

export function MagneticButton({
  as = "button",
  className = "",
  children,
  disabled = false,
  onMouseMove,
  onMouseLeave,
  ...props
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 20, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 240, damping: 20, mass: 0.3 });
  const Component = as === "a" ? motion.a : motion.button;

  function handleMouseMove(event) {
    if (disabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const offsetY = (event.clientY - rect.top - rect.height / 2) / rect.height;
    x.set(offsetX * 14);
    y.set(offsetY * 12);
    onMouseMove?.(event);
  }

  function handleMouseLeave(event) {
    x.set(0);
    y.set(0);
    onMouseLeave?.(event);
  }

  return (
    <Component
      {...props}
      className={`micro-button ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.985 }}
      disabled={disabled}
    >
      {children}
    </Component>
  );
}

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function IconArrow({ direction = "left" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 fill-none stroke-current stroke-[1.7] ${direction === "right" ? "rotate-180" : ""}`}
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function AdminActionButton({ label, onClick, tone = "default", children }) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 text-red-300 hover:border-red-400/60 hover:text-red-100"
      : "border-[color:var(--site-border)] text-[color:var(--site-muted-strong)] hover:border-[color:var(--site-accent)] hover:text-[color:var(--site-text)]";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-[color:var(--site-bg-deep)]/88 backdrop-blur-md ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function InlineLanguageToggle({ locale, onToggle, isSolid }) {
  return (
    <div
      className={`inline-flex rounded-full border p-1 backdrop-blur-md transition ${
        isSolid ? "border-black/10 bg-white/72" : "border-white/15 bg-white/10"
      }`}
    >
      {[
        { value: "en", label: "EN" },
        { value: "zh", label: "中文" },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onToggle(item.value)}
          className="micro-button relative overflow-hidden rounded-full px-3 py-2 text-[11px] font-medium transition"
        >
          {locale === item.value ? (
            <motion.span
              layoutId="locale-pill-inline"
              className="absolute inset-0 rounded-full bg-[color:var(--site-accent)]"
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            />
          ) : null}
          <motion.span
            key={`${item.value}-${locale}-inline`}
            initial={{ opacity: 0.58, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative z-10 ${
              locale === item.value
                ? "text-white"
                : isSolid
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-white/78 hover:text-white"
            }`}
          >
            {item.label}
          </motion.span>
        </button>
      ))}
    </div>
  );
}

export function InlineModeToggle({ active, onToggle, label, activeLabel, inactiveLabel, isSolid }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      className={`micro-button inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.28em] transition ${
        active
          ? "border-[color:var(--site-accent)] bg-[color:var(--site-accent)] text-white"
          : isSolid
            ? "border-black/10 bg-black/[0.03] text-slate-700 hover:text-slate-950"
            : "border-white/14 bg-white/[0.06] text-white/72 hover:text-white"
      }`}
      aria-pressed={active}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-[color:var(--site-accent)]"}`} />
      <span>{label}</span>
      <span className={active ? "text-white/80" : ""}>{active ? activeLabel : inactiveLabel}</span>
    </button>
  );
}
