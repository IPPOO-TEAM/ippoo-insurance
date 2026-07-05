import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { locales, tCommon, type LocaleCode, type LocaleDef } from "./i18n";

interface Ctx {
  locale: LocaleDef;
  setLocale: (code: LocaleCode) => void;
  t: (typeof tCommon)[LocaleCode];
  showWelcome: boolean;
  dismissWelcome: () => void;
}

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "ippoo_locale";
const WELCOME_KEY = "ippoo_welcome_dismissed";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<LocaleCode>("fr");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
    if (stored && locales.some((l) => l.code === stored)) setCode(stored);
    if (window.localStorage.getItem(WELCOME_KEY) !== "1") setShowWelcome(true);
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setCode(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    if (typeof document !== "undefined") document.documentElement.lang = next === "fr" ? "fr" : next;
    setShowWelcome(true);
    if (typeof window !== "undefined") window.localStorage.removeItem(WELCOME_KEY);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    if (typeof window !== "undefined") window.localStorage.setItem(WELCOME_KEY, "1");
  }, []);

  const value = useMemo<Ctx>(() => {
    const locale = locales.find((l) => l.code === code) ?? locales[0];
    return { locale, setLocale, t: tCommon[code] ?? tCommon.fr, showWelcome, dismissWelcome };
  }, [code, setLocale, showWelcome, dismissWelcome]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // HMR fallback: return a stable French-default context so consumers don't crash
  // when the module is hot-replaced and a stale component reference resolves to a
  // different LanguageContext instance than the live provider.
  return {
    locale: locales[0],
    setLocale: () => {},
    t: tCommon.fr,
    showWelcome: false,
    dismissWelcome: () => {},
  } as Ctx;
}
