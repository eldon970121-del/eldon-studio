import { memo, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { RevealBlock } from "../ui/RevealBlock";
import { AdminActionButton, IconEdit, IconPlus, IconTrash, MagneticButton } from "../ui/siteControls";
import { getCoverImage, getLocalizedText } from "../../utils/siteHelpers";

const FILTERS = ["ALL", "STUDIO", "EXPLORATION", "ARCHIVE"];

/* ─── individual filmstrip card ─── */
const FilmstripCard = memo(function FilmstripCard({
  portfolio,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
  copy,
  locale,
  index,
}) {
  const coverImage = getCoverImage(portfolio);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px -15% 0px -15%" });

  return (
    <motion.article
      ref={ref}
      animate={inView ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.96, x: 48 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.06, 0.3) }}
      className="group relative flex-none snap-center"
      style={{ height: "70vh" }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block h-full overflow-hidden rounded-[4px] bg-black focus-visible:outline-none"
      >
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={getLocalizedText(portfolio.title, locale)}
            loading="lazy"
            decoding="async"
            className="h-full w-auto max-w-none object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.025] group-hover:brightness-[1.08]"
            style={{ aspectRatio: "auto" }}
          />
        ) : (
          <div
            className="flex h-full w-[40vw] max-w-sm items-center justify-center bg-[#0d0d0d] text-sm text-white/20"
          >
            {copy.gallery.noCover}
          </div>
        )}

        {/* letterbox atmosphere gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.0)_45%,rgba(0,0,0,0.78)_100%)]" />

        {/* frame counter — top left */}
        <div className="absolute left-3 top-3 rounded-[3px] border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] uppercase tracking-[0.28em] text-white/40 backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* title — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <p className="font-serif text-[9px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
            {copy.gallery.selectedSeries}
          </p>
          <h3 className="mt-2 font-serif text-xl font-light leading-snug tracking-[-0.02em] text-white">
            {getLocalizedText(portfolio.title, locale)}
          </h3>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/40">
            {String(portfolio.images.length).padStart(2, "0")} {copy.gallery.imagesSuffix}
          </p>
        </div>
      </button>

      {/* admin controls — hover-only */}
      {isAdmin ? (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <AdminActionButton label={copy.detail.editPortfolio} onClick={onEdit}>
            <IconEdit />
          </AdminActionButton>
          <AdminActionButton label={copy.detail.deletePortfolio} onClick={onDelete} tone="danger">
            <IconTrash />
          </AdminActionButton>
        </div>
      ) : null}
    </motion.article>
  );
});

/* ─── admin "add" card ─── */
const AddFilmstripCard = memo(function AddFilmstripCard({ onClick, copy }) {
  return (
    <article
      className="group relative flex-none snap-center"
      style={{ height: "70vh" }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={copy.gallery.addCardLabel}
        className="flex h-full w-[clamp(200px,28vw,320px)] flex-col items-center justify-center gap-5 rounded-[4px] border border-dashed border-white/10 bg-[#080808] transition duration-500 hover:border-white/20"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/12 text-[color:var(--site-accent)] transition group-hover:border-white/24">
          <IconPlus />
        </span>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
            {copy.gallery.addCardEyebrow}
          </p>
          <p className="mt-2 text-sm font-light text-white/50 transition group-hover:text-white/70">
            {copy.gallery.addCardTitle}
          </p>
        </div>
      </button>
    </article>
  );
});

/* ─── main export ─── */
export const PortfolioMasonry = memo(function PortfolioMasonry({
  portfolios,
  isAdmin,
  onAdd,
  onOpen,
  onEdit,
  onDelete,
  copy,
  locale,
}) {
  const [activeNarrative, setActiveNarrative] = useState("ALL");
  const filtered =
    activeNarrative === "ALL"
      ? portfolios
      : portfolios.filter((p) => p.narrative === activeNarrative);

  return (
    <section id="gallery" className="bg-black">
      {/* ── section header ── */}
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-10">
        <RevealBlock className="mb-10 flex flex-col gap-5 border-b border-white/[0.06] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[9px] uppercase tracking-[0.42em] text-white/35">
              {copy.gallery.label}
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {copy.gallery.heading}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-white/40">{copy.gallery.text}</p>

          {isAdmin ? (
            <MagneticButton
              onClick={onAdd}
              className="micro-button inline-flex items-center gap-2 self-start rounded-[4px] border border-white/12 bg-white/[0.04] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.32em] text-white/60 transition hover:border-white/24 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-white/12 text-[color:var(--site-accent)]">
                <IconPlus />
              </span>
              {copy.gallery.newPortfolio}
            </MagneticButton>
          ) : null}
        </RevealBlock>

        {/* ── narrative filter ── */}
        <div className="flex items-center justify-center gap-10">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveNarrative(f)}
              className={`text-[9px] uppercase tracking-[0.28em] transition-all duration-300 ${
                activeNarrative === f
                  ? "text-white after:mt-1.5 after:block after:h-px after:w-full after:bg-white"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {copy.gallery.filterLabels?.[f] ?? (f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* ── horizontal filmstrip ── */}
      {/*
        key=activeNarrative forces full remount on filter change,
        preventing stale scroll position and layout artefacts.
      */}
      <div
        key={activeNarrative}
        className="no-scrollbar flex snap-x snap-mandatory items-center gap-6 overflow-x-auto overflow-y-hidden px-[10vw] pb-16 pt-6"
      >
        {isAdmin ? <AddFilmstripCard onClick={onAdd} copy={copy} /> : null}

        {filtered.map((portfolio, index) => (
          <FilmstripCard
            key={portfolio.id}
            portfolio={portfolio}
            isAdmin={isAdmin}
            copy={copy}
            locale={locale}
            index={index}
            onOpen={() => onOpen(portfolio.id)}
            onEdit={() => onEdit(portfolio)}
            onDelete={() => onDelete(portfolio.id)}
          />
        ))}

        {/* trailing spacer so last card centres properly */}
        <div className="flex-none" style={{ width: "10vw" }} aria-hidden="true" />
      </div>
    </section>
  );
});
