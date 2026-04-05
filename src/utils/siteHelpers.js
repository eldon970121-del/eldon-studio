export function getLocalizedText(value, locale = "en") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[locale] || value.en || value.zh || "";
  }

  return typeof value === "string" ? value : "";
}

export function toLocalizedField(value, fallback = { en: "", zh: "" }) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      en: value.en?.trim() || fallback.en || "",
      zh: value.zh?.trim() || value.en?.trim() || fallback.zh || fallback.en || "",
    };
  }

  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return {
      en: fallback.en || "",
      zh: fallback.zh || fallback.en || "",
    };
  }

  if (text === fallback.en || text === fallback.zh) {
    return {
      en: fallback.en || text,
      zh: fallback.zh || text,
    };
  }

  return {
    en: text,
    zh: text,
  };
}

export function isEphemeralImageUrl(url) {
  return typeof url === "string" && url.startsWith("blob:");
}

export function resolveUploadErrorMessage(error, copyGroup) {
  if (error?.message?.includes("Supabase is not configured")) {
    return copyGroup.supabaseConfigMissing;
  }

  return copyGroup.uploadFailed || copyGroup.saveFailed;
}

export function getCoverImage(portfolio) {
  if (!portfolio || !Array.isArray(portfolio.images)) {
    return null;
  }

  return portfolio.images.find((image) => image.isCover) || portfolio.images[0] || null;
}
