import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { processPortfolioImageFile } from "../../utils/processPortfolioImage";
import { uploadImageToCloud } from "../../services/cloudStorage";
import { getCoverImage, resolveUploadErrorMessage, toLocalizedField } from "../../utils/siteHelpers";
import { IconClose, IconUpload } from "../ui/siteControls";

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
  const [errorMessage, setErrorMessage] = useState("");
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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    onDrop: appendLocalFiles,
  });

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
              localFiles.map(async (item) => ({
                id: item.id,
                ...(await uploadImageToCloud(await processPortfolioImageFile(item.file))),
                isCover: false,
              })),
            )
          : undefined;

      await onSave({
        id: portfolio?.id,
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

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                  {copy.admin.titleEnLabel}
                </span>
                <input
                  type="text"
                  maxLength={90}
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder={copy.admin.titlePlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                  {copy.admin.titleZhLabel}
                </span>
                <input
                  type="text"
                  maxLength={90}
                  value={titleZh}
                  onChange={(event) => setTitleZh(event.target.value)}
                  placeholder={copy.admin.titlePlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                  {copy.admin.descriptionEnLabel}
                </span>
                <textarea
                  rows={4}
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  placeholder={copy.admin.descriptionPlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                  {copy.admin.descriptionZhLabel}
                </span>
                <textarea
                  rows={5}
                  value={descriptionZh}
                  onChange={(event) => setDescriptionZh(event.target.value)}
                  placeholder={copy.admin.descriptionPlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

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

            {isCreateMode ? (
              <div
                className="rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5"
                style={{ borderColor: "var(--site-border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                      {copy.admin.stagingTitle}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
                      {copy.admin.stagingText}
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                    {localFiles.length} files
                  </span>
                </div>

                <div
                  {...getRootProps()}
                  className={`mt-4 rounded-[1.4rem] border-2 border-dashed px-6 py-10 text-center transition ${
                    isDragActive
                      ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                      : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
                    <IconUpload />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
                    {copy.admin.uploadHint}
                  </p>
                  <button
                    type="button"
                    onClick={open}
                    className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
                  >
                    {copy.admin.browseFiles}
                  </button>
                </div>

                {localFiles.length > 0 ? (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {localFiles.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72"
                        >
                          <img src={item.previewUrl} alt={item.file.name} className="aspect-square w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveLocalFile(item.id)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                            aria-label={`${copy.admin.removeImagePrefix} ${item.file.name}`}
                          >
                            <IconClose />
                          </button>
                          {selectedCoverId === item.id || (selectedCoverId === null && index === 0) ? (
                            <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                              {copy.admin.cover}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>

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
                  </>
                ) : null}

                <div className="mt-4 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/62 p-4">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                    {copy.admin.coverSelection}
                  </p>
                  {coverCandidates.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {coverCandidates.map((image) => (
                        <div
                          key={image.id}
                          className={`relative overflow-hidden rounded-[18px] border transition ${
                            selectedCoverId === image.id
                              ? "border-[color:var(--site-accent)] ring-2 ring-[color:var(--site-accent)]/15"
                              : "border-[color:var(--site-border)]"
                          }`}
                        >
                          <button type="button" onClick={() => setSelectedCoverId(image.id)} className="block w-full">
                            <img src={image.url} alt="" className="aspect-square h-full w-full object-cover" />
                          </button>
                          {image.source === "staged" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveLocalFile(image.id);
                              }}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                              aria-label={copy.admin.removeStagedImage}
                            >
                              <IconClose />
                            </button>
                          ) : null}
                          <span className="absolute left-2 top-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-muted-strong)]">
                            {image.source === "staged" ? copy.admin.new : copy.admin.saved}
                          </span>
                          {selectedCoverId === image.id ? (
                            <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                              {copy.admin.cover}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                      {copy.admin.emptyCoverCreate}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5"
                style={{ borderColor: "var(--site-border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                      {copy.admin.coverSelection}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
                      {copy.admin.coverSelectionText}
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                    {coverCandidates.length} images
                  </span>
                </div>

                <div
                  {...getRootProps()}
                  className={`mt-4 rounded-[1.4rem] border-2 border-dashed px-6 py-8 text-center transition ${
                    isDragActive
                      ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                      : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
                    <IconUpload />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
                    {copy.admin.uploadHintSecondary}
                  </p>
                  <button
                    type="button"
                    onClick={open}
                    className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
                  >
                    {copy.admin.browseFiles}
                  </button>
                </div>

                {coverCandidates.length ? (
                  <div className="mt-4 grid max-h-[260px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                    {coverCandidates.map((image) => (
                      <div
                        key={image.id}
                        className={`relative overflow-hidden rounded-[18px] border transition ${
                          selectedCoverId === image.id
                            ? "border-[color:var(--site-accent)] ring-2 ring-[color:var(--site-accent)]/15"
                            : "border-[color:var(--site-border)]"
                        }`}
                      >
                        <button type="button" onClick={() => setSelectedCoverId(image.id)} className="block w-full">
                          <img src={image.url} alt="" className="aspect-square h-full w-full object-cover" />
                        </button>
                        {image.source === "staged" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveLocalFile(image.id);
                            }}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                            aria-label={copy.admin.removeStagedImage}
                          >
                            <IconClose />
                          </button>
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-muted-strong)]">
                          {image.source === "staged" ? copy.admin.new : copy.admin.saved}
                        </span>
                        {selectedCoverId === image.id ? (
                          <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                            {copy.admin.cover}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                    {copy.admin.emptyCoverEdit}
                  </p>
                )}
              </div>
            )}
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
