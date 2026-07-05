// Version courante des CGU / Politique de confidentialité / Traitement des
// données. Quand on bump cette constante, tous les utilisateurs existants
// reçoivent automatiquement le modal de re-consentement (#14).
export const CONSENT_VERSION = "2026-05";

export const CONSENT_TYPES = ["cgu", "confidentialite", "traitement"] as const;
export type ConsentType = typeof CONSENT_TYPES[number];

export const CONSENT_LABELS: Record<ConsentType, string> = {
  cgu: "Conditions générales d'utilisation",
  confidentialite: "Politique de confidentialité",
  traitement: "Traitement de mes données personnelles",
};
