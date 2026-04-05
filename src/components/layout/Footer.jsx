import { getLocalizedText } from "../../utils/siteHelpers";

export function Footer({ profile, copy, locale, luminaUrl }) {
  return (
    <footer id="footer" className="section-space-tight mx-auto max-w-7xl border-t border-[color:var(--site-border-soft)] px-4 sm:px-6 lg:px-10">
      <div className="rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
              © 2026 {getLocalizedText(profile.name, locale)}
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--site-muted)]">
              {copy.footer.text}
            </p>
            <a
              href={luminaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[11px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]"
            >
              {copy.footer.poweredBy}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {["IG", "BE", "LI"].map((item) => (
              <a
                key={item}
                href="#"
                aria-label={item}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[11px] uppercase tracking-[0.25em] text-[color:var(--site-muted)] transition hover:text-[color:var(--site-accent)]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
