import { createContext, type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { directionFor, isLocale, readLocale, saveLocale, type Direction, type Locale } from "./locale";
import { messageDefinitions, createCoreMessageResolver } from "./core-messages";
import type { MessageArguments, ResolvedMessage } from "./messages";

type BoundMessageResolver = <K extends keyof typeof messageDefinitions>(
  key: K, ...args: MessageArguments<typeof messageDefinitions, K>
) => ResolvedMessage;

interface LocaleContextValue {
  locale: Locale;
  direction: Direction;
  selectLocale: (locale: Locale) => void;
  customNemarAlias: string | null;
  setCustomNemarAlias: (alias: string | null) => void;
  message: BoundMessageResolver;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(readLocale);
  const [customNemarAlias, setCustomNemarAlias] = useState<string | null>(null);
  const selectedLocale = useRef(locale);
  const direction = directionFor(locale);
  const selectLocale = useCallback((nextLocale: Locale) => {
    if (!isLocale(nextLocale) || selectedLocale.current === nextLocale) {
      return;
    }
    selectedLocale.current = nextLocale;
    setLocale(nextLocale);
    saveLocale(nextLocale);
  }, []);

  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    const previousLang = root.getAttribute("lang");
    const previousDir = root.getAttribute("dir");
    return () => {
      if (previousLang === null) root.removeAttribute("lang");
      else root.setAttribute("lang", previousLang);
      if (previousDir === null) root.removeAttribute("dir");
      else root.setAttribute("dir", previousDir);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
    }
  }, [locale, direction]);

  const resolveMessage = useMemo(() => createCoreMessageResolver(customNemarAlias), [customNemarAlias]);
  const message: BoundMessageResolver = useCallback(
    (key, ...args) => resolveMessage(locale, key, ...args), [locale, resolveMessage],
  );
  const value = useMemo(() => ({ locale, direction, selectLocale, customNemarAlias, setCustomNemarAlias, message }),
    [locale, direction, selectLocale, customNemarAlias, message]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Standalone primitives inherit their embedding document when no application provider is present. */
export function useOptionalLocale(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

export function useLocale(): LocaleContextValue {
  const value = useOptionalLocale();
  if (value === null) {
    throw new Error("LocaleProvider is required for language selection");
  }
  return value;
}
