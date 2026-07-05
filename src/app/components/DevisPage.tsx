import { useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Calculator, Users, Calendar, CreditCard, CheckCircle2, ArrowRight, Phone, Shield,
  Sparkles, Info, MapPin, Mail, User, Lock, UserPlus, LogIn
} from "lucide-react";
import { products } from "../data/products";
import { usePricing } from "../data/pricing";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import { isRegistered } from "../lib/auth";

type Periodicite = "mensuelle" | "trimestrielle" | "annuelle";

const periodMultiplier: Record<Periodicite, number> = {
  mensuelle: 1,
  trimestrielle: 3,
  annuelle: 12,
};

// Extrait la cotisation mensuelle d'une formule (ex: "2 500 FCFA / mois" => 2500)
function parseCotisation(c: string): number | null {
  const m = c.replace(/\s/g, "").match(/(\d+)FCFA/);
  return m ? parseInt(m[1], 10) : null;
}

export function DevisPage() {
  const { t } = useLang();
  usePageMeta({
    title: "Devis gratuit Estimez votre cotisation en 2 minutes",
    description: "Simulateur de cotisation IPPOO ASSURANCE : choisissez votre produit, formule, périodicité et bénéficiaires. Recevez un devis personnalisé en 24h ouvrées.",
  });
  const [registered] = useState(() => isRegistered());
  const [productId, setProductId] = useState<string>(products[0].id);
  const [formuleIdx, setFormuleIdx] = useState<number>(0);
  const [periodicite, setPeriodicite] = useState<Periodicite>("mensuelle");
  const [nbBeneficiaires, setNbBeneficiaires] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);

  const { details: allDetails } = usePricing();
  const product = products.find((p) => p.id === productId)!;
  const details = allDetails[productId];
  const formule = details?.formules[formuleIdx];

  const cotisationMensuelle = useMemo(() => {
    if (!formule) return null;
    // Tarif défini par formule depuis le back office (fallback 15 500 FCFA
    // si la cotisation n'est pas un montant chiffrable, ex. « sur devis »).
    void nbBeneficiaires;
    return parseCotisation(formule.cotisation) ?? 15500;
  }, [formule, nbBeneficiaires]);

  const total = cotisationMensuelle ? cotisationMensuelle * periodMultiplier[periodicite] : null;

  const remiseAnnuelle = periodicite === "annuelle" ? 0.08 : 0;
  const totalRemise = total ? Math.round(total * (1 - remiseAnnuelle)) : null;
  const economie = total && totalRemise ? total - totalRemise : 0;

  const onProductChange = (id: string) => {
    setProductId(id);
    setFormuleIdx(0);
  };

  if (!registered) return <DevisAuthGate />;

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-ippoo-green/[0.08] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-[5%] w-64 h-64 bg-ippoo-blue/[0.06] rounded-full blur-[80px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5 text-ippoo-green" />
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.devisBadge}</span>
            </div>
            <h1 className="mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {t.devisTitle}
            </h1>
            <p className="text-white/60" style={{ fontSize: "1rem", lineHeight: 1.8 }}>
              {t.devisSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* SIMULATEUR */}
      <section className="py-14 sm:py-20 bg-[#f7f8fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border/30 shadow-sm space-y-8">
            {/* Step 1: produit */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-ippoo-green/10 flex items-center justify-center" style={{ color: "#0B6E4F", fontWeight: 800, fontSize: "0.875rem" }}>1</div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Choisissez votre produit</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {products.map((p) => {
                  const active = p.id === productId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onProductChange(p.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${active ? "shadow-md" : "border-border/30 hover:border-border/60 bg-white"}`}
                      style={active ? { backgroundColor: `${p.color}10`, borderColor: p.color } : {}}
                    >
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: active ? p.color : undefined }}>{p.shortName}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {p.category === "assurance" ? "Assurance" : "Assistance"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: formule */}
            {details && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-ippoo-green/10 flex items-center justify-center" style={{ color: "#0B6E4F", fontWeight: 800, fontSize: "0.875rem" }}>2</div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Choisissez votre formule</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details.formules.map((f, i) => {
                    const active = i === formuleIdx;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormuleIdx(i)}
                        className={`text-left p-4 rounded-xl border transition-all ${active ? "shadow-md" : "border-border/30 hover:border-border/60 bg-white"}`}
                        style={active ? { borderColor: product.color, backgroundColor: `${product.color}08` } : {}}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{f.nom}</p>
                          {f.highlight && (
                            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: product.color, color: "white" }}>Recommandée</span>
                          )}
                        </div>
                        <p style={{ fontSize: "1rem", fontWeight: 800, color: product.color }}>{f.cotisation}</p>
                        <p className="text-muted-foreground mt-2" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>{f.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: bénéficiaires */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-ippoo-green/10 flex items-center justify-center" style={{ color: "#0B6E4F", fontWeight: 800, fontSize: "0.875rem" }}>3</div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Bénéficiaires</h2>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setNbBeneficiaires(Math.max(1, nbBeneficiaires - 1))}
                  className="w-10 h-10 rounded-xl border border-border/40 hover:border-foreground transition-colors" style={{ fontSize: "1.125rem", fontWeight: 700 }}>−</button>
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f7f8fa]">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{nbBeneficiaires} {nbBeneficiaires > 1 ? "personnes" : "personne"}</span>
                </div>
                <button type="button" onClick={() => setNbBeneficiaires(Math.min(8, nbBeneficiaires + 1))}
                  className="w-10 h-10 rounded-xl border border-border/40 hover:border-foreground transition-colors" style={{ fontSize: "1.125rem", fontWeight: 700 }}>+</button>
              </div>
              <p className="flex items-start gap-2 mt-3 text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Tarif unique IPPOO : 500 FCFA / jour sur 31 jours, quel que soit le nombre de bénéficiaires.
              </p>
            </div>

            {/* Step 4: périodicité */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-ippoo-green/10 flex items-center justify-center" style={{ color: "#0B6E4F", fontWeight: 800, fontSize: "0.875rem" }}>4</div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Périodicité de paiement</h2>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: "mensuelle", label: "Mensuelle", sub: "Sans engagement" },
                  { id: "trimestrielle", label: "Trimestrielle", sub: "Plus pratique" },
                  { id: "annuelle", label: "Annuelle", sub: "−8 % de remise" },
                ] as { id: Periodicite; label: string; sub: string }[]).map((opt) => {
                  const active = opt.id === periodicite;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPeriodicite(opt.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${active ? "border-ippoo-green bg-ippoo-green/[0.06]" : "border-border/30 bg-white hover:border-border/60"}`}
                    >
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: active ? "#0B6E4F" : undefined }}>{opt.label}</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.6875rem" }}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Récap sticky */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl overflow-hidden border border-border/30 shadow-md">
              <div className="px-5 py-3 flex items-center gap-2 text-white" style={{ backgroundColor: product.color }}>
                <Calculator className="w-4 h-4" />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Votre estimation</span>
              </div>
              <div className="bg-white p-5 space-y-4">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Produit</p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{product.shortName}</p>
                </div>
                {formule && (
                  <div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Formule</p>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formule.nom}</p>
                  </div>
                )}
                <div className="border-t border-border/30 pt-4">
                  {cotisationMensuelle === null ? (
                    <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                      Cette formule est établie sur devis personnalisé. Un conseiller vous recontactera.
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-1" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                        À payer ({periodicite})
                      </p>
                      <p style={{ fontSize: "2rem", fontWeight: 900, color: product.color, letterSpacing: "-0.02em" }}>
                        {totalRemise?.toLocaleString("fr-FR")} <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>FCFA</span>
                      </p>
                      {economie > 0 && (
                        <p className="mt-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0B6E4F" }}>
                          Vous économisez {economie.toLocaleString("fr-FR")} FCFA
                        </p>
                      )}
                      <p className="text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>
                        Soit {cotisationMensuelle.toLocaleString("fr-FR")} FCFA / mois équivalent.
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f7f8fa] text-muted-foreground" style={{ fontSize: "0.6875rem", lineHeight: 1.6 }}>
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Estimation indicative. Le tarif définitif dépend du questionnaire de souscription et des Conditions Particulières.
                </div>
                <a href="#devis" className="inline-flex w-full items-center justify-center gap-2 bg-[#0d1117] text-white px-5 py-3.5 rounded-xl hover:bg-[#1a1f29] transition-colors" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  Recevoir mon devis détaillé
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULAIRE DEVIS */}
      <section id="devis" className="py-16 sm:py-24 bg-white border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Demander un devis personnalisé
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto" style={{ fontSize: "0.9375rem", lineHeight: 1.8 }}>
              Un conseiller IPPOO vous rappelle sous 24h ouvrées pour valider votre formule et vous remettre votre attestation d'assurance.
            </p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 border border-ippoo-green/30 bg-ippoo-green/[0.06] text-center">
              <div className="w-14 h-14 rounded-2xl bg-ippoo-green/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-ippoo-green" />
              </div>
              <h3 className="mb-2" style={{ fontSize: "1.25rem", fontWeight: 800 }}>Demande reçue, merci !</h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
                Numéro de référence : <strong>DEV-{Date.now().toString().slice(-6)}</strong><br />
                Un conseiller IPPOO vous contactera sous 24h ouvrées.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 mt-6 text-[#0B6E4F]" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                Retour à l'accueil <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="bg-[#f7f8fa] rounded-2xl p-6 sm:p-8 space-y-5 border border-border/30"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={User} label="Prénom" name="prenom" required />
                <Field icon={User} label="Nom" name="nom" required />
                <Field icon={Phone} label="Téléphone" name="tel" type="tel" placeholder="+229 …" required />
                <Field icon={Mail} label="E-mail" name="email" type="email" />
                <Field icon={MapPin} label="Ville / Quartier" name="ville" required />
                <Field icon={Calendar} label="Date de naissance" name="dob" type="date" />
              </div>
              <div>
                <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Message (optionnel)</label>
                <textarea name="message" rows={3} className="w-full px-4 py-3 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green resize-none" style={{ fontSize: "0.9375rem" }} placeholder="Précisez votre situation, vos besoins…" />
              </div>
              <label className="flex items-start gap-2.5 text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
                <input type="checkbox" required className="mt-0.5" />
                J'accepte d'être recontacté(e) par IPPOO ASSURANCE et je reconnais avoir pris connaissance de la <Link to="/confidentialite" className="text-[#0B6E4F] underline">politique de confidentialité</Link>.
              </label>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#0B6E4F] text-white px-6 py-3.5 rounded-xl hover:bg-[#094d38] transition-colors" style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                <Shield className="w-4 h-4" />
                Envoyer ma demande de devis
              </button>
              <p className="text-center text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
                Souscription possible par mobile money (Orange Money, Wave, MTN, Moov), espèces ou virement.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  icon: Icon, label, name, type = "text", required, placeholder,
}: { icon: React.ElementType; label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && " *"}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green"
          style={{ fontSize: "0.9375rem" }}
        />
      </div>
    </div>
  );
}


