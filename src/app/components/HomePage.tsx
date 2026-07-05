import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield,
  Scale, Calculator, FileText, ArrowRight, ArrowUpRight, Sparkles, Zap,
  Users, Handshake, CheckCircle, Star, Quote, Phone, type LucideIcon,
} from "lucide-react";
import { products } from "../data/products";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AnimatedCounter } from "./AnimatedCounter";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import { PromoCarousel } from "./PromoCarousel";
import { AfricaGallery } from "./AfricaGallery";
import { HomeSimulator } from "./HomeSimulator";
import heroPhoto from "../../imports/photo_15_2026-04-30_21-36-08.jpg";
import heroStackBImg from "../../imports/d64be780de492d243e38d43566bee1d6-1.jpg";
import testimonialAminata from "../../imports/photo_7_2026-05-05_08-48-04.jpg";
import testimonialIbrahim from "../../imports/photo_8_2026-05-08_00-42-28.jpg";
import testimonialMariam from "../../imports/photo_11_2026-04-30_21-36-08.jpg";
import cutoutA from "../../imports/remove.photos-removed-background_-_2026-02-10T183004.693.png";
import cutoutB from "../../imports/remove.photos-removed-background_-_2026-02-10T183112.541.png";
import cutoutC from "../../imports/remove.photos-removed-background_-_2026-02-10T183144.749.png";
import mosaic1 from "../../imports/photo_8_2026-05-08_00-42-28-1.jpg";
import mosaic2 from "../../imports/photo_9_2026-05-08_00-42-28.jpg";
import mosaic3 from "../../imports/photo_14_2026-04-30_21-36-08-1.jpg";
import mosaic4 from "../../imports/photo_15_2026-04-30_21-36-08-1.jpg";
import { heroHomeStackA } from "../lib/images";

const iconMap: Record<string, LucideIcon> = {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield, Scale, Calculator, FileText,
};

const heroImage = heroPhoto;
const heroStackA = heroHomeStackA;
const heroStackB = heroStackBImg;

const mosaic = [mosaic1, mosaic2, mosaic3, mosaic4];

const palette = [
  { bg: "#FF3B57", soft: "#FFDDE2" },
  { bg: "#FF7A00", soft: "#FFE8D1" },
  { bg: "#16B26A", soft: "#DBFBE7" },
  { bg: "#2A6BFF", soft: "#DDE7FF" },
  { bg: "#FF4FAE", soft: "#FFDCEE" },
  { bg: "#8A4BFF", soft: "#ECE0FF" },
  { bg: "#FFC419", soft: "#FFF2BF" },
  { bg: "#FF3B57", soft: "#FFDDE2" },
  { bg: "#16B26A", soft: "#DBFBE7" },
  { bg: "#2A6BFF", soft: "#DDE7FF" },
  { bg: "#FF7A00", soft: "#FFE8D1" },
];

// Stat labels resolved inside component via t.home.*
const statMeta = [
  { value: 2500, suffix: "+", key: "statBeneficiaries" as const, color: "#FF3B57" },
  { value: 11,   suffix: "",  key: "statSolutions"     as const, color: "#16B26A" },
  { value: 10,   suffix: "+", key: "statPartners"      as const, color: "#FF7A00" },
  { value: 98,   suffix: "%", key: "statSatisfaction"  as const, color: "#FF4FAE" },
];

const reasonMeta: { icon: LucideIcon; color: string; soft: string }[] = [
  { icon: Zap,         color: "#FF7A00", soft: "#FFE8D1" },
  { icon: Shield,      color: "#2A6BFF", soft: "#DDE7FF" },
  { icon: CheckCircle, color: "#16B26A", soft: "#DBFBE7" },
  { icon: Users,       color: "#FF4FAE", soft: "#FFDCEE" },
  { icon: Handshake,   color: "#8A4BFF", soft: "#ECE0FF" },
  { icon: Sparkles,    color: "#FF3B57", soft: "#FFDDE2" },
];

const testimonialMeta = [
  { image: testimonialAminata, color: "#FF4FAE" },
  { image: testimonialIbrahim, color: "#FF7A00" },
  { image: testimonialMariam,  color: "#16B26A" },
];

