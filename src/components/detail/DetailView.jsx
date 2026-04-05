import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { processPortfolioImageFile } from "../../utils/processPortfolioImage";
import { uploadImageToCloud } from "../../services/cloudStorage";
import { getLocalizedText, resolveUploadErrorMessage } from "../../utils/siteHelpers";
import { IconArrow, IconClose, IconEdit, IconTrash, IconUpload } from "../ui/siteControls";

const detailMetaCopy = {
  en: {
    archive: "Archive",
    access: "Access",
    description: "Description",
    upload: "Upload Queue",
  },
  zh: {
    archive: "归档",
    access: "访问模式",
    description: "说明",
    upload: "上传队列",
  },
};

function getShellClassForRatio(ratio) {
  if (!ratio) {
    return "col-span-12 md:col-span-6";
  }

  if (ratio >= 1.8) {
    return "col-span-12";
  }

  if (ratio >= 1.22) {
    return "col-span-12 md:col-span-8";
  }

  if (ratio <= 0.82) {
    return "col-span-12 md:col-span-4";
  }

  return "col-span-12 md:col-span-6";
}

function getFallbackAspectRatio(index) {
  const cycle = index % 4;

  if (cycle === 0) {
    return 1.5;
  }

  if (cycle === 1) {
    return 0.75;
  }

  if (cycle === 2) {
    return 1;
  }

  return 1.33;
}

