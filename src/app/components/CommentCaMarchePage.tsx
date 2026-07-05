import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Search, UserCheck, HeartHandshake, ArrowRight, Phone, Sparkles, CheckCircle,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import heroImg from "../../imports/d64be780de492d243e38d43566bee1d6.jpg";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Souscrire simplement",
    description:
      "Premier contact par téléphone, sur le site ou en point de service partenaire. Vous présentez votre activité et vos priorités, nous identifions ensemble la protection la plus utile. Aucune connaissance technique requise, aucun jargon.",
    color: "#FF3B57",
    soft: "#FFDDE2",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Être orienté",
    description:
      "Un conseiller analyse votre situation : métier, risques principaux, taille du stock ou du foyer. Il vous oriente vers la formule adaptée et explique ce qui est couvert, comment activer la prise en charge et à quel rythme régler vos cotisations.",
    color: "#2A6BFF",
    soft: "#DDE7FF",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Être pris en charge",
    description:
      "Lorsqu'un incident survient maladie, vol, panne, sinistre vous nous joignez en quelques étapes. Notre équipe déclenche la prise en charge sans procédures lourdes pour soigner, remplacer ou réparer au plus vite.",
    color: "#16B26A",
    soft: "#DBFBE7",
  },
];

const guarantees = [
  "Sans jargon, sans paperasse inutile",
  "Conseillers locaux qui parlent votre langue",
  "Prise en charge déclenchée en 48 h",
  "Cotisations adaptées au rythme du métier",
];

export function CommentCaMarchePage() {
  const { t } = useLang();
  usePageMeta({
    title: "Comment ça marche Souscrire, cotiser, être indemnisé",
    description: "De la souscription à l'indemnisation, IPPOO ASSURANCE simplifie la micro-assurance en 3 étapes.",
  });

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#2A6BFF]/30 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#16B26A]/30 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1
              className="gradient-title"
              style={{ fontSize: "clamp(2.25rem, 8vw, 4.5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}
            >
              {t.comment.titleA}
              <br />
              {t.comment.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.comment.lead}
            </p>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guarantees.map((g) => (
                <li key={g} className="inline-flex items-center gap-2 text-[#0E1320]" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  <CheckCircle className="w-4 h-4 text-[#16B26A] shrink-0" />
                  {g}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/devis"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white shadow-[0_18px_40px_-12px_rgba(42,107,255,0.55)] hover:scale-[1.02] active:scale-95 transition-transform"
                style={{ background: "linear-gradient(90deg,#2A6BFF,#16B26A)", fontSize: "0.95rem", fontWeight: 800 }}
              >
                Commencer maintenant <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#0E1320]/15 hover:border-[#0E1320]/40 transition-colors"
                style={{ fontSize: "0.95rem", fontWeight: 700 }}
              >
                <Phone className="w-4 h-4 text-[#FF3B57]" />
                Être appelé
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-[5/4] max-w-md mx-auto w-full"
          >
            <div className="absolute inset-0 rounded-[36px] rotate-[-5deg] bg-[#16B26A]/70" aria-hidden />
            <div className="absolute inset-0 rounded-[36px] rotate-[3deg] bg-white shadow-2xl overflow-hidden">
              <ImageWithFallback src={heroImg} alt="Partenariat" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl bg-white shadow-xl flex items-center gap-2.5" style={{ borderTop: "4px solid #FF3B57" }}>
              <div className="w-10 h-10 rounded-xl bg-[#FFDDE2] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-[#FF3B57]" />
              </div>
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#FF3B57", letterSpacing: "0.08em" }}>SOUSCRIPTION</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>en 5 min</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#FFC419] to-[#FF7A00] shadow-xl flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMO */}
      <PromoCarousel />

      {/* STEPS */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Trois étapes,
              <br />
              <span className="bg-gradient-to-r from-[#FF3B57] via-[#2A6BFF] to-[#16B26A] bg-clip-text text-transparent">
                zéro complication
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: idx * 0.08, duration: 0.45 }}
                className="relative bg-white rounded-3xl p-7 border-2 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${step.color}25`, boxShadow: `0 18px 40px -22px ${step.color}55` }}
              >
                <div
                  className="absolute -top-5 -left-2 w-14 h-14 rounded-2xl rotate-[-8deg] flex items-center justify-center text-white shadow-lg"
                  style={{ background: step.color, fontSize: "1.1rem", fontWeight: 900 }}
                >
                  {step.number}
                </div>
                <div className="mt-6 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: step.soft }}>
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <h3 className="mt-4" style={{ fontSize: "1.125rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p className="mt-3 text-[#3a3a3a]" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#2A6BFF 0%,#16B26A 50%,#FFC419 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#FF4FAE]/30 blur-3xl" aria-hidden />
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Prêt à démarrer ?
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            Découvrez en quelques minutes la formule qui correspond à votre métier et activez votre protection dès aujourd'hui.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/produits" className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
              Découvrir nos solutions <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-2xl hover:bg-white/25 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              <Phone className="w-4 h-4" /> Contacter IPPOO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
