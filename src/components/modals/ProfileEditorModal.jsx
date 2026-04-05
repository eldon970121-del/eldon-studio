import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImageToCloud } from "../../services/cloudStorage";
import { getLocalizedText, resolveUploadErrorMessage, toLocalizedField } from "../../utils/siteHelpers";
import { IconClose } from "../ui/siteControls";

export function ProfileEditorModal({ profile, onClose, onSave, copy, locale, initialProfile }) {
  const profileDefaults = initialProfile ?? profile;
  const initialName = toLocalizedField(profile.name, profileDefaults.name);
  const initialRole = toLocalizedField(profile.role, profileDefaults.role);
  const initialIntro = toLocalizedField(profile.intro, profileDefaults.intro);
  const [nameEn, setNameEn] = useState(initialName.en);
  const [nameZh, setNameZh] = useState(initialName.zh);
  const [roleEn, setRoleEn] = useState(initialRole.en);
  const [roleZh, setRoleZh] = useState(initialRole.zh);
  const [email, setEmail] = useState(profile.email);
  const [introEn, setIntroEn] = useState(initialIntro.en);
  const [introZh, setIntroZh] = useState(initialIntro.zh);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    noClick: true,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setAvatarFile((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return { file, previewUrl };
      });
      setAvatarPreview(previewUrl);
      setErrorMessage("");
    },
  });

  useEffect(() => {
    return () => {
      if (avatarFile?.previewUrl) {
        URL.revokeObjectURL(avatarFile.previewUrl);
      }
    };
  }, [avatarFile]);

  async function handleSave() {
    const nextNameEn = nameEn.trim();
    const nextNameZh = nameZh.trim();
    const nextRoleEn = roleEn.trim();
    const nextRoleZh = roleZh.trim();
    const nextEmail = email.trim();
    const nextIntroEn = introEn.trim();
    const nextIntroZh = introZh.trim();

    if (!(nextNameEn || nextNameZh) || !(nextRoleEn || nextRoleZh) || !nextEmail) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const uploadedAvatar = avatarFile ? await uploadImageToCloud(avatarFile.file) : null;

      await onSave({
        name: {
          en: nextNameEn || nextNameZh || getLocalizedText(profileDefaults.name, "en"),
          zh: nextNameZh || nextNameEn || getLocalizedText(profileDefaults.name, "zh"),
        },
        role: {
          en: nextRoleEn || nextRoleZh || getLocalizedText(profileDefaults.role, "en"),
          zh: nextRoleZh || nextRoleEn || getLocalizedText(profileDefaults.role, "zh"),
        },
        email: nextEmail,
        intro: {
          en: nextIntroEn || nextIntroZh || getLocalizedText(profileDefaults.intro, "en"),
          zh: nextIntroZh || nextIntroEn || getLocalizedText(profileDefaults.intro, "zh"),
        },
        avatarUrl: uploadedAvatar?.publicUrl || profile.avatarUrl,
      });
    } catch (error) {
      setErrorMessage(resolveUploadErrorMessage(error, copy.admin));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[131] flex items-center justify-center bg-[#0d0f14]/78 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-8" onClick={onClose}>
      <div
        className="flex max-h-[min(92vh,960px)] w-full max-w-3xl flex-col overflow-hidden rounded-[2.1rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-4 shadow-soft sm:p-8"
        style={{ borderColor: "var(--site-border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[color:var(--site-border-soft)] pb-4 sm:mb-8 sm:pb-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h3 className="font-display text-3xl text-[color:var(--site-text)]">{copy.admin.profileTitle}</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.profileText}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.admin.cancel}
            className="micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 text-[color:var(--site-muted-strong)]"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.avatar}
            </p>

            <div
              {...getRootProps()}
              className={`mt-5 rounded-[1.5rem] border-2 border-dashed px-5 py-6 text-center transition ${
                isDragActive
                  ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                  : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
              }`}
            >
              <input {...getInputProps()} />
              <img
                src={avatarPreview}
                alt={getLocalizedText(profile.name, locale)}
                className="mx-auto h-40 w-40 rounded-[1.5rem] object-cover ring-1 ring-white/10"
              />
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
            </div>

            <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.photographerDetails}
            </p>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.nameEnLabel}</span>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(event) => setNameEn(event.target.value)}
                  placeholder={copy.admin.namePlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.nameZhLabel}</span>
                <input
                  type="text"
                  value={nameZh}
                  onChange={(event) => setNameZh(event.target.value)}
                  placeholder={copy.admin.namePlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.roleEnLabel}</span>
                <input
                  type="text"
                  value={roleEn}
                  onChange={(event) => setRoleEn(event.target.value)}
                  placeholder={copy.admin.rolePlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.roleZhLabel}</span>
                <input
                  type="text"
                  value={roleZh}
                  onChange={(event) => setRoleZh(event.target.value)}
                  placeholder={copy.admin.rolePlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.emailLabel}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.introEnLabel}</span>
                <textarea
                  rows={4}
                  value={introEn}
                  onChange={(event) => setIntroEn(event.target.value)}
                  placeholder={copy.admin.introPlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.introZhLabel}</span>
                <textarea
                  rows={4}
                  value={introZh}
                  onChange={(event) => setIntroZh(event.target.value)}
                  placeholder={copy.admin.introPlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>
            </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-[1.25rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100 sm:mt-6">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 -mx-4 flex flex-col gap-3 border-t border-[color:var(--site-border-soft)] bg-[linear-gradient(180deg,rgba(23,25,32,0.84)_0%,rgba(23,25,32,0.96)_100%)] px-4 pt-4 sm:-mx-8 sm:mt-8 sm:flex-row sm:justify-end sm:px-8 sm:pt-5">
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
            disabled={isSaving}
            className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#10131c] disabled:opacity-50"
          >
            {isSaving ? copy.admin.saving : copy.admin.saveProfile}
          </button>
        </div>
      </div>
    </div>
  );
}
