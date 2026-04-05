import { useEffect, useState } from "react";

function resolveValue(value) {
  return typeof value === "function" ? value() : value;
}

export function useLocalStorageState(key, initialValue, normalize = (value) => value) {
  const [state, setState] = useState(() => {
    const fallback = normalize(resolveValue(initialValue));

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue === null ? fallback : normalize(JSON.parse(rawValue));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(normalize(state)));
    } catch {
      // Ignore persistence failures and keep in-memory state responsive.
    }
  }, [key, normalize, state]);

  return [state, setState];
}
