// =========================================================================
// Période de stage de la mutuelle.
//
// Règle métier : un assuré doit avoir cotisé pendant au moins 6 mois (un
// semestre) à compter de sa souscription avant de pouvoir bénéficier de sa
// mutuelle (déclarer un sinistre / obtenir une prise en charge).
// La règle est appliquée côté serveur (POST /claims) et reflétée ici pour
// l'affichage sur toute la plateforme.
// =========================================================================
export const BENEFIT_QUALIFYING_MONTHS = 6;

export interface BenefitEligibility {
  eligible: boolean;
  /** Date à partir de laquelle l'assuré peut bénéficier (null si inconnue). */
  eligibleAt: Date | null;
  /** Jours restants avant l'ouverture des droits (0 si déjà éligible). */
  daysLeft: number;
}

/** Calcule l'éligibilité à partir de la date de début du contrat. */
export function benefitEligibility(startDate?: string | null): BenefitEligibility {
  if (!startDate) return { eligible: false, eligibleAt: null, daysLeft: BENEFIT_QUALIFYING_MONTHS * 30 };
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return { eligible: false, eligibleAt: null, daysLeft: BENEFIT_QUALIFYING_MONTHS * 30 };
  const eligibleAt = new Date(start);
  eligibleAt.setMonth(eligibleAt.getMonth() + BENEFIT_QUALIFYING_MONTHS);
  const now = Date.now();
  const eligible = now >= eligibleAt.getTime();
  const daysLeft = eligible ? 0 : Math.ceil((eligibleAt.getTime() - now) / 86_400_000);
  return { eligible, eligibleAt, daysLeft };
}

/** Format court fr-FR d'une date d'éligibilité. */
export function formatEligibleDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
