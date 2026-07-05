import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield,
  Scale, Calculator, FileText, ArrowRight, ArrowUpRight, Phone, Sparkles, type LucideIcon,
} from "lucide-react";
import { products } from "../data/products";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";
import heroImg from "../../imports/Our_Struggles_as_New_Immigrants_in_Canada____A_Short_Film_based_on_True_Life_Events.jpg";

const iconMap: Record<string, LucideIcon> = {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield, Scale, Calculator, FileText,
};

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

function ProductCard({ product, color, soft, delay = 0 }: { product: typeof products[0]; color: string; soft: string; delay?: number }) {
  const Icon = iconMap[product.icon] || Shield;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay }}
    >
      <Link
        to={`/produits/${product.slug}`}
        className="group block bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]"
        style={{ borderColor: `${color}25`, boxShadow: `0 18px 40px -22px ${color}55` }}
      >
        <div className="relative h-44 sm:h-52 overflow-hidden">
          <ImageWithFallback src={product.image} alt={product.shortName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${color}cc 100%)` }} />
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-white" style={{ background: color, fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.08em" }}>
            {product.category === "assurance" ? "ASSURANCE" : "ASSISTANCE"}
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "#fff" }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <h3 className="text-white drop-shadow-md" style={{ fontSize: "1.0625rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
              {product.shortName}
            </h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[#3a3a3a]" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
            {product.shortDescription}
          </p>
          <div
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 group-hover:gap-3"
            style={{ background: soft, color, fontSize: "0.8125rem", fontWeight: 800 }}
          >
            Découvrir
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductsPage() {
  const { t } = useLang();
  usePageMeta({
    title: "Nos produits Micro-assurance et assistance",
    description: "11 solutions IPPOO ASSURANCE adaptées aux actifs de l'informel.",
  });

  const assurance = products.filter((p) => p.category === "assurance");
  const assistance = products.filter((p) => p.category === "assistance");

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#FF4FAE]/30 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#16B26A]/30 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="gradient-title" style={{ fontSize: "clamp(2.25rem, 8vw, 4.5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
              {t.products.titleA}<br />
              {t.products.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.products.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/devis" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white shadow-[0_18px_40px_-12px_rgba(255,59,87,0.55)] hover:scale-[1.02] active:scale-95 transition-transform" style={{ background: "linear-gradient(90deg,#FF3B57,#FF7A00)", fontSize: "0.95rem", fontWeight: 800 }}>
                {t.nav.getQuote} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#0E1320]/15 hover:border-[#0E1320]/40 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                <Phone className="w-4 h-4 text-[#16B26A]" />
                {t.faq.talkAdvisor}
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative aspect-[5/4] max-w-md mx-auto w-full">
            <div className="absolute inset-0 rounded-[36px] rotate-[-5deg] bg-[#FFC419]/70" aria-hidden />
            <div className="absolute inset-0 rounded-[36px] rotate-[3deg] bg-white shadow-2xl overflow-hidden">
              <ImageWithFallback src={heroImg} alt="Commerçante africaine" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl bg-white shadow-xl flex items-center gap-2.5" style={{ borderTop: "4px solid #16B26A" }}>
              <div className="w-10 h-10 rounded-xl bg-[#DBFBE7] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#16B26A]" />
              </div>
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#16B26A", letterSpacing: "0.08em" }}>PRISE EN CHARGE</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>en 48 h</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#FF4FAE] to-[#FF3B57] shadow-xl flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMO CAROUSEL */}
      <PromoCarousel />

      {/* MICRO-ASSURANCE GRID */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white" style={{ background: "#FF3B57", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                MICRO-ASSURANCE
              </span>
              <h2 className="mt-3" style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
                Protégez ce qui compte vraiment
              </h2>
            </div>
            <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-[#FFDDE2] text-[#FF3B57]" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
              {assurance.length} produits
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assurance.map((p, i) => {
              const c = palette[i % palette.length];
              return <ProductCard key={p.id} product={p} color={c.bg} soft={c.soft} delay={i * 0.05} />;
            })}
          </div>
        </div>
      </section>

      {/* ASSISTANCE GRID */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white" style={{ background: "#2A6BFF", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                ASSISTANCE
              </span>
              <h2 className="mt-3" style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>
                Un accompagnement, à chaque étape
              </h2>
            </div>
            <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-[#DDE7FF] text-[#2A6BFF]" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
              {assistance.length} produits
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assistance.map((p, i) => {
              const c = palette[(i + 7) % palette.length];
              return <ProductCard key={p.id} product={p} color={c.bg} soft={c.soft} delay={i * 0.05} />;
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#FF3B57 0%,#FF4FAE 50%,#8A4BFF 100%)" }}>
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#FFC419]/30 blur-3xl" aria-hidden />
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Besoin d'aide pour choisir ?
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            Nos conseillers vous orientent en quelques minutes vers la formule la plus adaptée à votre métier et à votre rythme de revenus.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
              <Phone className="w-4 h-4 text-[#FF3B57]" /> Contacter IPPOO
            </Link>
            <Link to="/comment-ca-marche" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-2xl hover:bg-white/25 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              Comment ça marche <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
