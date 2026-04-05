import { memo } from "react";
import { RevealBlock } from "../ui/RevealBlock";

export const PracticeSection = memo(function PracticeSection({ copy, locale }) {
  return (
    <section className="section-space mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
      <RevealBlock className="rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
        <p className="section-kicker mb-4">{copy.practice.label}</p>
        <h2 className={`editorial-title max-w-[12ch] text-4xl font-semibold sm:text-5xl ${locale === "zh" ? "max-w-[8ch]" : ""}`}>
          {copy.practice.heading}
        </h2>

        <div className="mt-8 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
            {copy.practice.principleLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
            {copy.practice.principleText}
          </p>
        </div>
      </RevealBlock>

      <RevealBlock
        delay={120}
        className="rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9"
      >
        <p className="max-w-[42rem] text-[1.05rem] leading-9 text-[color:var(--site-text)]/84">
          {copy.practice.lead}
        </p>

        <div className="mt-8 grid gap-4 border-t border-[color:var(--site-border-soft)] pt-6 sm:grid-cols-3">
          {copy.practice.columns.map((item, index) => (
            <div
              key={item.title}
              className="rounded-[1.45rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-5"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <p className="text-[11px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </RevealBlock>
    </section>
  );
});
