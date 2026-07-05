import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Shield, CheckCircle, CreditCard, MapPin, Phone, Zap, Users, Route,
  ArrowRight, Sparkles, Star, Gift,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";

import heroImg from "../../imports/Gemini_Generated_Image_dl15ofdl15ofdl15.png";

const advantageMeta = [
  { icon: Zap, color: "#FF3B57", soft: "#FFDDE2" },
  { icon: Route, color: "#2A6BFF", soft: "#DDE7FF" },
  { icon: CheckCircle, color: "#FF7A00", soft: "#FFE8D1" },
  { icon: Users, color: "#16B26A", soft: "#DBFBE7" },
];

const perkMeta = [
  { icon: Sparkles, color: "#FF4FAE" },
  { icon: Gift, color: "#8A4BFF" },
  { icon: Star, color: "#FFC419" },
];

export function CarteIppooPage() {
  const { t } = useLang();
  usePageMeta({
    title: "La Carte IPPOO Votre clé d'accès à tous nos services",
    description: "Une carte unique pour gérer vos contrats, déclarer un sinistre et accéder à votre espace assuré IPPOO.",
  });

  const perks = [
    { ...perkMeta[0], label: t.carte.perkPriority },
    { ...perkMeta[1], label: t.carte.perkPartners },
    { ...perkMeta[2], label: t.carte.perkCertified },
  ];
  const advantages = [
    { ...advantageMeta[0], title: t.carte.adv1Title, desc: t.carte.adv1Desc },
    { ...advantageMeta[1], title: t.carte.adv2Title, desc: t.carte.adv2Desc },
    { ...advantageMeta[2], title: t.carte.adv3Title, desc: t.carte.adv3Desc },
    { ...advantageMeta[3], title: t.carte.adv4Title, desc: t.carte.adv4Desc },
  ];

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#FF4FAE]/30 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#16B26A]/30 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1
              className="gradient-title"
              style={{
                fontSize: "clamp(2.25rem, 8vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              {t.carte.titleA}
              <br />
              {t.carte.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.carte.lead}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {perks.map((p) => (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border-2"
                  style={{ borderColor: `${p.color}40`, fontSize: "0.8125rem", fontWeight: 700 }}
                >
                  <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                  {p.label}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white shadow-[0_18px_40px_-12px_rgba(138,75,255,0.55)] hover:scale-[1.02] active:scale-95 transition-transform"
                style={{ background: "linear-gradient(90deg,#8A4BFF,#FF4FAE)", fontSize: "0.95rem", fontWeight: 800 }}
              >
                {t.carte.ctaGetCard} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/points-partenaires"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#0E1320]/15 hover:border-[#0E1320]/40 transition-colors"
                style={{ fontSize: "0.95rem", fontWeight: 700 }}
              >
                <MapPin className="w-4 h-4 text-[#16B26A]" />
                {t.carte.ctaFindPoint}
              </Link>
            </div>
          </motion.div>

          {/* 3D Card mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative w-full max-w-md mx-auto aspect-[4/3]"
          >
            <div className="absolute inset-0 rounded-[28px] rotate-[-6deg] bg-[#FFC419]/70" aria-hidden />
            <div className="absolute inset-0 rounded-[28px] rotate-[4deg] overflow-hidden shadow-2xl">
              <ImageWithFallback src={heroImg} alt="Carte premium" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#8A4BFF 0%,#FF4FAE 50%,#FF3B57 100%)", opacity: 0.92 }} />
              <div className="relative h-full p-7 sm:p-9 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p style={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>IPPOO</p>
                      <p className="text-white/70" style={{ fontSize: "0.55rem", letterSpacing: "0.18em" }}>ASSURANCE</p>
                    </div>
                  </div>
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-[#FFC419] to-[#FF7A00] shadow-lg" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/70 mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.18em" }}>{t.carte.cardHolder}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.03em" }}>{t.carte.cardName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 mb-1" style={{ fontSize: "0.55rem", letterSpacing: "0.18em" }}>{t.carte.cardValid}</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700 }}>12/28</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#16B26A] to-[#2A6BFF] shadow-xl flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMO CAROUSEL */}
      <PromoCarousel />

      {/* AVANTAGES */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {t.carte.advantagesTitleA}
              <br />
              <span className="bg-gradient-to-r from-[#FF3B57] via-[#FF7A00] to-[#FFC419] bg-clip-text text-transparent">
                {t.carte.advantagesTitleAccent}
              </span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.65 }}>
              {t.carte.advantagesLead}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {advantages.map((adv, idx) => (
              <motion.div
                key={adv.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: idx * 0.08, duration: 0.45 }}
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${adv.color}25`, boxShadow: `0 18px 40px -22px ${adv.color}55` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: adv.soft }}>
                    <adv.icon className="w-7 h-7" style={{ color: adv.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.0625rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{adv.title}</h3>
                    <p className="mt-2 text-[#3a3a3a]" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>{adv.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#8A4BFF 0%,#FF4FAE 50%,#FF3B57 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#FFC419]/30 blur-3xl" aria-hidden />
          <CreditCard className="relative w-10 h-10 mx-auto mb-4 text-white/90" />
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {t.carte.finalCtaTitle}
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            {t.carte.finalCtaLead}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
              style={{ fontSize: "0.95rem", fontWeight: 800 }}
            >
              <Phone className="w-4 h-4 text-[#FF3B57]" /> {t.carte.finalCtaContact}
            </Link>
            <Link
              to="/points-partenaires"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-2xl hover:bg-white/25 transition-colors"
              style={{ fontSize: "0.95rem", fontWeight: 700 }}
            >
              <MapPin className="w-4 h-4" /> {t.carte.finalCtaPartners}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
