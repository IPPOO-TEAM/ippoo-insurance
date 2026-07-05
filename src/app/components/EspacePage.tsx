import { useEffect, useState } from "react";
import { Link } from "react-router";
import { usePageMeta } from "../lib/usePageMeta";
import { motion } from "motion/react";
import {
  User, Phone, Lock, LogOut, Shield, CreditCard, FileText, Download, AlertCircle,
  CheckCircle2, Calendar, Users, Bell, ArrowRight, Hash, Wallet, ChevronRight, Settings
} from "lucide-react";

interface Police {
  id: string;
  produit: string;
  formule: string;
  numero: string;
  statut: "Active" | "En attente paiement" | "Suspendue";
  prochainPrelevement: string;
  cotisation: string;
  beneficiaires: number;
  echeance: string;
  color: string;
  colorLight: string;
}

interface Sinistre {
  ref: string;
  produit: string;
  date: string;
  statut: "En instruction" | "Expertise" | "Indemnisé";
}

const mockUser = {
  prenom: "Aminata",
  nom: "Koné",
  tel: "+229 07 12 34 56 78",
  carteIppoo: "IP-2026-04812",
  ville: "Dantokpa, Cotonou",
};

const mockPolices: Police[] = [
  { id: "1", produit: "Santé", formule: "Famille", numero: "POL-2026-S0481", statut: "Active", prochainPrelevement: "1er juin 2026", cotisation: "3 500 FCFA / mois", beneficiaires: 4, echeance: "12 mars 2027", color: "#c0392b", colorLight: "#fde6e3" },
  { id: "2", produit: "Marchandises", formule: "Boutique", numero: "POL-2026-M0482", statut: "Active", prochainPrelevement: "1er juin 2026", cotisation: "2 800 FCFA / mois", beneficiaires: 1, echeance: "12 mars 2027", color: "#E65100", colorLight: "#fde9d7" },
  { id: "3", produit: "Retraite", formule: "Régulier", numero: "POL-2026-R0483", statut: "En attente paiement", prochainPrelevement: "Échue depuis 3 jours", cotisation: "5 000 FCFA / mois", beneficiaires: 1, echeance: "12 mars 2027", color: "#1565C0", colorLight: "#dceaf7" },
];

const mockSinistres: Sinistre[] = [
  { ref: "SIN-2026-001", produit: "Marchandises", date: "18 mai 2026", statut: "Expertise" },
  { ref: "SIN-2026-002", produit: "Santé", date: "20 mai 2026", statut: "Indemnisé" },
];

export function EspacePage() {
  usePageMeta({
    title: "Espace assuré Mes polices, sinistres et paiements",
    description: "Connectez-vous à votre espace IPPOO pour consulter vos polices actives, télécharger vos attestations, régler vos cotisations et suivre vos sinistres.",
  });
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("ippoo_authed") === "1") setAuthed(true);
  }, []);

  const onLogin = () => {
    if (typeof window !== "undefined") localStorage.setItem("ippoo_authed", "1");
    setAuthed(true);
  };
  const onLogout = () => {
    if (typeof window !== "undefined") localStorage.removeItem("ippoo_authed");
    setAuthed(false);
  };

  return authed ? <Dashboard onLogout={onLogout} /> : <LoginScreen onLogin={onLogin} />;
}

/* ====================== LOGIN ====================== */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tel, setTel] = useState("");

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f7f8fa] py-12 px-4">
      <div className="max-w-md w-full">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ippoo-green to-[#094d38] flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p style={{ fontSize: "1.0625rem", fontWeight: 800, lineHeight: 1.1 }}>IPPOO</p>
            <p className="text-ippoo-green" style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Espace assuré</p>
          </div>
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-7 sm:p-8 border border-border/30 shadow-sm">
          <h1 className="mb-2" style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
            {step === 1 ? "Se connecter" : "Vérification"}
          </h1>
          <p className="text-muted-foreground mb-6" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            {step === 1 ? "Identifiez-vous avec votre numéro de téléphone." : `Saisissez le code à 6 chiffres envoyé par SMS au ${tel || "+229 …"}.`}
          </p>

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Téléphone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input value={tel} onChange={(e) => setTel(e.target.value)} type="tel" required placeholder="+229 07 00 00 00 00"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green" style={{ fontSize: "0.9375rem" }} />
                </div>
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-ippoo-green text-white px-5 py-3.5 rounded-xl hover:bg-[#094d38] transition-colors" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                Recevoir mon code <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Code SMS</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" inputMode="numeric" maxLength={6} pattern="\d{6}" required placeholder="6 chiffres"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border/40 bg-white focus:outline-none focus:border-ippoo-green tracking-widest" style={{ fontSize: "1rem", fontWeight: 700 }} />
                </div>
                <p className="text-muted-foreground mt-2" style={{ fontSize: "0.6875rem" }}>Démonstration : saisissez n'importe quel code à 6 chiffres.</p>
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#0d1117] text-white px-5 py-3.5 rounded-xl" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                Se connecter
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-muted-foreground hover:text-foreground" style={{ fontSize: "0.75rem" }}>
                Changer de numéro
              </button>
            </form>
          )}
        </motion.div>

        <p className="text-center text-muted-foreground mt-5" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
          Première connexion ? <Link to="/devis" className="text-[#0B6E4F]" style={{ fontWeight: 600 }}>Souscrire un contrat</Link><br />
          Besoin d'aide ? <Link to="/contact" className="text-[#0B6E4F]" style={{ fontWeight: 600 }}>Contactez-nous</Link>
        </p>
      </div>
    </div>
  );
}

