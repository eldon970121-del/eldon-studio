import { useRef } from "react";
import { RevealBlock } from "../ui/RevealBlock";

export function AdminDataPanel({
  backupFileName,
  backupStatus,
  onExport,
  onSelectFile,
  onRestore,
}) {
  const inputRef = useRef(null);
  
  // 状态提示条的动态样式
  const statusClass =
    backupStatus?.tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100"
      : backupStatus?.tone === "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
        : "border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 text-[color:var(--site-muted)]";

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10 animate-fade-in">
      <RevealBlock className="overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          
          {/* 左侧：页面标题与说明 */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--site-accent)]">
              系统设置
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl tracking-[-0.03em]">
              数据备份
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
              可将当前浏览器中的摄影归档导出为 JSON 备份，也可在管理模式内恢复此前导出的备份文件。
            </p>
          </div>

          {/* 右侧：操作控制台 */}
          <div className="rounded-[1.7rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              数据操作
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              备份包含摄影集字段、摄影师资料、封面选择，以及本地持久化保存的图片数据。
            </p>

            {/* 隐藏的文件输入框 */}
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
            />

            {/* 核心按钮组 */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExport}
                className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#10131c] transition hover:bg-[color:var(--site-accent-strong)]"
              >
                导出备份
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                选择备份文件
              </button>
              <button
                type="button"
                onClick={onRestore}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                恢复备份
              </button>
            </div>

            {/* 当前选中文件状态 */}
            <div className="mt-5 rounded-[1.25rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-panel-soft)]/68 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                已选文件
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-text)]">
                {backupFileName || "未选择任何备份文件"}
              </p>
            </div>

            {/* 成功/错误消息提示 */}
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