import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, FileText, Search, Upload, CheckCircle2, Clock, Phone, MessageCircle,
  User, MapPin, Calendar, ArrowRight, ArrowLeft, Shield, Hash, X, FileCheck, Hourglass, BadgeCheck
} from "lucide-react";
import { products } from "../data/products";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";

type Tab = "declarer" | "suivre";
type Step = 1 | 2 | 3 | 4;

interface DossierEtape {
  label: string;
  date: string;
  done: boolean;
  current?: boolean;
}

interface MockDossier {
  reference: string;
  produit: string;
  dateDeclaration: string;
  statut: "Reçu" | "En instruction" | "Expertise" | "Indemnisé";
  montantEstime?: string;
  etapes: DossierEtape[];
  message: string;
}

const mockDossiers: Record<string, MockDossier> = {
  "SIN-2026-001": {
    reference: "SIN-2026-001",
    produit: "Marchandises – Étal",
    dateDeclaration: "18 mai 2026",
    statut: "Expertise",
    montantEstime: "1 200 000 FCFA",
    etapes: [
      { label: "Déclaration reçue", date: "18 mai 2026", done: true },
      { label: "Dossier complet vérifié", date: "19 mai 2026", done: true },
      { label: "Expertise sur place", date: "21 mai 2026", done: true, current: true },
      { label: "Indemnisation prévue", date: "≈ 28 mai 2026", done: false },
    ],
    message: "Un expert IPPOO est passé inventorier votre stock. Le rapport d'expertise sera finalisé sous 48h, puis l'indemnisation sera virée sur votre mobile money.",
  },
  "SIN-2026-002": {
    reference: "SIN-2026-002",
    produit: "Santé – Famille",
    dateDeclaration: "20 mai 2026",
    statut: "Indemnisé",
    montantEstime: "168 000 FCFA",
    etapes: [
      { label: "Déclaration reçue", date: "20 mai 2026", done: true },
      { label: "Dossier complet vérifié", date: "20 mai 2026", done: true },
      { label: "Validation médicale", date: "21 mai 2026", done: true },
      { label: "Indemnisation versée", date: "22 mai 2026", done: true, current: true },
    ],
    message: "Indemnisation versée directement au centre de santé conventionné. Aucun frais à votre charge au-delà de la franchise.",
  },
};