/* ====================== DASHBOARD ====================== */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const policesActives = mockPolices.filter((p) => p.statut === "Active").length;
  const alertes = mockPolices.filter((p) => p.statut !== "Active").length;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Top bar */}
      <div className="bg-[#0d1117] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/55" style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Bonjour</p>
              <p style={{ fontSize: "1rem", fontWeight: 800 }}>{mockUser.prenom} {mockUser.nom}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/sinistre" className="hidden sm:inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <AlertCircle className="w-4 h-4" /> Déclarer un sinistre
            </Link>
            <button onClick={onLogout} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Hash} label="Carte IPPOO" value={mockUser.carteIppoo} color="#0B6E4F" />
          <StatCard icon={Shield} label="Polices actives" value={String(policesActives)} color="#1565C0" />
          <StatCard icon={Bell} label="Alertes" value={String(alertes)} color="#E65100" highlight={alertes > 0} />
          <StatCard icon={FileText} label="Sinistres en cours" value={String(mockSinistres.filter(s => s.statut !== "Indemnisé").length)} color="#7B1FA2" />
        </div>

        {/* Polices */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Mes polices</h2>
            <Link to="/devis" className="text-[#0B6E4F] inline-flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              Ajouter une police <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mockPolices.map((p) => <PoliceCard key={p.id} police={p} />)}
          </div>
        </section>

        {/* Sinistres + Profil */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-border/30">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Mes sinistres récents</h2>
              <Link to="/sinistre" className="text-[#0B6E4F] inline-flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Tout voir <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-border/30">
              {mockSinistres.map((s) => (
                <li key={s.ref} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>{s.ref}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{s.produit} • {s.date}</p>
                  </div>
                  <SinistreBadge statut={s.statut} />
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-7 border border-border/30">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Profil</h2>
              <Link to="/espace-client/profil" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                <Settings className="w-3.5 h-3.5" /> Modifier
              </Link>
            </div>
            <ul className="space-y-3 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              <ProfilRow icon={User} label="Nom" value={`${mockUser.prenom} ${mockUser.nom}`} />
              <ProfilRow icon={Phone} label="Téléphone" value={mockUser.tel} />
              <ProfilRow icon={Hash} label="Carte IPPOO" value={mockUser.carteIppoo} />
              <ProfilRow icon={Wallet} label="Ville" value={mockUser.ville} />
            </ul>
            <Link to="/espace-client/carte" className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-[#f7f8fa] hover:bg-ippoo-gray text-foreground px-4 py-2.5 rounded-xl transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <Download className="w-3.5 h-3.5" /> Télécharger ma Carte IPPOO
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, highlight }: { icon: React.ElementType; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border ${highlight ? "border-[#E65100]/30 shadow-md" : "border-border/30"}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      </div>
      <p style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</p>
    </div>
  );
}

function PoliceCard({ police }: { police: Police }) {
  const isActive = police.statut === "Active";
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border/30 hover:shadow-md transition-shadow">
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: police.colorLight }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: police.color }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: police.color }}>{police.produit}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full ${isActive ? "bg-ippoo-green/15 text-ippoo-green" : "bg-[#E65100]/15 text-[#E65100]"}`} style={{ fontSize: "0.6875rem", fontWeight: 700 }}>
          {police.statut}
        </span>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 800 }}>Formule {police.formule}</p>
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{police.numero}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
          <div>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.625rem" }}>Cotisation</p>
            <p className="text-foreground mt-0.5" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{police.cotisation}</p>
          </div>
          <div>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.625rem" }}>Bénéficiaires</p>
            <p className="text-foreground mt-0.5 inline-flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
              <Users className="w-3 h-3" /> {police.beneficiaires}
            </p>
          </div>
          <div>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.625rem" }}>Prochain prélèvement</p>
            <p className={`mt-0.5 ${isActive ? "text-foreground" : "text-[#E65100]"}`} style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{police.prochainPrelevement}</p>
          </div>
          <div>
            <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.625rem" }}>Échéance</p>
            <p className="text-foreground mt-0.5 inline-flex items-center gap-1" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
              <Calendar className="w-3 h-3" /> {police.echeance}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t border-border/30">
          {!isActive ? (
            <Link to="/espace-client/cotisations" className="flex-1 inline-flex items-center justify-center gap-2 bg-[#E65100] text-white px-3 py-2.5 rounded-xl hover:bg-[#bf4400] transition-colors" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              <CreditCard className="w-3.5 h-3.5" /> Régler maintenant
            </Link>
          ) : (
            <Link to="/espace-client/documents" className="flex-1 inline-flex items-center justify-center gap-2 bg-[#f7f8fa] hover:bg-ippoo-gray px-3 py-2.5 rounded-xl transition-colors" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              <Download className="w-3.5 h-3.5" /> Attestation
            </Link>
          )}
          <Link to="/espace-client/contrats" aria-label={`Voir les détails de la police ${police.numero}`} className="inline-flex items-center justify-center w-10 h-10 bg-[#f7f8fa] hover:bg-ippoo-gray rounded-xl transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfilRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#f7f8fa] flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p className="text-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{value}</p>
      </div>
    </li>
  );
}

function SinistreBadge({ statut }: { statut: Sinistre["statut"] }) {
  const map: Record<Sinistre["statut"], { bg: string; fg: string; icon: React.ElementType }> = {
    "En instruction": { bg: "#E6510015", fg: "#E65100", icon: AlertCircle },
    "Expertise": { bg: "#7B1FA215", fg: "#7B1FA2", icon: FileText },
    "Indemnisé": { bg: "#0B6E4F15", fg: "#0B6E4F", icon: CheckCircle2 },
  };
  const c = map[statut];
  const Ic = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: c.bg, color: c.fg, fontSize: "0.6875rem", fontWeight: 700 }}>
      <Ic className="w-3 h-3" /> {statut}
    </span>
  );
}