function DevisAuthGate() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#FFF8F2]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] border border-black/[0.05] text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFE8D1] flex items-center justify-center text-[#C04A00]">
          <Lock className="w-7 h-7" />
        </div>
        <p className="mt-5 text-[#FF7A00]" style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em" }}>
          INSCRIPTION REQUISE
        </p>
        <h2 className="mt-2" style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          Créez votre compte pour obtenir un devis
        </h2>
        <p className="mt-3 text-[#5a544c]" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Toute demande de devis IPPOO ASSURANCE passe par une inscription préalable. C'est rapide, gratuit et sans engagement.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-white shadow-[0_14px_30px_-12px_rgba(255,59,87,0.5)]"
            style={{ background: "linear-gradient(90deg,#FF7A00,#FF3B57)", fontSize: "0.9375rem", fontWeight: 800 }}
          >
            <UserPlus className="w-4 h-4" /> S'inscrire maintenant <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/espace-client/connexion"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-black/10 hover:border-[#0B6E4F] hover:text-[#0B6E4F] transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 700 }}
          >
            <LogIn className="w-4 h-4" /> J'ai déjà un compte
          </Link>
        </div>
        <p className="mt-5 text-[#7a7468]" style={{ fontSize: "0.75rem", lineHeight: 1.55 }}>
          Une fois inscrit, vous accéderez au simulateur et pourrez recevoir votre devis personnalisé sous 24h ouvrées.
        </p>
      </motion.div>
    </div>
  );
}
