import { useEffect, useRef, useState } from "react";
import { processPortfolioImageFile } from "../../utils/processPortfolioImage";
import { uploadImageToCloud } from "../../services/cloudStorage";
import { getCoverImage, resolveUploadErrorMessage, toLocalizedField } from "../../utils/siteHelpers";
import { IconClose } from "../ui/siteControls";
import { UniversalUploader } from "../UniversalUploader";

const defaultFallbackContent = {
  title: {
    en: "Untitled Portfolio",
    zh: "未命名摄影集",
  },
  description: {
    en: "A newly added body of work waiting for a fuller note.",
    zh: "一组刚建立的作品，等待更完整的文字说明。",
  },
};

export function PortfolioEditorModal({
  portfolio,
  onClose,
  onSave,
  copy,
  fallbackPortfolioContent = defaultFallbackContent,
}) {
  const initialTitle = toLocalizedField(portfolio?.title, fallbackPortfolioContent.title);
  const initialDescription = toLocalizedField(
    portfolio?.description,
    fallbackPortfolioContent.description,
  );
  const [titleEn, setTitleEn] = useState(initialTitle.en);
  const [titleZh, setTitleZh] = useState(initialTitle.zh);
  const [descriptionEn, setDescriptionEn] = useState(initialDescription.en);
  const [descriptionZh, setDescriptionZh] = useState(initialDescription.zh);
  const [selectedCoverId, setSelectedCoverId] = useState(getCoverImage(portfolio)?.id ?? null);
  const [localFiles, setLocalFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [narrative, setNarrative] = useState(portfolio?.narrative ?? "STUDIO");

  function translateToEnglish(zhText, type) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          type === "title"
            ? "Cinematic Portrait Collection"
            : "An exploration of light, shadow, and human emotion.",
        );
      }, 1500);
    });
  }

  async function handleAutoTranslate() {
    if (!titleZh.trim() && !descriptionZh.trim()) return;
    setIsTranslating(true);
    try {
      const [nextTitleEn, nextDescEn] = await Promise.all([
        translateToEnglish(titleZh, "title"),
        translateToEnglish(descriptionZh, "desc"),
      ]);
      setTitleEn(nextTitleEn);
      setDescriptionEn(nextDescEn);
    } finally {
      setIsTranslating(false);
    }
  }
  const localFilesRef = useRef([]);
  const isCreateMode = !portfolio;
  const coverCandidates = [
    ...(portfolio?.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      source: "existing",
    })),
    ...localFiles.map((item) => ({
      id: item.id,
      url: item.previewUrl,
      source: "staged",
    })),
  ];

  function syncLocalFiles(updater) {
    setLocalFiles((current) => {
      const nextValue = typeof updater === "function" ? updater(current) : updater;
      localFilesRef.current = nextValue;
      return nextValue;
    });
  }

  function appendLocalFiles(acceptedFiles) {
    if (acceptedFiles.length === 0) {
      return;
    }

    const nextFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    syncLocalFiles((current) => {
      const merged = [...current, ...nextFiles];
      setSelectedCoverId((currentCoverId) => currentCoverId ?? merged[0]?.id ?? null);
      return merged;
    });
  }

  useEffect(() => {
    return () => {
      localFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSave() {
    const nextTitleEn = titleEn.trim();
    const nextTitleZh = titleZh.trim();
    const nextDescriptionEn = descriptionEn.trim();
    const nextDescriptionZh = descriptionZh.trim();

    if (nextTitleEn.length > 90 || nextTitleZh.length > 90) {
      setErrorMessage(copy.admin.titleTooLong);
      return;
    }

    if (isCreateMode && localFiles.length === 0) {
      setErrorMessage(copy.admin.selectImageFirst);
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const uploadedImages =
        localFiles.length > 0
          ? await Promise.all(
              localFiles.map(async (item) => {
                const { publicUrl: url, path } = await uploadImageToCloud(
                  await processPortfolioImageFile(item.file),
                );
                return { id: item.id, url, path, isCover: false };
              }),
            )
          : undefined;

      await onSave({
        id: portfolio?.id,
        narrative,
        title: {
          en: nextTitleEn || nextTitleZh || copy.admin.untitled,
          zh: nextTitleZh || nextTitleEn || copy.admin.untitled,
        },
        description: {
          en: nextDescriptionEn || nextDescriptionZh || copy.admin.defaultDescription,
          zh: nextDescriptionZh || nextDescriptionEn || copy.admin.defaultDescription,
        },
        coverImageId: selectedCoverId,
        images: uploadedImages,
      });

      if (isCreateMode) {
        localFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        localFilesRef.current = [];
        setLocalFiles([]);
      }
    } catch (error) {
      setErrorMessage(resolveUploadErrorMessage(error, copy.admin));
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemoveLocalFile(fileId) {
    const target = localFilesRef.current.find((item) => item.id === fileId);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    syncLocalFiles((current) => {
      const nextFiles = current.filter((item) => item.id !== fileId);
      setSelectedCoverId((currentCoverId) => {
        if (currentCoverId !== fileId) {
          return currentCoverId;
        }
        return getCoverImage(portfolio)?.id ?? nextFiles[0]?.id ?? null;
      });
      return nextFiles;
    });
  }

  function handleClearFiles() {
    localFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    localFilesRef.current = [];
    setLocalFiles([]);
    setSelectedCoverId(getCoverImage(portfolio)?.id ?? null);
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0d0f14]/78 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,980px)] w-full max-w-3xl flex-col overflow-hidden rounded-[2.1rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-4 shadow-soft sm:p-8"
        style={{ borderColor: "var(--site-border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[color:var(--site-border-soft)] pb-4 sm:mb-8 sm:pb-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h3 className="font-display text-3xl text-[color:var(--site-text)]">
              {portfolio ? copy.admin.editModalTitle : copy.admin.createModalTitle}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              {isCreateMode ? copy.admin.createModalText : copy.admin.editModalText}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.detail.closeLightbox}
            className="micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 text-[color:var(--site-muted-strong)]"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
              <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                {copy.admin.portfolioDetails}
              </p>

              {/* ── Chinese fields — primary data entry ── */}
              <label className="mt-6 block">
                <span className="mb-2 block text-[9px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
                  {copy.admin.titleZhLabel}
                </span>
                <input
                  type="text"
                  maxLength={90}
                  value={titleZh}
                  onChange={(event) => setTitleZh(event.target.value)}
                  placeholder={copy.admin.titlePlaceholderZh}
                  className="w-full border-0 border-b border-white/20 bg-transparent py-2 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-white/50"
                />
              </label>

              <label className="mt-6 block">
                <span className="mb-2 block text-[9px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
                  {copy.admin.descriptionZhLabel}
                </span>
                <textarea
                  rows={3}
                  value={descriptionZh}
                  onChange={(event) => setDescriptionZh(event.target.value)}
                  placeholder={copy.admin.descriptionPlaceholderZh}
                  className="w-full resize-none border-0 border-b border-white/20 bg-transparent py-2 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-white/50"
                />
              </label>

              {/* ── Auto-translate button ── */}
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={isTranslating || (!titleZh.trim() && !descriptionZh.trim())}
                className="micro-button mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--site-accent)]/40 bg-[color:var(--site-bg-deep)]/60 px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-[color:var(--site-accent)] transition hover:border-[color:var(--site-accent)] hover:shadow-[0_0_18px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isTranslating ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[color:var(--site-accent)] border-t-transparent" />
                    生成中...
                  </>
                ) : (
                  "✨ 自动生成英文版 (Auto-Translate)"
                )}
              </button>

              {/* ── English fields — auto-filled or manually edited ── */}
              <label className="mt-6 block">
                <span className="mb-2 block text-[9px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
                  {copy.admin.titleEnLabel}
                </span>
                <input
                  type="text"
                  maxLength={90}
                  value={isTranslating ? "" : titleEn}
                  disabled={isTranslating}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder={isTranslating ? "" : copy.admin.titlePlaceholderEn}
                  className={`w-full border-0 border-b py-2 text-sm outline-none transition placeholder:text-gray-700 ${
                    isTranslating
                      ? "animate-pulse cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                      : "border-white/20 bg-transparent text-white focus:border-white/50"
                  }`}
                />
              </label>

              <label className="mt-6 block">
                <span className="mb-2 block text-[9px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
                  {copy.admin.descriptionEnLabel}
                </span>
                <textarea
                  rows={3}
                  value={isTranslating ? "" : descriptionEn}
                  disabled={isTranslating}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  placeholder={isTranslating ? "" : copy.admin.descriptionPlaceholderEn}
                  className={`w-full resize-none border-0 border-b py-2 text-sm outline-none transition placeholder:text-gray-700 ${
                    isTranslating
                      ? "animate-pulse cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                      : "border-white/20 bg-transparent text-white focus:border-white/50"
                  }`}
                />
              </label>

              {/* ── Narrative / Category pill selector ── */}
              <div className="mt-5">
                <span className="mb-3 block text-[9px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
                  {copy.gallery.filterLabels.STUDIO ? "Category" : "Category"}
                </span>
                <div className="flex gap-2">
                  {(["STUDIO", "EXPLORATION", "ARCHIVE"]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNarrative(key)}
                      className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.28em] transition-all duration-200 ${
                        narrative === key
                          ? "border-[#4FD1C5] bg-[#4FD1C5]/20 text-[#4FD1C5]"
                          : "border-white/20 bg-transparent text-[color:var(--site-muted)] hover:border-white/40 hover:text-white/60"
                      }`}
                    >
                      {copy.gallery.filterLabels[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/62 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                      {copy.admin.statusLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted-strong)]">
                      {isCreateMode
                        ? localFiles.length > 0
                          ? `${localFiles.length} ${copy.admin.localFilesSelected}`
                          : copy.admin.waitingForImages
                        : `${(portfolio?.images?.length || 0) + localFiles.length} ${copy.admin.imagesReadyAfterSave}`}
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                    {isCreateMode ? copy.admin.createStatus : copy.admin.editStatus}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5"
              style={{ borderColor: "var(--site-border)" }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                    {isCreateMode ? copy.admin.stagingTitle : copy.admin.coverSelection}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
                    {isCreateMode ? copy.admin.stagingText : copy.admin.coverSelectionText}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                  {localFiles.length}
                </span>
              </div>

              <UniversalUploader
                files={localFiles}
                onAdd={appendLocalFiles}
                onRemove={handleRemoveLocalFile}
                selectedCoverId={selectedCoverId}
                onCoverSelect={setSelectedCoverId}
                coverCandidates={coverCandidates}
                copy={{
                  hint: isCreateMode ? copy.admin.uploadHint : copy.admin.uploadHintSecondary,
                  browse: copy.admin.browseFiles,
                  removeLabel: copy.admin.removeImagePrefix,
                  removeStagedLabel: copy.admin.removeStagedImage,
                  coverLabel: copy.admin.cover,
                  newLabel: copy.admin.new,
                  savedLabel: copy.admin.saved,
                  coverSelectionLabel: copy.admin.coverSelection,
                  emptyCoverLabel: isCreateMode ? copy.admin.emptyCoverCreate : copy.admin.emptyCoverEdit,
                }}
              />

              {isCreateMode && localFiles.length > 0 ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 px-4 py-3">
                  <p className="text-sm leading-6 text-[color:var(--site-muted)]">
                    {copy.admin.createConfirmText}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="micro-button rounded-full border border-[color:var(--site-border)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-muted)]"
                  >
                    {copy.admin.clearFiles}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.25rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 -mx-4 border-t border-[color:var(--site-border-soft)] bg-[linear-gradient(180deg,rgba(23,25,32,0.84)_0%,rgba(23,25,32,0.96)_100%)] px-4 pb-1 pt-4 backdrop-blur-md sm:-mx-8 sm:mt-8 sm:px-8 sm:pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
            >
              {copy.admin.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (isCreateMode && localFiles.length === 0)}
              className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#10131c] disabled:opacity-50"
            >
              {isSaving
                ? copy.admin.processing
                : isCreateMode
                  ? copy.admin.createPortfolio
                  : copy.admin.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
