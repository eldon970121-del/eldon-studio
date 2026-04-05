import { InlineLanguageToggle, InlineModeToggle } from "../ui/siteControls";
import { getLocalizedText } from "../../utils/siteHelpers";

export function DetailUtilityBar({
  locale,
  onToggleLocale,
  copy,
  userEmail,
  isAdmin,
  isBookingAdminMode,
  onOpenAuth,
  onSignOut,
  onToggleBookingAdminMode,
}) {
  return (
    <div className="fixed right-5 top-5 z-[120] flex flex-wrap items-center justify-end gap-3">
      <div className="inline-flex rounded-full border border-[color:var(--site-border)] bg-white/86 p-1 shadow-soft backdrop-blur-md">
        {[
          { value: "en", label: "EN" },
          { value: "zh", label: "中文" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggleLocale(item.value)}
            className={`micro-button rounded-full px-4 py-2 text-[11px] font-medium uppercase transition ${
              locale === item.value
                ? "bg-[color:var(--site-accent)] text-white"
                : "text-[color:var(--site-muted-strong)] hover:text-[color:var(--site-text)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isAdmin ? (
        <InlineModeToggle
          active={isBookingAdminMode}
          onToggle={onToggleBookingAdminMode}
          label={copy.admin.bookingEditorLabel}
          activeLabel={copy.admin.bookingEditorActive}
          inactiveLabel={copy.admin.bookingEditorInactive}
          isSolid
        />
      ) : null}

      {userEmail ? (
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--site-border)] bg-white/86 px-3 py-1.5 shadow-soft backdrop-blur-md">
          <span className="max-w-[10rem] truncate text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted)]">
            {userEmail}
          </span>
          <span className="rounded-full bg-[color:var(--site-accent)]/12 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[color:var(--site-accent)]">
            {isAdmin ? copy.login.adminBadge : copy.login.memberBadge}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-3 py-2 text-[10px] uppercase tracking-[0.26em] text-[color:var(--site-text)]"
          >
            {copy.login.signOut}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="micro-button rounded-full border border-[color:var(--site-border)] bg-white/86 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-text)] shadow-soft backdrop-blur-md"
        >
          {copy.login.open}
        </button>
      )}
    </div>
  );
}

export function ImmersiveNavbar({
  profile,
  copy,
  locale,
  isSolid,
  isLabView,
  isBookingView,
  isAdmin,
  isBookingAdminMode,
  userEmail,
  onToggleLocale,
  onToggleBookingAdminMode,
  onOpenLab,
  onOpenBooking,
  onOpenAdmin,
  onGoHome,
  onOpenAuth,
  onSignOut,
}) {
  const shellClass = isSolid
    ? "border-black/10 bg-white/72 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    : "border-white/10 bg-white/[0.04] text-white backdrop-blur-md";
  const linkClass = isSolid ? "text-slate-700 hover:text-slate-950" : "text-white/78 hover:text-white";

  return (
    <div className="fixed inset-x-0 top-0 z-[110] px-4 pt-4 sm:px-6 lg:px-10">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[1.8rem] border px-4 py-3 transition duration-500 sm:px-6 ${shellClass}`}
        style={!isSolid ? { textShadow: "0 1px 14px rgba(0,0,0,0.26)" } : undefined}
      >
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-[11px] font-semibold uppercase tracking-[0.32em] ${
              isSolid
                ? "border-black/10 bg-black/[0.03] text-[color:var(--site-accent)]"
                : "border-white/12 bg-black/15 text-white"
            }`}
          >
            ES
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {getLocalizedText(profile.name, locale)}
            </span>
            <span className={`block text-[10px] uppercase tracking-[0.34em] ${isSolid ? "text-slate-500" : "text-white/55"}`}>
              {copy.hero.cinematicDirection}
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#gallery"
            onClick={() => {
              if (isLabView || isBookingView) onGoHome();
            }}
            className={"text-[11px] font-medium uppercase tracking-[0.34em] transition " + linkClass}
          >
            {copy.hero.navPortfolio}
          </a>

          <a
            href="#practice"
            className={"text-[11px] font-medium uppercase tracking-[0.34em] transition " + linkClass}
          >
            {copy.hero.navApproach}
          </a>

          <button
            type="button"
            onClick={onOpenBooking}
            className={"micro-button text-[11px] font-medium uppercase tracking-[0.34em] transition " + (
              isBookingView
                ? isSolid
                  ? "border-b border-slate-800 pb-0.5 text-slate-950"
                  : "border-b border-white pb-0.5 text-white"
                : isSolid
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-white/78 hover:text-white"
            )}
          >
            {copy.hero.navCommission}
          </button>

          <a
            href="#story"
            className={"text-[11px] font-medium uppercase tracking-[0.34em] transition " + linkClass}
          >
            {copy.hero.navStudio}
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <InlineLanguageToggle locale={locale} onToggle={onToggleLocale} isSolid={isSolid} />
          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`micro-button rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.32em] transition ${
                isSolid
                  ? "border-black/10 bg-black/[0.03] text-slate-700 hover:text-slate-950"
                  : "border-white/14 bg-white/[0.06] text-white/72 hover:text-white"
              }`}
            >
              {copy.hero.adminEntry}
            </button>
          ) : null}
          {userEmail ? (
            <>
              <span
                className={`hidden max-w-[10rem] truncate rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.28em] md:inline-flex ${
                  isSolid
                    ? "border-black/10 bg-black/[0.03] text-slate-600"
                    : "border-white/14 bg-white/[0.06] text-white/72"
                }`}
              >
                {userEmail}
              </span>
              <span
                className={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.28em] ${
                  isAdmin
                    ? "border-[color:var(--site-accent)] bg-[color:var(--site-accent)] text-white"
                    : isSolid
                      ? "border-black/10 bg-black/[0.03] text-slate-700"
                      : "border-white/14 bg-white/[0.06] text-white/72"
                }`}
              >
                {isAdmin ? copy.login.adminBadge : copy.login.memberBadge}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className={`micro-button rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.32em] transition ${
                  isSolid
                    ? "border-black/10 bg-black/[0.03] text-slate-700 hover:text-slate-950"
                    : "border-white/14 bg-white/[0.06] text-white/72 hover:text-white"
                }`}
              >
                {copy.login.signOut}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`micro-button rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.32em] transition ${
                isSolid
                  ? "border-black/10 bg-black/[0.03] text-slate-700 hover:text-slate-950"
                  : "border-white/14 bg-white/[0.06] text-white/72 hover:text-white"
              }`}
            >
              {copy.login.open}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
