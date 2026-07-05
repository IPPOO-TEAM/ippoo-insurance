import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Locale = "fr" | "en";

const STORAGE_KEY = "ippoo:admin:locale";

const DICT: Record<Locale, Record<string, string>> = {
  fr: {
    "nav.overview": "Vue d'ensemble",
    "nav.claims": "Sinistres",
    "nav.members": "Membres",
    "nav.contracts": "Contrats",
    "nav.payments": "Paiements",
    "nav.messages": "Messagerie",
    "nav.agents": "Conseillers",
    "nav.kyc": "Vérifications KYC",
    "nav.broadcast": "Diffusion",
    "nav.promos": "Carrousel",
    "nav.partners": "Partenaires",
    "nav.site": "Contenu du site",
    "nav.audit": "Journal d'activité",
    "nav.system": "Système & ops",
    "action.logout": "Sortir",
    "action.reload": "Actualiser",
    "action.loadMore": "Charger plus",
    "search.placeholder": "Rechercher membre, contrat, sinistre…",
    "search.empty": "Aucun résultat.",
    "theme.light": "Mode clair",
    "theme.dark": "Mode sombre",
    "locale.label": "Langue",
  },
  en: {
    "nav.overview": "Overview",
    "nav.claims": "Claims",
    "nav.members": "Members",
    "nav.contracts": "Contracts",
    "nav.payments": "Payments",
    "nav.messages": "Inbox",
    "nav.agents": "Agents",
    "nav.kyc": "KYC checks",
    "nav.broadcast": "Broadcast",
    "nav.promos": "Carousel",
    "nav.partners": "Partners",
    "nav.site": "Site content",
    "nav.audit": "Activity log",
    "nav.system": "System & ops",
    "action.logout": "Sign out",
    "action.reload": "Refresh",
    "action.loadMore": "Load more",
    "search.placeholder": "Search member, contract, claim…",
    "search.empty": "No result.",
    "theme.light": "Light mode",
    "theme.dark": "Dark mode",
    "locale.label": "Language",
  },
};

type Ctx = { locale: Locale; t: (key: string) => string; setLocale: (l: Locale) => void };
const I18nCtx = createContext<Ctx | null>(null);

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "fr";
  });
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, locale); } catch {}
  }, [locale]);
  const t = (key: string) => DICT[locale][key] ?? DICT.fr[key] ?? key;
  return <I18nCtx.Provider value={{ locale, t, setLocale: setLocaleState }}>{children}</I18nCtx.Provider>;
}

export function useAdminI18n(): Ctx {
  const v = useContext(I18nCtx);
  if (!v) return { locale: "fr", t: (k) => DICT.fr[k] ?? k, setLocale: () => {} };
  return v;
}
