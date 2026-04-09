import { memo } from "react";
import { RevealBlock } from "../ui/RevealBlock";
import { getCoverImage, getLocalizedText } from "../../utils/siteHelpers";

export const StorySection = memo(function StorySection({ portfolios, copy, locale }) {
  return (
    <section className="section-space mx-auto grid max-w-7xl gap-10 border-t border-[color:var(--site-border-soft)] px-4 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-10">
      <RevealBlock className="lg:sticky lg:top-10 lg:h-fit">
        <div className="rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-8">
          <p className="section-kicker mb-4">{copy.story.label}</p>
          <h2 className="editorial-title text-4xl font-semibold sm:text-5xl">{copy.story.heading}</h2>
          <p className="editorial-copy mt-6 max-w-sm text-sm">{copy.story.text}</p>

          <div className="mt-8 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
              {copy.story.readingMode}
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
              {copy.story.readingModeText}
            </p>
          </div>
        </div>
      </RevealBlock>

      <div className="space-y-8">
        {portfolios.slice(0, 3).map((portfolio, index) => (
          <RevealBlock key={portfolio.id} delay={index * 120}>
            <article className="grid gap-5 rounded-[2.15rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-soft md:grid-cols-[1.15fr_0.85fr] md:p-6">
              <div className="relative overflow-hidden rounded-[1.8rem] border border-[color:var(--site-border-soft)]">
                <img
                  src={portfolio.images[(index + 1) % portfolio.images.length]?.url || getCoverImage(portfolio)?.url}
                  alt={getLocalizedText(portfolio.title, locale)}
                  loading="lazy"
                  decoding="async"
                  className="h-[320px] w-full object-cover transition duration-700 hover:scale-[1.03] sm:h-[420px]"
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0.06)_0%,rgba(12,13,18,0.22)_38%,rgba(12,13,18,0.84)_100%)]" />
                <div className="absolute right-4 top-4 flex items-start justify-end gap-3">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
                    {copy.story.sequence}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="rounded-[1.35rem] border border-white/10 bg-[color:var(--site-bg-deep)]/62 p-4 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                      {copy.story.selectedSeries}
                    </p>
                    <h3 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.05em] text-[color:var(--site-text)]">
                      {getLocalizedText(portfolio.title, locale)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-muted)]">
                    {copy.story.fragment}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                    {getLocalizedText(portfolio.description, locale)}
                  </p>
                </div>

                <div className="mt-8 border-t border-[color:var(--site-border-soft)] pt-4">
                  <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72 px-4 py-4 text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                    <span>{copy.story.commission}</span>
                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                      {copy.story.study}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </RevealBlock>
        ))}
      </div>
    </section>
  );
});
