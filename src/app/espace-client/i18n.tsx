import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fr" | "en" | "fon";

type Dict = Record<string, string>;

// Only the most user-visible strings are translated. French is the source.
const FR: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.contracts": "Mes contrats",
  "nav.subscribe": "Souscrire",
  "nav.claims": "Sinistres",
  "nav.payments": "Cotisations",
  "nav.beneficiaries": "Bénéficiaires",
  "nav.documents": "Documents",
  "nav.card": "Ma carte",
  "nav.messages": "Messagerie",
  "nav.notifications": "Notifications",
  "nav.profile": "Profil",
  "nav.settings": "Paramètres",
  "nav.partners": "Partenaires",
  "common.loading": "Chargement...",
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.logout": "Déconnexion",
  "common.welcome": "Bienvenue",
  "settings.title": "Paramètres",
  "settings.subtitle": "Préférences, notifications et sécurité.",
  "settings.notifications": "Notifications",
  "settings.notifications.desc": "Choisissez comment IPPOO vous contacte.",
  "settings.sms": "Recevoir des SMS",
  "settings.email": "Recevoir des emails",
  "settings.lang": "Langue",
  "settings.lang.desc": "Interface de l'application.",
  "settings.security": "Sécurité",
  "settings.security.desc": "Changez votre mot de passe régulièrement.",
  "settings.audit": "Journal d'activité",
  "settings.audit.desc": "Dernières actions sensibles sur votre compte.",
  "settings.saved": "Préférences enregistrées",
};

const EN: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.contracts": "My contracts",
  "nav.subscribe": "Subscribe",
  "nav.claims": "Claims",
  "nav.payments": "Payments",
  "nav.beneficiaries": "Beneficiaries",
  "nav.documents": "Documents",
  "nav.card": "My card",
  "nav.messages": "Messages",
  "nav.notifications": "Notifications",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.partners": "Partners",
  "common.loading": "Loading...",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.logout": "Sign out",
  "common.welcome": "Welcome",
  "settings.title": "Settings",
  "settings.subtitle": "Preferences, notifications and security.",
  "settings.notifications": "Notifications",
  "settings.notifications.desc": "Choose how IPPOO reaches you.",
  "settings.sms": "Receive SMS",
  "settings.email": "Receive emails",
  "settings.lang": "Language",
  "settings.lang.desc": "App interface language.",
  "settings.security": "Security",
  "settings.security.desc": "Change your password regularly.",
  "settings.audit": "Activity log",
  "settings.audit.desc": "Recent sensitive actions on your account.",
  "settings.saved": "Preferences saved",
};

const FON: Dict = {
  "nav.dashboard": "Tablo ɖaxó",
  "nav.contracts": "Akwɛ́ ce lɛ",
  "nav.subscribe": "Sɔ́ akwɛ́",
  "nav.claims": "Adɔ̌n",
  "nav.payments": "Akwɛ́ ɖa",
  "nav.beneficiaries": "Mɛ e nɔ ɖu lɛ",
  "nav.documents": "Wèmá",
  "nav.card": "Kátì ce",
  "nav.messages": "Wèmá ɖɔ",
  "nav.notifications": "Xónusin",
  "nav.profile": "Nyikɔ́ ce",
  "nav.settings": "Ðiɖe lɛ",
  "nav.partners": "Gbɛ̀tɔ́ alɔdo tɔn",
  "common.loading": "É ɖò xixà...",
  "common.cancel": "Gbɛ̀",
  "common.save": "Hɛn",
  "common.logout": "Tɔ́n",
  "common.welcome": "Kúabɔ̀",
  "settings.title": "Ðiɖe lɛ",
  "settings.subtitle": "Jlǒ, xónusin kpó alɔdo kpó.",
  "settings.notifications": "Xónusin",
  "settings.notifications.desc": "Sɔ́ lè e IPPOO ka ylɔ́ we ɖó.",
  "settings.sms": "Yí SMS",
  "settings.email": "Yí email",
  "settings.lang": "Gbè",
  "settings.lang.desc": "Gbè e ɖò ǎplikasyɔ̀n ɔ́ mɛ.",
  "settings.security": "Alɔdo",
  "settings.security.desc": "Hùzú nyikɔ́ jǐjɛ́ towe hwɛhwɛ̀.",
  "settings.audit": "Wàlɔ́ towe",
  "settings.audit.desc": "Wǎ ɖaxó e a wà ɖò gbɛ̀ towe mɛ lɛ.",
  "settings.saved": "Jlǒ ɔ́ hɛn",
};

const DICTS: Record<Lang, Dict> = { fr: FR, en: EN, fon: FON };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof FR) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE = "ippoo:lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved === "fr" || saved === "en" || saved === "fon") return saved;
    } catch {}
    return "fr";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE, l); } catch {}
    document.documentElement.lang = l === "fon" ? "fon-BJ" : l;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "fon" ? "fon-BJ" : lang;
  }, [lang]);

  const t = useCallback((key: string) => DICTS[lang]?.[key] ?? DICTS.fr[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: t as I18nCtx["t"] }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
