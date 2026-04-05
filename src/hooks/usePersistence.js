import { useCallback } from "react";

const DB_NAME = "eldon-studio-site";
const STORE_NAME = "persistent-state";
const STORAGE_KEY = "eldon-portfolios";
const LOCAL_STORAGE_KEY = "eldon-portfolios-fallback";
const PROFILE_STORAGE_KEY = "eldon-profile";
const PROFILE_LOCAL_STORAGE_KEY = "eldon-profile-fallback";
const LOCALE_STORAGE_KEY = "eldon-locale";
const BACKUP_FILE_TYPE = "eldon-studio-backup";
const BACKUP_FILE_VERSION = 1;

function openPortfolioDb() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadValueFromStorage(indexedDbKey, localStorageKey) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const db = await openPortfolioDb();
    if (db) {
      const result = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(indexedDbKey);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });

      if (result !== undefined && result !== null) {
        return result;
      }
    }
  } catch {
    // Fall back to localStorage below.
  }

  try {
    const fallback = window.localStorage.getItem(localStorageKey);
    if (!fallback) {
      return null;
    }

    const parsed = JSON.parse(fallback);
    return parsed ?? null;
  } catch {
    return null;
  }
}

async function saveValueToStorage(indexedDbKey, localStorageKey, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const db = await openPortfolioDb();
    if (db) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(value, indexedDbKey);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  } catch {
    // Keep localStorage fallback.
  }

  try {
    window.localStorage.setItem(localStorageKey, JSON.stringify(value));
  } catch {
    // Ignore fallback persistence issues.
  }
}

export function usePersistence({ toPortfolioShape, toProfileShape }) {
  const getInitialLocale = useCallback(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "zh" ? "zh" : "en";
  }, []);

  const persistLocale = useCallback((locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, []);

  const loadPortfoliosFromStorage = useCallback(async () => {
    const value = await loadValueFromStorage(STORAGE_KEY, LOCAL_STORAGE_KEY);
    return Array.isArray(value) ? value.map(toPortfolioShape) : null;
  }, [toPortfolioShape]);

  const savePortfoliosToStorage = useCallback(async (portfolios) => {
    return saveValueToStorage(STORAGE_KEY, LOCAL_STORAGE_KEY, portfolios);
  }, []);

  const loadProfileFromStorage = useCallback(async () => {
    const value = await loadValueFromStorage(PROFILE_STORAGE_KEY, PROFILE_LOCAL_STORAGE_KEY);
    return value && typeof value === "object" ? toProfileShape(value) : null;
  }, [toProfileShape]);

  const saveProfileToStorage = useCallback(async (profile) => {
    return saveValueToStorage(PROFILE_STORAGE_KEY, PROFILE_LOCAL_STORAGE_KEY, profile);
  }, []);

  const createBackupPayload = useCallback(
    ({ portfolios, profile, locale }) => ({
      type: BACKUP_FILE_TYPE,
      version: BACKUP_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      locale: locale === "zh" ? "zh" : "en",
      profile: toProfileShape(profile),
      portfolios: Array.isArray(portfolios) ? portfolios.map(toPortfolioShape) : [],
    }),
    [toPortfolioShape, toProfileShape],
  );

  const normalizeBackupPayload = useCallback(
    (payload) => {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("invalid-backup");
      }

      if (
        payload.type !== BACKUP_FILE_TYPE ||
        payload.version !== BACKUP_FILE_VERSION ||
        !Array.isArray(payload.portfolios)
      ) {
        throw new Error("invalid-backup");
      }

      return {
        locale: payload.locale === "zh" ? "zh" : "en",
        profile: toProfileShape(payload.profile),
        portfolios: payload.portfolios.map(toPortfolioShape),
      };
    },
    [toPortfolioShape, toProfileShape],
  );

  return {
    getInitialLocale,
    persistLocale,
    loadPortfoliosFromStorage,
    savePortfoliosToStorage,
    loadProfileFromStorage,
    saveProfileToStorage,
    createBackupPayload,
    normalizeBackupPayload,
  };
}