function StagingUploadArea({ onConfirmUpload, copy }) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stagedFilesRef = useRef([]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const nextFiles = acceptedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setStagedFiles((current) => {
        const merged = [...current, ...nextFiles];
        stagedFilesRef.current = merged;
        return merged;
      });
      setErrorMessage("");
    },
  });

  useEffect(() => {
    return () => {
      stagedFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  async function handleConfirmUpload() {
    if (stagedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const uploadedImages = await Promise.all(
        stagedFiles.map(async (item, index) => ({
          id: Date.now() + index + Math.floor(Math.random() * 1000),
          ...(await uploadImageToCloud(await processPortfolioImageFile(item.file))),
          isCover: false,
        })),
      );

      stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      stagedFilesRef.current = [];
      await onConfirmUpload(uploadedImages);
      setStagedFiles([]);
    } catch (error) {
      console.error("Failed to process portfolio images before upload.", error);
      setErrorMessage(resolveUploadErrorMessage(error, copy.upload));
    } finally {
      setIsUploading(false);
    }
  }

  function handleClear() {
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    stagedFilesRef.current = [];
    setStagedFiles([]);
    setErrorMessage("");
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
            Admin Upload
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
            {copy.upload.subtext}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[color:var(--site-muted-strong)]">
          {stagedFiles.length}
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-[1.6rem] border border-dashed px-5 py-8 text-center transition ${
          isDragActive
            ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
            : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/52 hover:border-[color:var(--site-border-strong)]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
          <IconUpload />
        </div>
        <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">{copy.upload.hint}</p>
        <button
          type="button"
          onClick={open}
          className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-text)]"
        >
          {copy.upload.browse}
        </button>
      </div>

      {stagedFiles.length > 0 ? (
        <div className="mt-5">
          <div className="grid grid-cols-3 gap-3">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72"
              >
                <img src={item.previewUrl} alt={item.file.name} className="aspect-square w-full object-cover" />
              </div>
            ))}
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-[1.1rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleClear}
              disabled={isUploading}
              className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.24em] text-[color:var(--site-muted)] disabled:opacity-50"
            >
              {copy.upload.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#10131c] disabled:opacity-60"
            >
              {isUploading ? copy.upload.uploading : copy.upload.confirm}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PortfolioLightbox({ portfolio, imageIndex, onClose, onNavigate, copy, locale }) {
  const currentImage = portfolio.images[imageIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        onNavigate("prev");
      }
      if (event.key === "ArrowRight") {
        onNavigate("next");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[145] flex items-center justify-center bg-black/92 px-4 py-8 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={copy.detail.closeLightbox}
        className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)]"
      >
        <IconClose />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate("prev");
        }}
        aria-label={copy.detail.previousImage}
        className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)] sm:left-6"
      >
        <IconArrow />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate("next");
        }}
        aria-label={copy.detail.nextImage}
        className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)] sm:right-6"
      >
        <IconArrow direction="right" />
      </button>

      <div className="relative w-full max-w-7xl" onClick={(event) => event.stopPropagation()}>
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-black/30">
          <img
            src={currentImage.url}
            alt={`${getLocalizedText(portfolio.title, locale)} ${imageIndex + 1}`}
            className="max-h-[82vh] w-full object-contain"
          />
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
          <span>{getLocalizedText(portfolio.title, locale)}</span>
          <span className="text-[color:var(--site-accent)]">
            {String(imageIndex + 1).padStart(2, "0")} / {String(portfolio.images.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

function PortfolioPhotoCard({ image, index, total, isAdmin, onOpen, onSetCover, onDelete, copy, locale, title }) {
  const [naturalRatio, setNaturalRatio] = useState(null);
  const cardRatio = naturalRatio || getFallbackAspectRatio(index);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.24) }}
      className={`group relative ${getShellClassForRatio(cardRatio)}`}
    >
      <div className="overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/70 shadow-soft">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div
            className="relative overflow-hidden bg-[color:var(--site-bg-deep)]"
            style={{ aspectRatio: cardRatio }}
          >
            <img
              src={image.url}
              alt={`${getLocalizedText(title, locale)} ${copy.detail.imageLabel} ${index + 1}`}
              loading="lazy"
              decoding="async"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setNaturalRatio(naturalWidth / naturalHeight);
                }
              }}
              className="h-full w-full bg-[color:var(--site-bg-deep)] object-contain transition duration-500 group-hover:scale-[1.015]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,11,15,0.01)_0%,rgba(10,11,15,0.04)_58%,rgba(10,11,15,0.18)_100%)]" />

            {image.isCover ? (
              <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/28 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[color:var(--site-accent)] backdrop-blur-md">
                Cover
              </span>
            ) : null}

            {isAdmin ? (
              <div className="absolute inset-x-4 bottom-4 flex translate-y-3 flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex-row">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetCover();
                  }}
                  className="micro-button rounded-full border border-white/12 bg-black/40 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-white/92 backdrop-blur-md"
                >
                  {copy.detail.setCover}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  className="micro-button rounded-full border border-red-500/30 bg-black/40 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-red-200 backdrop-blur-md"
                >
                  {copy.detail.delete}
                </button>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end p-6 opacity-0 transition duration-300 group-hover:opacity-100">
              <span className="text-[10px] uppercase tracking-[0.34em] text-white/88">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>
          </div>
        </button>
      </div>
    </motion.article>
  );
}

