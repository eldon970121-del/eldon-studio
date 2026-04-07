import { useDropzone } from 'react-dropzone';
import { IconClose, IconUpload } from './ui/siteControls';

/**
 * Reusable file uploader with drag-drop, instant preview grid, delete icons,
 * and optional cover-selection grid.
 *
 * Props:
 *   files            — { id, file, previewUrl }[]  controlled staged files
 *   onAdd            — (acceptedFiles: File[]) => void
 *   onRemove         — (fileId: string) => void
 *   selectedCoverId  — string | null
 *   onCoverSelect    — (fileId: string) => void  (omit to hide cover grid)
 *   coverCandidates  — { id, url, source: 'staged'|'existing' }[]
 *                      (omit to derive from `files` only)
 *   copy             — { hint, browse, removeLabel, removeStagedLabel,
 *                        coverLabel, newLabel, savedLabel, coverSelectionLabel,
 *                        emptyCoverLabel }
 */
export function UniversalUploader({
  files = [],
  onAdd,
  onRemove,
  selectedCoverId = null,
  onCoverSelect,
  coverCandidates,
  copy,
}) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    noClick: true,
    onDrop: onAdd,
  });

  const candidates =
    coverCandidates ??
    files.map((f) => ({ id: f.id, url: f.previewUrl, source: 'staged' }));

  const showCoverGrid = Boolean(onCoverSelect);

  return (
    <div>
      {/* ── Dropzone ── */}
      <div
        {...getRootProps()}
        className={`rounded-[1.4rem] border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive
            ? 'border-[color:var(--site-accent)] bg-[color:var(--site-glow)]'
            : 'border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
          <IconUpload />
        </div>
        <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
          {copy.hint}
        </p>
        <button
          type="button"
          onClick={open}
          className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-text)]"
        >
          {copy.browse}
        </button>
      </div>

      {/* ── Staged-files preview grid ── */}
      {files.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {files.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72"
            >
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                aria-label={`${copy.removeLabel} ${item.file.name}`}
              >
                <IconClose />
              </button>
              {selectedCoverId === item.id && (
                <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                  {copy.coverLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Cover-selection grid ── */}
      {showCoverGrid && (
        <div className="mt-4 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/62 p-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
            {copy.coverSelectionLabel}
          </p>

          {candidates.length > 0 ? (
            <div className="mt-4 grid max-h-[260px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
              {candidates.map((image) => (
                <div
                  key={image.id}
                  className={`relative overflow-hidden rounded-[18px] border transition ${
                    selectedCoverId === image.id
                      ? 'border-[color:var(--site-accent)] ring-2 ring-[color:var(--site-accent)]/15'
                      : 'border-[color:var(--site-border)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onCoverSelect(image.id)}
                    className="block w-full"
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-square h-full w-full object-cover"
                    />
                  </button>

                  {image.source === 'staged' && onRemove ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(image.id);
                      }}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                      aria-label={copy.removeStagedLabel}
                    >
                      <IconClose />
                    </button>
                  ) : null}

                  <span className="absolute left-2 top-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-muted-strong)]">
                    {image.source === 'staged' ? copy.newLabel : copy.savedLabel}
                  </span>

                  {selectedCoverId === image.id ? (
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                      {copy.coverLabel}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.emptyCoverLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
