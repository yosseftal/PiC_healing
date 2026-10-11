export const LOCALE_STORAGE_KEY = "pic-web.locale.v1";
export type Locale = "he" | "en";
export type Direction = "rtl" | "ltr";

export function isLocale(value: unknown): value is Locale {
  return value === "he" || value === "en";
}

export function directionFor(locale: Locale): Direction {
  return locale === "he" ? "rtl" : "ltr";
}

export function readLocale(): Locale {
  try {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : "he";
  } catch {
    return "he";
  }
}

export function saveLocale(locale: Locale): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    // Persistence is optional: the active visit retains the selected presentation.
  }
}