export function DetailView({
  portfolio,
  isAdmin,
  onBack,
  onEditPortfolio,
  onRequestDeletePortfolio,
  onUploadImages,
  onSetCover,
  onDeleteImage,
  copy,
  locale,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const uploadSectionRef = useRef(null);
  const imageCountLabel = `${String(portfolio.images.length).padStart(2, "0")} ${copy.detail.imageLabel}`;
  const detailMeta = detailMetaCopy[locale];
  const localizedTitle = getLocalizedText(portfolio.title, locale);
  const localizedDescription = getLocalizedText(portfolio.description, locale);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-20 pt-20 sm:px-6 lg:px-10 lg:pb-28 lg:pt-28">
      <header className="mb-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="micro-button inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--site-border)] bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--site-muted-strong)] backdrop-blur-md"
          >
            <IconArrow />
            {copy.detail.back}
          </button>

          {isAdmin ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEditPortfolio}
                aria-label={copy.detail.editPortfolio}
                className="micro-button flex h-12 w-12 items-center justify-center rounded-full border border-white/6 bg-[color:var(--site-panel-strong)]/80 text-[color:var(--site-muted)] backdrop-blur-xl transition hover:text-[color:var(--site-accent)]"
              >
                <IconEdit />
              </button>
              <button
                type="button"
                onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                aria-label={detailMeta.upload}
                className="micro-button flex h-12 w-12 items-center justify-center rounded-full border border-white/6 bg-[color:var(--site-panel-strong)]/80 text-[color:var(--site-muted)] backdrop-blur-xl transition hover:text-[color:var(--site-accent)]"
              >
                <IconUpload />
              </button>
              <button
                type="button"
                onClick={onRequestDeletePortfolio}
                aria-label={copy.detail.deletePortfolio}
                className="micro-button flex h-12 w-12 items-center justify-center rounded-full border border-white/6 bg-[color:var(--site-panel-strong)]/80 text-[color:var(--site-muted)] backdrop-blur-xl transition hover:text-red-300"
              >
                <IconTrash />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-8 max-w-5xl">
          <h1
            className={`font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--site-text)] ${
              locale === "en" ? "uppercase" : ""
            }`}
          >
            {localizedTitle}
          </h1>

          <div className="mt-10 grid gap-10 border-t border-[color:var(--site-border-soft)] pt-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-14">
            <div className="border-l border-[color:var(--site-border-soft)] pl-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                  {detailMeta.archive}
                </p>
                <p className="mt-2 text-base text-[color:var(--site-muted-strong)]">{imageCountLabel}</p>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                  {detailMeta.access}
                </p>
                <p className="mt-2 text-base text-[color:var(--site-muted-strong)]">
                  {isAdmin ? copy.login.adminBadge : copy.login.memberBadge}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                {detailMeta.description}
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] sm:text-[1.02rem]">
                {localizedDescription}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section ref={uploadSectionRef} className="mb-12">
        {isAdmin ? (
          <div className="max-w-xl">
            <StagingUploadArea onConfirmUpload={onUploadImages} copy={copy} />
          </div>
        ) : (
          <div className="max-w-3xl rounded-[1.8rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/58 px-5 py-5 text-sm leading-7 text-[color:var(--site-muted)]">
            {copy.detail.uploadLocked}
          </div>
        )}
      </section>

      <main>
        <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8">
          {portfolio.images.map((image, index) => (
            <PortfolioPhotoCard
              key={image.id}
              image={image}
              index={index}
              total={portfolio.images.length}
              isAdmin={isAdmin}
              copy={copy}
              locale={locale}
              title={portfolio.title}
              onOpen={() => setLightboxIndex(index)}
              onSetCover={() => onSetCover(image.id)}
              onDelete={() => onDeleteImage(image.id)}
            />
          ))}
        </div>
      </main>

      <section className="py-40 text-center">
        <p className="mb-6 font-body text-[10px] uppercase tracking-[0.4em] text-[color:var(--site-muted)]">
          {locale === "zh" ? "与这种风格产生共鸣？" : "Resonate with this style?"}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-5 font-display text-4xl leading-tight tracking-[-0.045em] text-[color:var(--site-text)] transition-all duration-500 ease-out hover:text-[color:var(--site-muted-strong)] md:text-5xl lg:text-6xl"
        >
          <span className="border-b border-transparent pb-1 transition-all duration-500 ease-out group-hover:border-[color:var(--site-muted-strong)]">
            {locale === "zh" ? "委托类似的项目。" : "Commission a similar project."}
          </span>
          <span className="inline-block translate-x-0 text-[color:var(--site-accent)] transition-transform duration-500 ease-out group-hover:translate-x-3">
            →
          </span>
        </button>
      </section>

      {lightboxIndex !== null ? (
        <PortfolioLightbox
          portfolio={portfolio}
          imageIndex={lightboxIndex}
          copy={copy}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(direction) => {
            setLightboxIndex((current) => {
              if (current === null) {
                return current;
              }
              if (direction === "next") {
                return (current + 1) % portfolio.images.length;
              }
              return (current - 1 + portfolio.images.length) % portfolio.images.length;
            });
          }}
        />
      ) : null}
    </div>
  );
}
