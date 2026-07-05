import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Shield, Heart, Sparkles, Target, Compass, Handshake, MapPin, ArrowRight, Briefcase,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import { heroAboutTeam as heroImg } from "../lib/images";
import missionImg from "../../imports/t_l_chargement_-_2026-02-17T085009.981.jpg";

const valeurs = [
  { icon: Heart, title: "Proximité", desc: "Nous allons à la rencontre des actifs de l'informel, là où ils travaillent : marchés, ateliers, points partenaires, mobile money.", color: "#c0392b" },
  { icon: Sparkles, title: "Simplicité", desc: "Nos contrats sont lisibles, nos prix transparents, nos parcours digitaux pensés pour un smartphone simple.", color: "#E65100" },
  { icon: Handshake, title: "Solidarité", desc: "La mutualisation des risques au service des plus vulnérables : c'est l'essence même de la micro-assurance.", color: "#0B6E4F" },
  { icon: Shield, title: "Confiance", desc: "Agréés par les autorités CIMA, nous appliquons les standards les plus exigeants en matière de gouvernance.", color: "#1565C0" },
];

const partenaires = [
  { nom: "FECECAM", type: "Microfinance" },
  { nom: "CLCAM", type: "Microfinance" },
  { nom: "NSIA", type: "Assurance & Banque" },
  { nom: "ECOBANK", type: "Banque" },
  { nom: "MOOV", type: "Mobile money" },
  { nom: "MTN", type: "Mobile money" },
];

export function AProposPage() {
  const { t } = useLang();
  usePageMeta({
    title: "À propos Notre mission, nos valeurs",
    description: "Découvrez IPPOO ASSURANCE : notre mission, notre vision et nos valeurs au service de la micro-assurance pour les actifs de l'informel en Afrique.",
    image: heroImg,
  });
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[60vh] flex items-center bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback src={heroImg} alt="Équipe IPPOO ASSURANCE en réunion" className="w-full h-full object-cover opacity-30" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117] via-[#0d1117]/85 to-[#0d1117]/40" />
        </div>
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-ippoo-green/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-[5%] w-64 h-64 bg-[#E65100]/10 rounded-full blur-[80px]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <h1 className="mb-5" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              IPPOO ASSURANCE,<br />{t.about.titleA} {t.about.titleAccent}
            </h1>
            <p className="text-white/65 max-w-2xl" style={{ fontSize: "1.0625rem", lineHeight: 1.85 }}>
              {t.about.lead}
            </p>
          </motion.div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="py-16 sm:py-24 bg-[#f7f8fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="rounded-3xl overflow-hidden aspect-[5/4] shadow-xl">
              <ImageWithFallback src={missionImg} alt="Groupe de bénéficiaires IPPOO" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="space-y-4">
              <Block icon={Target} label="Mission" title="Une assurance digne et accessible pour celles et ceux que l'on n'assure jamais"
                body="Notre mission est claire : démocratiser l'assurance là où elle n'est jamais arrivée. Pour 85 % des actifs de l'informel en Afrique commerçants de marché, artisans, transporteurs, mamans entrepreneures, agriculteurs un imprévu peut effacer des années d'efforts. IPPOO construit des protections simples, lisibles et abordables, payables en mobile money et activables en un SMS. Une couverture pensée comme un filet collectif, jamais comme une promesse hors de portée." />
              <Block icon={Compass} label="Vision" title="La mutuelle de référence des Africains qui travaillent"
                body="Notre vision est panafricaine et résolument ancrée dans les réalités du continent. Nous voulons devenir la première micro-assurance mutualiste d'Afrique, avec des points partenaires de proximité, d'un pays à l'autre. Une mutuelle moderne, fidèle à la tradition africaine d'entraide, armée d'outils digitaux et d'une exigence réglementaire stricte pour tenir, partout en Afrique, chacun de ses engagements." />
            </div>
          </motion.div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>Nos valeurs au quotidien</h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.8 }}>
              Quatre principes simples guident toutes nos décisions, de la conception d'un produit à l'indemnisation d'un sinistre.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {valeurs.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-[#f7f8fa] border border-border/30 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${v.color}15` }}>
                  <v.icon className="w-6 h-6" style={{ color: v.color }} />
                </div>
                <h3 className="mb-2" style={{ fontSize: "1.0625rem", fontWeight: 800 }}>{v.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTENAIRES */}
      <section className="py-16 sm:py-24 bg-[#f7f8fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>Nos partenaires</h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.9375rem", lineHeight: 1.8 }}>
              Microfinance, banques et opérateurs mobile money : nos partenaires nous permettent d'accompagner les actifs de l'informel au plus près du terrain.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partenaires.map((p) => {
              const domains: Record<string, string> = {
                FECECAM: "fececam-benin.com",
                CLCAM: "fececam-benin.com",
                NSIA: "groupensia.com",
                ECOBANK: "ecobank.com",
                MOOV: "moov-africa.bj",
                MTN: "mtn.com",
              };
              const logoUrl = `https://logo.clearbit.com/${domains[p.nom]}`;
              return (
                <div key={p.nom} className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-5 border border-border/30 aspect-[4/3] hover:shadow-md transition-shadow">
                  <img src={logoUrl} alt={`${p.nom} logo`} className="max-h-12 max-w-[80%] object-contain" loading="lazy" />
                  <p className="text-muted-foreground text-center" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>{p.type}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-24 bg-[#0d1117] text-white overflow-hidden">
        <div className="absolute top-10 right-[20%] w-56 h-56 bg-ippoo-green/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-[15%] w-40 h-40 bg-[#E65100]/10 rounded-full blur-[60px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-ippoo-green/15 flex items-center justify-center mx-auto mb-5">
            <Briefcase className="w-7 h-7 text-ippoo-green" />
          </div>
          <h2 className="mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Rejoignez l'aventure IPPOO
          </h2>
          <p className="text-white/55 mb-8 max-w-lg mx-auto" style={{ fontSize: "0.9375rem", lineHeight: 1.85 }}>
            En tant qu'assuré, en tant que partenaire ou en tant que collaborateur : il y a forcément une place pour vous.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/devis" className="inline-flex items-center gap-2 bg-white text-[#0d1117] px-6 py-3.5 rounded-xl" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
              Souscrire un contrat <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white px-6 py-3.5 rounded-xl hover:bg-white/15" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              <MapPin className="w-4 h-4 text-[#E65100]" /> Devenir partenaire
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Block({ icon: Icon, label, title, body }: { icon: React.ElementType; label: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-ippoo-green/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-ippoo-green" />
      </div>
      <div>
        <p className="text-ippoo-green mb-1" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
        <h3 className="mb-1.5" style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h3>
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.75 }}>{body}</p>
      </div>
    </div>
  );
}