export function HomePage() {
  const { t } = useLang();
  const reasons = reasonMeta.map((m, i) => ({ ...m, ...t.home.reasons[i] }));
  const testimonials = testimonialMeta.map((m, i) => ({ ...m, ...t.home.testimonials[i] }));
  usePageMeta({
    title: "Accueil Micro-assurance pour l'informel en Afrique",
    description:
      "IPPOO ASSURANCE : 11 solutions de micro-assurance et d'assistance pour les commerçants, artisans, transporteurs et entrepreneurs du secteur informel africain.",
  });

  return (
    <div className="overflow-hidden">

      {/* ============== HERO ============== */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 15% 10%, #FFE8D1 0%, transparent 45%), radial-gradient(circle at 85% 15%, #FFDCEE 0%, transparent 50%), radial-gradient(circle at 50% 90%, #DDE7FF 0%, transparent 55%), linear-gradient(180deg, #FFFBF4 0%, #FFFFFF 100%)",
          }}
          aria-hidden
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-12 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Text col */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 order-2 lg:order-1 text-center lg:text-left"
            >
              <span
                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-[0_8px_24px_-8px_rgba(255,79,174,0.4)] border border-[#FFDCEE]"
                style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FF4FAE" }}
              >
                <Sparkles className="w-3.5 h-3.5" /> {t.home.heroBadge}
              </span>

              <h1
                className="mt-5"
                style={{
                  fontSize: "clamp(2.5rem, 9vw, 5.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-0.035em",
                  color: "#0E1320",
                }}
              >
                {t.home.heroTitleA}{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg,#FF3B57 0%,#FF7A00 35%,#FFC419 60%,#16B26A 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t.home.heroTitleAccent}
                </span>
              </h1>

              <p
                className="mt-5 max-w-xl mx-auto lg:mx-0"
                style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)", lineHeight: 1.55, color: "#4B5468", fontWeight: 500 }}
              >
                {t.heroDescription}
              </p>

              <div className="mt-7 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  to="/devis"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white shadow-[0_18px_40px_-12px_rgba(255,59,87,0.6)] hover:scale-[1.04] active:scale-95 transition-transform"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg,#FF3B57 0%,#FF4FAE 60%,#FF7A00 100%)",
                  }}
                >
                  {t.heroCtaPrimary}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/produits"
                  className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl border-2 border-[#0E1320]/10 hover:border-[#0E1320]/30 transition-all"
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                >
                  {t.home.ctaSolutions}
                </Link>
              </div>

              {/* Quick badges */}
              <div className="mt-7 flex flex-wrap gap-2 justify-center lg:justify-start">
                {[
                  { label: t.home.badgeNoPaper, color: "#16B26A" },
                  { label: t.home.badgeMobileMoney, color: "#2A6BFF" },
                  { label: t.home.badge24h, color: "#FF7A00" },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      fontSize: "0.75rem", fontWeight: 700,
                      color: b.color, background: `${b.color}14`, border: `1px solid ${b.color}33`,
                    }}
                  >
                    <CheckCircle className="w-3 h-3" /> {b.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Image stack col (semi-3D) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lg:col-span-5 order-1 lg:order-2"
            >
              <div className="relative mx-auto w-full max-w-[420px] aspect-square">
                {/* Floating blobs */}
                <div className="absolute -top-8 -left-6 w-28 h-28 rounded-full bg-[#FFC419] blur-2xl opacity-70" aria-hidden />
                <div className="absolute -bottom-10 -right-6 w-36 h-36 rounded-full bg-[#FF4FAE] blur-2xl opacity-60" aria-hidden />

                {/* Back card */}
                <motion.div
                  initial={{ y: 10, rotate: -8 }}
                  animate={{ y: [10, 0, 10], rotate: -8 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-6 -left-2 w-[55%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                >
                  <ImageWithFallback src={heroStackA} alt="" className="w-full h-full object-cover" />
                </motion.div>

                {/* Front card */}
                <motion.div
                  initial={{ y: -6, rotate: 5 }}
                  animate={{ y: [-6, 4, -6], rotate: 5 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-0 w-[70%] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] border-4 border-white"
                >
                  <ImageWithFallback src={heroImage} alt="Femme entrepreneur africaine" className="w-full h-full object-cover" />
                </motion.div>

                {/* Side card */}
                <motion.div
                  initial={{ y: 12, rotate: -3 }}
                  animate={{ y: [12, 2, 12], rotate: -3 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-0 left-4 w-[45%] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
                >
                  <ImageWithFallback src={heroStackB} alt="" className="w-full h-full object-cover" />
                </motion.div>

                {/* Floating sticker */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="absolute -bottom-4 right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#16B26A] flex items-center justify-center text-white">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.7rem", color: "#717182", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.home.protectedLabel}</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0E1320" }}>2 500+</p>
                  </div>
                </motion.div>

                {/* Ambassadeurs (cutouts) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -top-2 -left-2 flex -space-x-3"
                >
                  {[cutoutA, cutoutB, cutoutC].map((src, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-[#FFE8D1] to-[#FFDCEE] overflow-hidden flex items-end justify-center"
                    >
                      <ImageWithFallback src={src} alt={`Ambassadeur ${i + 1}`} className="w-full h-full object-cover object-top" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== PROMO CAROUSEL ============== */}
      <PromoCarousel />

      {/* ============== AFRICA GALLERY ============== */}
      <AfricaGallery />

      {/* ============== STATS ============== */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statMeta.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)]"
              style={{
                background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}cc 100%)`,
              }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" aria-hidden />
              <p
                style={{
                  fontSize: "clamp(2.2rem, 8vw, 3.4rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 opacity-90" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t.home[s.key]}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============== PRODUCTS ============== */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span
              className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"
              style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF7A00" }}
            >
              <Sparkles className="w-3.5 h-3.5" /> {t.home.sectionSolutionsBadge}
            </span>
            <h2
              className="mt-4 gradient-title"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              {t.home.sectionSolutionsTitleA} <br className="sm:hidden" />
              {t.home.sectionSolutionsTitleAccent}
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ fontSize: "1rem", color: "#4B5468" }}>
              {t.home.sectionSolutionsLead}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p, i) => {
              const Icon = iconMap[p.icon] ?? Shield;
              const c = palette[i % palette.length];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05 }}
                >
                  <Link
                    to={`/produits/${p.slug}`}
                    className="block h-full bg-white rounded-3xl p-6 border border-black/5 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.18)] hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px]"
                        style={{ background: c.bg, color: "#fff", boxShadow: `0 10px 20px -8px ${c.bg}aa` }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <span
                        className="text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          fontWeight: 800,
                          color: c.bg,
                          background: c.soft,
                        }}
                      >
                        {p.category === "assurance" ? t.home.categoryAssurance : t.home.categoryAssistance}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0E1320", lineHeight: 1.25 }}>
                      {p.name}
                    </h3>
                    <p className="mt-2" style={{ fontSize: "0.85rem", color: "#717182", lineHeight: 1.55 }}>
                      {p.shortDescription.length > 110 ? p.shortDescription.slice(0, 110) + "…" : p.shortDescription}
                    </p>
                    <span
                      className="mt-5 inline-flex items-center gap-1.5 group-hover:gap-3 transition-all"
                      style={{ fontSize: "0.85rem", fontWeight: 800, color: c.bg }}
                    >
                      {t.common.discover}
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== MOSAIC + WHY ============== */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Mosaic */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {mosaic.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative overflow-hidden rounded-3xl shadow-xl border-4 border-white ${
                  i === 0 ? "rotate-[-3deg] aspect-[3/4]" : i === 1 ? "rotate-[2deg] aspect-square mt-6" : i === 2 ? "rotate-[2deg] aspect-square -mt-4" : "rotate-[-2deg] aspect-[3/4]"
                }`}
              >
                <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>

          {/* Text + reasons */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#16B26A",
                background: "#DBFBE7",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> {t.home.whyEyebrow}
            </span>
            <h2
              className="mt-4 gradient-title"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              {t.home.whyTitleA}{" "}
              {t.home.whyTitleAccent}{" "}
              {t.home.whyTitleB}
            </h2>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {reasons.map((r, i) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={r.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-black/5 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.15)]"
                  >
                    <div
                      className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: r.soft, color: r.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0E1320" }}>{r.title}</p>
                      <p className="mt-1" style={{ fontSize: "0.78rem", color: "#717182", lineHeight: 1.5 }}>{r.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============== TESTIMONIALS ============== */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-gradient-to-b from-[#FFFBF4] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#FF4FAE",
                background: "#FFDCEE",
              }}
            >
              <Star className="w-3.5 h-3.5" /> {t.home.testimonialsEyebrow}
            </span>
            <h2
              className="mt-4 gradient-title"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              {t.home.testimonialsTitleA}{" "}
              {t.home.testimonialsTitleAccent}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((tm, i) => (
              <motion.article
                key={tm.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-3xl p-6 border border-black/5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.18)]"
              >
                <div
                  className="absolute -top-4 left-6 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ background: tm.color }}
                  aria-hidden
                >
                  <Quote className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 mt-2 mb-4" aria-label="5 étoiles">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="w-4 h-4 fill-[#FFC419] text-[#FFC419]" />
                  ))}
                </div>
                <p style={{ fontSize: "0.95rem", color: "#0E1320", lineHeight: 1.55, fontWeight: 500 }}>
                  « {tm.quote} »
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: tm.color }}>
                    <ImageWithFallback src={tm.image} alt={tm.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0E1320" }}>{tm.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#717182" }}>{tm.role}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <HomeSimulator />

      {/* ============== FINAL CTA ============== */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] p-8 sm:p-14 text-white"
            style={{
              background:
                "linear-gradient(135deg,#FF3B57 0%,#FF4FAE 35%,#8A4BFF 70%,#2A6BFF 100%)",
            }}
          >
            <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
            <div className="absolute -bottom-16 -left-12 w-80 h-80 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 text-center md:text-left">
                <h2
                  style={{
                    fontSize: "clamp(1.8rem, 5vw, 3rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t.home.finalCtaTitle}
                </h2>
                <p className="mt-3 text-white/90" style={{ fontSize: "1rem", lineHeight: 1.55, fontWeight: 500 }}>
                  {t.home.finalCtaLead}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center md:justify-end">
                <Link
                  to="/devis"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0E1320] px-6 py-4 rounded-2xl shadow-xl hover:scale-[1.03] active:scale-95 transition-transform"
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                >
                  <Calculator className="w-4 h-4" /> {t.home.finalCtaQuote}
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/40 hover:bg-white/25 transition-all"
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                >
                  <Phone className="w-4 h-4" /> {t.home.finalCtaCall}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
