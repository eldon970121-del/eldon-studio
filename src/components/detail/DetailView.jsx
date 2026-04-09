import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processPortfolioImageFile } from "../../utils/processPortfolioImage";
import { uploadImageToCloud } from "../../services/cloudStorage";
import { getLocalizedText, resolveUploadErrorMessage } from "../../utils/siteHelpers";
import { IconArrow, IconClose, IconEdit, IconTrash, IconUpload } from "../ui/siteControls";
import { UniversalUploader } from "../UniversalUploader";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getShellClassForRatio(ratio) {
  if (!ratio) return "col-span-12 md:col-span-6";
  if (ratio >= 1.8) return "col-span-12";
  if (ratio >= 1.22) return "col-span-12 md:col-span-8";
  if (ratio <= 0.82) return "col-span-12 md:col-span-4";
  return "col-span-12 md:col-span-6";
}

function getFallbackAspectRatio(index) {
  const cycle = index % 4;
  if (cycle === 0) return 1.5;
  if (cycle === 1) return 0.75;
  if (cycle === 2) return 1;
  return 1.33;
}

// ─── StagingUploadArea (unchanged logic) ──────────────────────────────────────
function StagingUploadArea({ onConfirmUpload, copy }) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stagedFilesRef = useRef([]);

  useEffect(() => {
    return () => { stagedFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)); };
  }, []);

  function handleAdd(acceptedFiles) {
    if (acceptedFiles.length === 0) return;
    const nextFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setStagedFiles((current) => { const merged = [...current, ...nextFiles]; stagedFilesRef.current = merged; return merged; });
    setErrorMessage("");
  }

  function handleRemove(fileId) {
    const target = stagedFilesRef.current.find((item) => item.id === fileId);
    if (target) URL.revokeObjectURL(target.previewUrl);
    setStagedFiles((current) => { const next = current.filter((item) => item.id !== fileId); stagedFilesRef.current = next; return next; });
  }

  async function handleConfirmUpload() {
    if (stagedFiles.length === 0) return;
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mb-1">Upload Queue</p>
          <p className="text-xs text-white/40 leading-relaxed">{copy.upload.subtext}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] text-white/30">{stagedFiles.length}</span>
      </div>
      <UniversalUploader files={stagedFiles} onAdd={handleAdd} onRemove={handleRemove}
        copy={{ hint: copy.upload.hint, browse: copy.upload.browse, removeLabel: copy.upload.browse, coverLabel: "" }} />
      {stagedFiles.length > 0 && (
        <div className="mt-4">
          {errorMessage && <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">{errorMessage}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={handleClear} disabled={isUploading}
              className="micro-button rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/40 disabled:opacity-50">
              {copy.upload.cancel}
            </button>
            <button type="button" onClick={handleConfirmUpload} disabled={isUploading}
              className="micro-button rounded-full bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/80 disabled:opacity-50">
              {isUploading ? copy.upload.uploading : copy.upload.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lightbox (unchanged) ──────────────────────────────────────────────────────
function PortfolioLightbox({ portfolio, imageIndex, onClose, onNavigate, copy, locale }) {
  const currentImage = portfolio.images[imageIndex];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate("prev");
      if (e.key === "ArrowRight") onNavigate("next");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/94 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label={copy.detail.closeLightbox}
        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 transition hover:text-white">
        <IconClose />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }} aria-label={copy.detail.previousImage}
        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 transition hover:text-white sm:left-6">
        <IconArrow />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate("next"); }} aria-label={copy.detail.nextImage}
        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 transition hover:text-white sm:right-6">
        <IconArrow direction="right" />
      </button>
      <div className="relative w-full max-w-7xl" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-lg">
          <img src={currentImage.url} alt={`${getLocalizedText(portfolio.title, locale)} ${imageIndex + 1}`}
            className="max-h-[84vh] w-full object-contain" />
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/30">
          <span>{getLocalizedText(portfolio.title, locale)}</span>
          <span>{String(imageIndex + 1).padStart(2, "0")} / {String(portfolio.images.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Photo card ────────────────────────────────────────────────────────────────
function PortfolioPhotoCard({ image, index, total, isAdmin, editMode, onOpen, onSetCover, onDelete, copy, locale, title }) {
  const [naturalRatio, setNaturalRatio] = useState(null);
  const cardRatio = naturalRatio || getFallbackAspectRatio(index);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.28) }}
      className={`group relative ${getShellClassForRatio(cardRatio)}`}
    >
      <div className="overflow-hidden bg-[#0a0a0a]" style={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div className="relative overflow-hidden" style={{ aspectRatio: cardRatio }}>
            <img
              src={image.url}
              alt={`${getLocalizedText(title, locale)} ${copy.detail.imageLabel} ${index + 1}`}
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight) setNaturalRatio(naturalWidth / naturalHeight);
              }}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ filter: 'brightness(0.96)' }}
            />
            {/* Hover counter */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end p-5 opacity-0 transition duration-500 group-hover:opacity-100">
              <span className="text-[9px] uppercase tracking-[0.4em] text-white/50">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>
          </div>
        </button>

        {/* Admin edit controls — only visible in editMode */}
        {isAdmin && editMode && (
          <div className="flex gap-2 border-t border-white/5 px-4 py-3">
            <button type="button" onClick={onSetCover}
              className="micro-button rounded-full border border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-white/40 hover:text-white/70 transition">
              {copy.detail.setCover}
            </button>
            <button type="button" onClick={onDelete}
              className="micro-button rounded-full border border-red-500/20 px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] text-red-400/60 hover:text-red-300 transition">
              {copy.detail.delete}
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function DetailView({ portfolio, isAdmin, onBack, onEditPortfolio, onRequestDeletePortfolio, onUploadImages, onSetCover, onDeleteImage, copy, locale }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const galleryRef = useRef(null);
  const localizedTitle = getLocalizedText(portfolio.title, locale);
  const localizedDescription = getLocalizedText(portfolio.description, locale);
  const isZh = locale === "zh";

  // Derive metadata from portfolio or use placeholders
  const location = portfolio.location || (isZh ? "未标注地点" : "Location TBD");
  const shootDate = portfolio.shoot_date || portfolio.date || (isZh ? "日期待定" : "Date TBD");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── Module 1: Cinematic Title Page ─────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
        {/* Back button — top left */}
        <button type="button" onClick={onBack}
          className="absolute left-6 top-6 flex items-center gap-2 text-[9px] uppercase tracking-[0.35em] text-white/25 hover:text-white/60 transition-colors duration-300">
          <IconArrow />
          <span>{copy.detail.back}</span>
        </button>

        {/* Admin toolbar — top right, only when admin */}
        {isAdmin && (
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <button type="button" onClick={() => setEditMode(v => !v)}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.3em] transition-all duration-200"
              style={{
                borderColor: editMode ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
                color: editMode ? '#d4af37' : 'rgba(255,255,255,0.3)',
                background: editMode ? 'rgba(212,175,55,0.06)' : 'transparent',
              }}>
              <IconEdit />
              <span>{editMode ? (isZh ? "退出编辑" : "Exit Edit") : (isZh ? "编辑模式" : "Edit Mode")}</span>
            </button>
            {editMode && (
              <>
                <button type="button" onClick={onEditPortfolio}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/70 transition">
                  <IconEdit />
                </button>
                <button type="button" onClick={() => galleryRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/70 transition">
                  <IconUpload />
                </button>
                <button type="button" onClick={onRequestDeletePortfolio}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/20 text-red-400/40 hover:text-red-300 transition">
                  <IconTrash />
                </button>
              </>
            )}
          </div>
        )}

        {/* Metadata line */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 font-mono text-[9px] uppercase tracking-[0.5em]"
          style={{ color: 'rgba(201,168,76,0.6)' }}>
          {isZh ? `地点：${location}` : `LOCATION: ${location}`}
          <span className="mx-4 opacity-40">|</span>
          {isZh ? `时间：${shootDate}` : `DATE: ${shootDate}`}
        </motion.p>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
          className="font-serif font-light leading-[0.92] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(3.5rem, 9vw, 7rem)', color: 'rgba(255,255,255,0.92)' }}>
          {localizedTitle}
        </motion.h1>

        {/* Description */}
        {localizedDescription && (
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-8 max-w-xl text-sm leading-[1.9]"
            style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.02em' }}>
            {localizedDescription}
          </motion.p>
        )}

        {/* Image count */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 font-mono text-[9px] uppercase tracking-[0.45em]"
          style={{ color: 'rgba(255,255,255,0.15)' }}>
          {String(portfolio.images.length).padStart(2, "0")} {copy.detail.imageLabel}
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
          <span className="font-mono text-[8px] uppercase tracking-[0.5em]" style={{ color: 'rgba(255,255,255,0.2)' }}>SCROLL</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>↓</span>
        </motion.div>
      </section>

      {/* ── Module 2: Pure Visual Gallery ──────────────────────────────── */}
      <section ref={galleryRef} className="px-6 pb-8 sm:px-10 lg:px-16">
        {/* Admin upload panel — only in editMode */}
        <AnimatePresence>
          {isAdmin && editMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mb-12 max-w-lg overflow-hidden">
              <StagingUploadArea onConfirmUpload={onUploadImages} copy={copy} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          {portfolio.images.map((image, index) => (
            <PortfolioPhotoCard
              key={image.id}
              image={image}
              index={index}
              total={portfolio.images.length}
              isAdmin={isAdmin}
              editMode={editMode}
              copy={copy}
              locale={locale}
              title={portfolio.title}
              onOpen={() => setLightboxIndex(index)}
              onSetCover={() => onSetCover(image.id)}
              onDelete={() => onDeleteImage(image.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Module 3: Conversion CTA ────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center py-48 px-6 text-center">
        <p className="mb-8 font-mono text-[9px] uppercase tracking-[0.5em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {isZh ? "与这种风格产生共鸣？" : "Resonate with this style?"}
        </p>
        <motion.button
          type="button"
          onClick={onBack}
          className="group relative inline-flex items-center gap-5"
          whileHover="hover"
        >
          <motion.span
            className="font-serif font-light leading-tight tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', color: 'rgba(255,255,255,0.85)' }}
            variants={{ hover: { color: 'rgba(255,255,255,1)' } }}
            transition={{ duration: 0.4 }}>
            {isZh ? "委托类似的项目。" : "Commission a similar project."}
          </motion.span>
          <motion.span
            style={{ color: '#c9a84c', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
            variants={{ hover: { x: 10 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}>
            →
          </motion.span>
        </motion.button>
      </section>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <PortfolioLightbox
          portfolio={portfolio}
          imageIndex={lightboxIndex}
          copy={copy}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(direction) => {
            setLightboxIndex((current) => {
              if (current === null) return current;
              if (direction === "next") return (current + 1) % portfolio.images.length;
              return (current - 1 + portfolio.images.length) % portfolio.images.length;
            });
          }}
        />
      )}
    </div>
  );
}