export function SinistrePage() {
  const { t } = useLang();
  usePageMeta({
    title: "Déclarer un sinistre ou suivre mon dossier",
    description: "Déclarez votre sinistre en ligne en moins de 5 minutes ou suivez l'avancement de votre dossier avec votre numéro de référence. Indemnisation sous 15 jours ouvrés.",
  });
  const [tab, setTab] = useState<Tab>("declarer");

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-[#E65100]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-[5%] w-64 h-64 bg-ippoo-green/[0.06] rounded-full blur-[80px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#E65100]/15 border border-[#E65100]/30 px-3 py-1.5 rounded-full mb-5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF8A50]" />
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.sinistrePage.badge}</span>
            </div>
            <h1 className="mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {t.sinistrePage.titleA} {t.sinistrePage.titleAccent}
            </h1>
            <p className="text-white/60" style={{ fontSize: "1rem", lineHeight: 1.8 }}>
              {t.sinistrePage.lead}
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="mt-10 inline-flex p-1.5 bg-white/[0.05] border border-white/10 rounded-2xl">
            {([
              { id: "declarer", label: "Déclarer un sinistre", icon: FileText },
              { id: "suivre", label: "Suivre mon dossier", icon: Search },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl transition-all ${tab === t.id ? "bg-white text-[#0d1117]" : "text-white/70 hover:text-white"}`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-[#f7f8fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {tab === "declarer" ? (
              <motion.div key="declarer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DeclarerFlow />
              </motion.div>
            ) : (
              <motion.div key="suivre" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SuivreFlow />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Urgences */}
      <section className="py-12 bg-white border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <UrgenceCard icon={Phone} label="Urgence 24/7" value="+229 01 41 52 10 92" color="#c0392b" sub="Accident, hospitalisation, vol" />
          <UrgenceCard icon={MessageCircle} label="WhatsApp" value="+229 01 41 52 10 92" color="#0B6E4F" sub="Photos, audio, suivi" />
          <UrgenceCard icon={MapPin} label="Point partenaire" value="Trouver le plus proche" color="#1565C0" sub="Aide à la déclaration" link="/points-partenaires" />
        </div>
      </section>
    </div>
  );
}

/* ====================== DÉCLARER ====================== */

function DeclarerFlow() {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [productId, setProductId] = useState(products[0].id);
  const [nature, setNature] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);
  const refNum = `SIN-2026-${String(Math.floor(Math.random() * 900) + 100)}`;

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 sm:p-12 border border-ippoo-green/30 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ippoo-green/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-ippoo-green" />
        </div>
        <h2 className="mb-2" style={{ fontSize: "1.5rem", fontWeight: 900 }}>Déclaration enregistrée</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
          Votre déclaration de sinistre a bien été reçue. Un gestionnaire vous contacte sous <strong>24h ouvrées</strong>.
        </p>
        <div className="inline-flex items-center gap-2 bg-[#f7f8fa] px-4 py-3 rounded-xl mb-6">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Référence</span>
          <span style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{refNum}</span>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => { setSubmitted(false); setStep(1); }}
            className="inline-flex items-center gap-2 bg-[#0d1117] text-white px-5 py-3 rounded-xl" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Nouvelle déclaration
          </button>
          <Link to="/" className="inline-flex items-center gap-2 bg-white border border-border/40 text-foreground px-5 py-3 rounded-xl" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Retour à l'accueil <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="bg-white rounded-2xl p-5 border border-border/30">
        <div className="flex items-center justify-between gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${step >= s ? "bg-ippoo-green text-white" : "bg-ippoo-gray text-muted-foreground"}`} style={{ fontSize: "0.8125rem", fontWeight: 800 }}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`h-0.5 flex-1 rounded-full ${step > s ? "bg-ippoo-green" : "bg-ippoo-gray"}`} />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 text-center text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span className={step >= 1 ? "text-foreground" : ""}>Contrat</span>
          <span className={step >= 2 ? "text-foreground" : ""}>Sinistre</span>
          <span className={step >= 3 ? "text-foreground" : ""}>Pièces</span>
          <span className={step >= 4 ? "text-foreground" : ""}>Récap</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border/30">
        {step === 1 && (
          <div className="space-y-5">
            <Section title="Sur quel contrat porte le sinistre ?" sub="Sélectionnez le produit IPPOO concerné." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {products.map((p) => {
                const active = p.id === productId;
                return (
                  <button key={p.id} type="button" onClick={() => setProductId(p.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${active ? "shadow-md" : "border-border/30 bg-white hover:border-border/60"}`}
                    style={active ? { backgroundColor: `${p.color}10`, borderColor: p.color } : {}}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: active ? p.color : undefined }}>{p.shortName}</p>
                  </button>
                );
              })}
            </div>
            <Field icon={Hash} label="Numéro de Carte IPPOO ou de contrat" name="contrat" placeholder="ex. IP-2026-XXXXX" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Section title="Décrivez le sinistre" sub="Plus votre description est précise, plus l'instruction sera rapide." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Calendar} label="Date du sinistre" name="dateSinistre" type="date" required />
              <Field icon={MapPin} label="Lieu" name="lieu" placeholder="Ville, quartier" required />
            </div>
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nature du sinistre *</label>
              <div className="flex flex-wrap gap-2">
                {["Vol", "Accident", "Incendie", "Maladie", "Hospitalisation", "Inondation", "Casse", "Décès", "Autre"].map((n) => (
                  <button key={n} type="button" onClick={() => setNature(n)}
                    className={`px-3 py-1.5 rounded-full border transition-all ${nature === n ? "bg-ippoo-green text-white border-ippoo-green" : "border-border/40 hover:border-foreground bg-white"}`}
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Récit des faits *</label>
              <textarea required rows={5} className="w-full px-4 py-3 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green resize-none" style={{ fontSize: "0.9375rem" }} placeholder="Décrivez chronologiquement les faits, les personnes impliquées, les dommages constatés…" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Section title="Joindre les pièces justificatives" sub="Pièce d'identité, photos des dommages, certificat médical, procès-verbal de police, devis de réparation… Tous formats acceptés (PDF, JPG, PNG)." />
            <button type="button"
              onClick={() => setFiles([...files, `piece_${files.length + 1}.${["jpg", "pdf"][files.length % 2]}`])}
              className="w-full border-2 border-dashed border-border/50 hover:border-ippoo-green rounded-2xl p-8 text-center transition-colors">
              <div className="w-12 h-12 rounded-xl bg-ippoo-green/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-ippoo-green" />
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>Cliquer pour ajouter un fichier</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>ou glissez-déposez ici</p>
            </button>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f7f8fa] border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-ippoo-green" />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{f}</span>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
              Vous pourrez compléter votre dossier ultérieurement depuis votre espace assuré.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Section title="Récapitulatif et envoi" sub="Vérifiez les informations puis validez. Vous recevrez un numéro de référence par SMS." />
            <div className="rounded-2xl bg-[#f7f8fa] p-5 space-y-3">
              <Recap label="Produit" value={products.find((p) => p.id === productId)?.shortName || ""} />
              <Recap label="Nature" value={nature || " "} />
              <Recap label="Pièces jointes" value={files.length ? `${files.length} fichier(s)` : "Aucune"} />
            </div>
            <label className="flex items-start gap-2.5 text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
              <input type="checkbox" required className="mt-0.5" />
              Je certifie sur l'honneur l'exactitude des informations déclarées. Toute fausse déclaration intentionnelle entraîne la nullité de la garantie (art. 18 Code CIMA).
            </label>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
          <button type="button" onClick={() => setStep((Math.max(1, step - 1)) as Step)} disabled={step === 1}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
          {step < 4 ? (
            <button type="button" onClick={() => setStep((step + 1) as Step)}
              className="inline-flex items-center gap-2 bg-ippoo-green text-white px-5 py-3 rounded-xl hover:bg-[#094d38] transition-colors" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={() => setSubmitted(true)}
              className="inline-flex items-center gap-2 bg-[#0d1117] text-white px-5 py-3 rounded-xl" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              <Shield className="w-4 h-4" /> Envoyer ma déclaration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================== SUIVRE ====================== */

function SuivreFlow() {
  const [ref, setRef] = useState("");
  const [dossier, setDossier] = useState<MockDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = mockDossiers[ref.toUpperCase().trim()];
    if (found) { setDossier(found); setError(null); }
    else { setDossier(null); setError("Aucun dossier trouvé avec cette référence. Essayez SIN-2026-001 ou SIN-2026-002 pour la démonstration."); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSearch} className="bg-white rounded-2xl p-6 sm:p-8 border border-border/30">
        <Section title="Suivre mon dossier de sinistre" sub="Saisissez votre numéro de référence reçu par SMS lors de la déclaration." />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ex. SIN-2026-001"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green uppercase" style={{ fontSize: "0.9375rem", fontWeight: 600 }} />
          </div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 bg-ippoo-green text-white px-6 py-3.5 rounded-xl hover:bg-[#094d38] transition-colors" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
            <Search className="w-4 h-4" /> Rechercher
          </button>
        </div>
        {error && (
          <p className="mt-3 flex items-start gap-2 text-[#c0392b]" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </p>
        )}
      </form>

      {dossier && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border/30 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground mb-1" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Dossier</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900 }}>{dossier.reference}</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>{dossier.produit} • Déclaré le {dossier.dateDeclaration}</p>
            </div>
            <StatutBadge statut={dossier.statut} />
          </div>

          {dossier.montantEstime && (
            <div className="px-6 sm:px-8 py-4 bg-ippoo-green/[0.06] border-b border-border/30 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-ippoo-green" />
              <div>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Montant {dossier.statut === "Indemnisé" ? "versé" : "estimé"} : </span>
                <strong style={{ fontSize: "0.9375rem" }}>{dossier.montantEstime}</strong>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <p className="mb-5 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Étapes</p>
            <ol className="space-y-4">
              {dossier.etapes.map((e, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${e.done ? (e.current ? "bg-ippoo-green text-white ring-4 ring-ippoo-green/20" : "bg-ippoo-green text-white") : "bg-ippoo-gray text-muted-foreground"}`}>
                    {e.done ? <CheckCircle2 className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>{e.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{e.date}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 p-4 rounded-xl bg-[#f7f8fa]">
              <p className="mb-1 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Dernier message du gestionnaire</p>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{dossier.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ====================== shared ====================== */

function Section({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>{title}</h2>
      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{sub}</p>
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
        <input type={type} name={name} required={required} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green" style={{ fontSize: "0.9375rem" }} />
      </div>
    </div>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function StatutBadge({ statut }: { statut: MockDossier["statut"] }) {
  const colors: Record<MockDossier["statut"], { bg: string; fg: string; icon: React.ElementType }> = {
    "Reçu": { bg: "#1565C015", fg: "#1565C0", icon: FileText },
    "En instruction": { bg: "#E6510015", fg: "#E65100", icon: Clock },
    "Expertise": { bg: "#7B1FA215", fg: "#7B1FA2", icon: Search },
    "Indemnisé": { bg: "#0B6E4F15", fg: "#0B6E4F", icon: BadgeCheck },
  };
  const c = colors[statut];
  const Ic = c.icon;
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: c.bg, color: c.fg }}>
      <Ic className="w-4 h-4" />
      <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{statut}</span>
    </div>
  );
}

function UrgenceCard({ icon: Icon, label, value, color, sub, link }: { icon: React.ElementType; label: string; value: string; color: string; sub: string; link?: string }) {
  const inner = (
    <div className="rounded-2xl p-5 border border-border/30 hover:shadow-md transition-shadow h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color }}>{label}</p>
      </div>
      <p style={{ fontSize: "1rem", fontWeight: 800 }}>{value}</p>
      <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>{sub}</p>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
