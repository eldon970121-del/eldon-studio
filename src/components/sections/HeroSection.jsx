import { memo } from "react";
import { getLocalizedText } from "../../utils/siteHelpers";
import { MagneticButton, IconEdit } from "../ui/siteControls";
import { VisualManifesto } from "./VisualManifesto";

export const HeroSection = memo(function HeroSection({
  profile,
  isAdmin,
  onEditProfile,
  copy,
  locale,
  practiceRows,
  manifestoItems,
  luminaUrl,
}) {
  return (
    <section id="about" className="section-space-tight relative overflow-hidden px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[2.7rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_100%)] p-4 shadow-soft sm:p-6 lg:p-7">
        <div className="grid gap-7 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[2.2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_100%)] p-7 shadow-soft sm:p-10">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[color:var(--site-glow)] blur-3xl" />
            <div>
              <div className="mb-8 flex items-center gap-4">
                <img
                  src={profile.avatarUrl}
                  alt={getLocalizedText(profile.name, locale)}
                  className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10 sm:h-20 sm:w-20"
                />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
                    {getLocalizedText(profile.role, locale)}
                  </p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="mt-2 inline-block text-sm text-[color:var(--site-muted-strong)] transition hover:text-[color:var(--site-text)]"
                  >
                    {profile.email}
                  </a>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="micro-button ml-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)] hover:text-[color:var(--site-accent)]"
                  >
                    <IconEdit />
                    {copy.admin.editProfile}
                  </button>
                ) : null}
              </div>

              <div className="inline-flex rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/80 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-[color:var(--site-accent)]">
                {copy.hero.visualDirection}
              </div>

              <h1 className={`editorial-title mt-10 max-w-[13ch] text-5xl font-semibold sm:text-6xl lg:text-[5.25rem] ${locale === "zh" ? "max-w-[10ch]" : ""}`}>
                {copy.hero.heading}
              </h1>

              <p className="editorial-copy mt-7 max-w-[34rem] text-[15px] sm:text-base">
                {getLocalizedText(profile.intro, locale)}
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <MagneticButton
                  as="a"
                  href="#gallery"
                  className="rounded-full bg-[color:var(--site-accent)] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.32em] text-[#10131c] shadow-[0_18px_45px_rgba(124,156,255,0.18)] transition hover:bg-[color:var(--site-accent-strong)]"
                >
                  {copy.hero.viewArchive}
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href={luminaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-6 py-3.5 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
                >
                  {copy.hero.openLumina}
                </MagneticButton>
              </div>
            </div>

            <div className="mt-12 rounded-[1.8rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/54 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--site-border-soft)] pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                    {copy.hero.studioNote}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
                    {copy.hero.studioNoteText}
                  </p>
                </div>
                <span className="hidden rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)] sm:inline-flex">
                  {copy.hero.portraitSystem}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {practiceRows.map((row) => (
                  <div
                    key={getLocalizedText(row.label, "en")}
                    className="rounded-[1.35rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-4"
                  >
                    <p className="text-[10px] uppercase tracking-[0.36em] text-[color:var(--site-muted)]">
                      {getLocalizedText(row.label, locale)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
                      {getLocalizedText(row.value, locale)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <VisualManifesto currentLocale={locale} manifestoItems={manifestoItems} />
        </div>
      </div>
    </section>
  );
});
