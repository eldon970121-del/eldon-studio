import { useRef } from "react";
import { RevealBlock } from "../ui/RevealBlock";

export function AdminDataPanel({
  copy,
  locale,
  backupFileName,
  backupStatus,
  onExport,
  onSelectFile,
  onRestore,
}) {
  const inputRef = useRef(null);
  const statusClass =
    backupStatus?.tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100"
      : backupStatus?.tone === "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
        : "border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 text-[color:var(--site-muted)]";

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
      <RevealBlock className="overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h2
              className={`mt-4 font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${
                locale === "zh" ? "tracking-[-0.03em]" : "tracking-[-0.05em]"
              }`}
            >
              {copy.admin.dataTools}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.dataToolsText}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.dataTools}
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.dataToolsSummary}
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExport}
                className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#10131c] transition hover:bg-[color:var(--site-accent-strong)]"
              >
                {copy.admin.exportBackup}
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                {copy.admin.selectBackupFile}
              </button>
              <button
                type="button"
                onClick={onRestore}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                {copy.admin.restoreBackup}
              </button>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-panel-soft)]/68 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                {copy.admin.selectedBackup}
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-text)]">
                {backupFileName || copy.admin.noBackupSelected}
              </p>
            </div>

            {backupStatus?.message ? (
              <div className={`mt-4 rounded-[1.25rem] border px-4 py-3 text-sm ${statusClass}`}>
                {backupStatus.message}
              </div>
            ) : null}
          </div>
        </div>
      </RevealBlock>
    </section>
  );
}
