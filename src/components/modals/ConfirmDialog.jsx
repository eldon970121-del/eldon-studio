export function ConfirmDialog({ title, description, onCancel, onConfirm, copy }) {
  return (
    <div className="fixed inset-0 z-[132] flex items-center justify-center bg-[#0d0f14]/78 px-3 py-3 backdrop-blur-md sm:px-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-[2rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-5 shadow-soft sm:p-6"
        style={{ borderColor: "var(--site-border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">{copy.confirm.deleteLabel}</p>
        <h3 className="mt-3 font-display text-3xl text-[color:var(--site-text)]">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
          >
            {copy.confirm.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="micro-button rounded-full border border-red-500/40 px-5 py-3 text-sm uppercase tracking-[0.3em] text-red-300"
          >
            {copy.confirm.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
