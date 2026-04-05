import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { IconClose, MagneticButton } from "../ui/siteControls";

export function AuthModal({ copy, isOpen, onClose }) {
  const formId = "auth-modal-form";
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    setPassword("");
  }, [isOpen, mode]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage(copy.login.authUnavailable);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data?.session) {
          onClose();
        } else {
          setStatusMessage(copy.login.signUpSuccess);
        }
      }
    } catch (error) {
      setErrorMessage(error?.message || copy.login.authUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0d0f14]/78 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,760px)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-4 shadow-soft sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--site-border-soft)] pb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--site-accent)]">
              {copy.login.open}
            </p>
            <h3 className="mt-3 font-display text-3xl text-[color:var(--site-text)]">
              {copy.login.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.login.text}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.login.close}
            className="micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 text-[color:var(--site-muted-strong)]"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mt-5 inline-flex rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 p-1">
            {[
              { id: "signIn", label: copy.login.signInTab },
              { id: "signUp", label: copy.login.signUpTab },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`micro-button rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition ${
                  mode === item.id
                    ? "bg-[color:var(--site-accent)] text-white"
                    : "text-[color:var(--site-muted)] hover:text-[color:var(--site-text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form id={formId} onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="field-shell">
            <span className="field-label">{copy.login.emailLabel}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.login.emailPlaceholder}
              className="field-input"
            />
          </label>

          <label className="field-shell">
            <span className="field-label">{copy.login.passwordLabel}</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.login.passwordPlaceholder}
              className="field-input"
            />
          </label>

          {errorMessage ? (
            <div className="status-panel status-panel-error px-4 py-3 text-sm">{errorMessage}</div>
          ) : null}

          {statusMessage ? (
            <div className="status-panel status-panel-success px-4 py-3 text-sm">
              {statusMessage}
            </div>
          ) : null}

          <div className="pb-1" />
          </form>
        </div>

        <div className="mt-4 -mx-4 flex flex-col gap-3 border-t border-[color:var(--site-border-soft)] bg-[linear-gradient(180deg,rgba(23,25,32,0.84)_0%,rgba(23,25,32,0.96)_100%)] px-4 pt-4 sm:-mx-7 sm:flex-row sm:justify-end sm:px-7 sm:pt-5">
          <button
            type="button"
            onClick={onClose}
            className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
          >
            {copy.login.close}
          </button>
          <MagneticButton
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#10131c] disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "signIn"
                ? copy.login.submittingSignIn
                : copy.login.submittingSignUp
              : mode === "signIn"
                ? copy.login.submitSignIn
                : copy.login.submitSignUp}
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
