import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield,
  Scale, Calculator, FileText, ArrowRight, ArrowLeft, CheckCircle, Phone, MapPin,
  XCircle, Clock, Star, Quote, Sparkles, Zap, Users, type LucideIcon,
} from "lucide-react";
import { products } from "../data/products";
import { usePricing } from "../data/pricing";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { usePageMeta } from "../lib/usePageMeta";

const iconMap: Record<string, LucideIcon> = {
  Heart, Package, Wrench, Truck, Baby, GraduationCap, Landmark, Shield, Scale, Calculator, FileText,
};

const slogans: Record<string, string> = {
  sante: "Votre santé, notre priorité numéro un.",
  marchandises: "Protégez votre stock, protégez vos revenus.",
  equipement: "Vos outils sont votre force de travail.",
  transport: "Restez en mouvement, en toute sérénité.",
  maternite: "Accueillez la vie avec confiance.",
  education: "L'avenir de vos enfants commence aujourd'hui.",
  retraite: "Préparez demain, sereinement.",
  sociale: "Solidarité et protection au quotidien.",
  juridique: "Vos droits, défendus simplement.",
  comptable: "Gérez mieux, avancez plus loin.",
  administrative: "L'administration ne doit plus vous freiner.",
};

const productPalette: Record<string, { primary: string; soft: string; alt: string }> = {
  sante: { primary: "#FF3B57", soft: "#FFDDE2", alt: "#FF4FAE" },
  marchandises: { primary: "#FF7A00", soft: "#FFE8D1", alt: "#FFC419" },
  equipement: { primary: "#2A6BFF", soft: "#DDE7FF", alt: "#8A4BFF" },
  transport: { primary: "#16B26A", soft: "#DBFBE7", alt: "#2A6BFF" },
  maternite: { primary: "#FF4FAE", soft: "#FFDCEE", alt: "#FF3B57" },
  education: { primary: "#FFC419", soft: "#FFF2BF", alt: "#FF7A00" },
  retraite: { primary: "#8A4BFF", soft: "#ECE0FF", alt: "#2A6BFF" },
  sociale: { primary: "#16B26A", soft: "#DBFBE7", alt: "#FFC419" },
  juridique: { primary: "#2A6BFF", soft: "#DDE7FF", alt: "#FF3B57" },
  comptable: { primary: "#FF7A00", soft: "#FFE8D1", alt: "#16B26A" },
  administrative: { primary: "#16B26A", soft: "#DBFBE7", alt: "#FF4FAE" },
};

export function ProductDetailPage() {
  const { slug } = useParams();
  const product = products.find((p) => p.slug === slug);
  const { details: allDetails } = usePricing();

  usePageMeta({
    title: product
      ? `${product.name} ${product.category === "assurance" ? "Micro-assurance" : "Assistance"}`
      : "Produit introuvable",
    description: product?.shortDescription,
    image: product?.image,
  });

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-[#FFF8F2]">
        <div className="w-20 h-20 rounded-3xl bg-[#FFDDE2] flex items-center justify-center mb-5">
          <Shield className="w-10 h-10 text-[#FF3B57]" />
        </div>
        <h1 className="mb-3" style={{ fontSize: "1.75rem", fontWeight: 900 }}>Produit introuvable</h1>
        <p className="text-[#3a3a3a] mb-6" style={{ fontSize: "1rem" }}>Ce produit n'existe pas ou a été déplacé.</p>
        <Link to="/produits" className="inline-flex items-center gap-2 text-white bg-[#FF3B57] px-6 py-3 rounded-2xl" style={{ fontSize: "0.9375rem", fontWeight: 800 }}>
          <ArrowLeft className="w-4 h-4" /> Retour aux produits
        </Link>
      </div>
    );
  }

  const Icon = iconMap[product.icon] || Shield;
  const pal = productPalette[product.id] || { primary: "#FF3B57", soft: "#FFDDE2", alt: "#FF4FAE" };
  const currentIdx = products.findIndex((p) => p.id === product.id);
  const prevProduct = currentIdx > 0 ? products[currentIdx - 1] : null;
  const nextProduct = currentIdx < products.length - 1 ? products[currentIdx + 1] : null;
  const slogan = slogans[product.id] || "Une protection adaptée à votre réalité.";
  const details = allDetails[product.id];

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-50" style={{ background: pal.primary }} aria-hidden />
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: pal.alt }} aria-hidden />

        <div className="relative max-w-7xl mx-auto">
          <Link to="/produits" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-[#0E1320]/10 hover:border-[#0E1320]/30 transition-colors mb-6" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Tous les produits
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: pal.primary }}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1.5 rounded-full text-white" style={{ background: pal.alt, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                  {product.category === "assurance" ? "MICRO-ASSURANCE" : "ASSISTANCE"}
                </span>
              </div>
              <h1 className="text-[#0E1320]" style={{ fontSize: "clamp(2rem, 6.5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                {product.hero.title}
              </h1>
              <p className="mt-3" style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 700, lineHeight: 1.4, color: pal.primary }}>
                {slogan}
              </p>
              <p className="mt-4 text-[#3a3a3a] max-w-xl" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
                {product.hero.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/devis" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white hover:scale-[1.02] active:scale-95 transition-transform" style={{ background: `linear-gradient(90deg, ${pal.primary}, ${pal.alt})`, fontSize: "0.95rem", fontWeight: 800, boxShadow: `0 18px 40px -12px ${pal.primary}88` }}>
                  Obtenir un devis <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border-2 border-[#0E1320]/10 hover:border-[#0E1320]/40 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  <Phone className="w-4 h-4" style={{ color: pal.primary }} /> Être appelé
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative aspect-square max-w-md mx-auto w-full">
              <div className="absolute inset-0 rounded-[36px] rotate-[-6deg]" style={{ background: pal.soft }} aria-hidden />
              <div className="absolute inset-0 rounded-[36px] rotate-[3deg] bg-white shadow-2xl overflow-hidden">
                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="absolute -bottom-4 -right-4 px-4 py-3 rounded-2xl bg-white shadow-xl flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" style={{ color: pal.primary }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>Solution IPPOO</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* INFOS-CLES STRIP */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: "Souscription", value: "5 min", c: "#FF7A00", s: "#FFE8D1" },
            { icon: CheckCircle, label: "Prise en charge", value: "48 h", c: "#16B26A", s: "#DBFBE7" },
            { icon: Users, label: "Conseillers", value: "Locaux", c: "#FF4FAE", s: "#FFDCEE" },
            { icon: Shield, label: "Conformité", value: "CIMA", c: "#2A6BFF", s: "#DDE7FF" },
          ].map((it, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 flex items-center gap-3 bg-white border-2" style={{ borderColor: `${it.c}25` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.s }}>
                <it.icon className="w-5 h-5" style={{ color: it.c }} />
              </div>
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: it.c, textTransform: "uppercase" }}>{it.label}</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>{it.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTIONS */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto space-y-5">
          {product.sections.map((section, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: idx * 0.08 }}
              className="rounded-3xl p-6 sm:p-8 bg-white border-2" style={{ borderColor: `${pal.primary}20`, boxShadow: `0 18px 40px -22px ${pal.primary}40` }}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: pal.primary, fontSize: "1rem", fontWeight: 900 }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <h2 className="mb-3" style={{ fontSize: "1.25rem", fontWeight: 900, lineHeight: 1.25 }}>{section.title}</h2>
                  <p className="text-[#3a3a3a]" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DETAILS */}
      {details && (
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-white border-y-4" style={{ borderColor: pal.soft }}>
          <div className="max-w-5xl mx-auto space-y-14">

            {/* Garanties */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: pal.soft }}>
                  <Shield className="w-6 h-6" style={{ color: pal.primary }} />
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, letterSpacing: "-0.01em" }}>Tableau des garanties</h2>
              </div>
              <p className="text-[#3a3a3a] mb-6" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
                Plafonds, taux de prise en charge et franchises. Conditions détaillées dans les Conditions Particulières remises à la souscription.
              </p>
              <div className="overflow-x-auto rounded-2xl border-2 bg-white" style={{ borderColor: `${pal.primary}25` }}>
                <table className="w-full" style={{ fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: pal.primary }}>
                      {["Risque couvert", "Prise en charge", "Plafond", "Franchise"].map((h) => (
                        <th key={h} className="text-left px-5 py-4 text-white" style={{ fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {details.garanties.map((g, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: `${pal.primary}15`, background: i % 2 === 1 ? pal.soft + "40" : "white" }}>
                        <td className="px-5 py-4" style={{ fontWeight: 700 }}>{g.risque}</td>
                        <td className="px-5 py-4 text-[#3a3a3a]">{g.priseEnCharge}</td>
                        <td className="px-5 py-4 text-[#3a3a3a]">{g.plafond}</td>
                        <td className="px-5 py-4 text-[#3a3a3a]">{g.franchise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Carence */}
            <div className="flex items-start gap-4 p-6 rounded-2xl border-2" style={{ background: pal.soft + "70", borderColor: `${pal.primary}30` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: pal.primary }}>
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="mb-1" style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", color: pal.primary, textTransform: "uppercase" }}>Délai de carence</p>
                <p style={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.6 }}>{details.delaiCarence}</p>
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FFDDE2] flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-[#FF3B57]" />
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, letterSpacing: "-0.01em" }}>Ce qui n'est pas couvert</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {details.exclusions.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border-2 border-[#FF3B57]/15">
                    <XCircle className="w-5 h-5 text-[#FF3B57] shrink-0 mt-0.5" />
                    <span className="text-[#3a3a3a]" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{ex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formules */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: pal.soft }}>
                  <Sparkles className="w-6 h-6" style={{ color: pal.primary }} />
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, letterSpacing: "-0.01em" }}>Nos formules</h2>
              </div>
              <div className={`grid grid-cols-1 ${details.formules.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"} gap-5`}>
                {details.formules.map((f, i) => (
                  <div key={i} className={`relative rounded-3xl p-6 border-2 transition-transform hover:-translate-y-1 ${f.highlight ? "text-white" : "bg-white"}`}
                    style={f.highlight ? { background: `linear-gradient(135deg, ${pal.primary}, ${pal.alt})`, borderColor: pal.primary, boxShadow: `0 24px 50px -18px ${pal.primary}88` } : { borderColor: `${pal.primary}20` }}>
                    {f.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-white text-[#0E1320] px-3 py-1 rounded-full shadow" style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        <Star className="w-3 h-3" style={{ color: pal.primary }} fill={pal.primary} /> Recommandée
                      </div>
                    )}
                    <p className="mb-2" style={{ fontSize: "1.125rem", fontWeight: 800 }}>{f.nom}</p>
                    <p style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{f.cotisation}</p>
                    <p className={`mt-3 ${f.highlight ? "text-white/90" : "text-[#3a3a3a]"}`} style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exemple */}
            <div className="rounded-3xl overflow-hidden border-2 bg-white" style={{ borderColor: `${pal.primary}30` }}>
              <div className="px-6 py-3 flex items-center gap-2 text-white" style={{ background: pal.primary }}>
                <Quote className="w-4 h-4" />
                <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Exemple concret de sinistre</span>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <p className="mb-2" style={{ fontSize: "1.05rem", fontWeight: 900 }}>{details.exempleSinistre.profil}</p>
                  <p className="text-[#3a3a3a]" style={{ fontSize: "0.9375rem", lineHeight: 1.75 }}>{details.exempleSinistre.histoire}</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl text-white" style={{ background: pal.primary }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Indemnisation</p>
                    <p className="mt-1" style={{ fontSize: "1rem", fontWeight: 900 }}>{details.exempleSinistre.indemnisation}</p>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: pal.soft }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: pal.primary }}>Délai</p>
                    <p className="mt-1" style={{ fontSize: "1rem", fontWeight: 900 }}>{details.exempleSinistre.delai}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pal.primary} 0%, ${pal.alt} 100%)` }}>
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#FFC419]/30 blur-3xl" aria-hidden />
          <div className="relative w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-white/25 backdrop-blur-sm">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {product.cta.title}
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.65 }}>
            {product.cta.description}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
              <Phone className="w-4 h-4" style={{ color: pal.primary }} /> Contacter IPPOO <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/points-partenaires" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-2xl hover:bg-white/25 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              <MapPin className="w-4 h-4" /> Points partenaires
            </Link>
          </div>
        </div>
      </section>

      {/* PREV / NEXT */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          {prevProduct ? (
            <Link to={`/produits/${prevProduct.slug}`} className="flex items-center gap-3 group bg-white px-5 py-4 rounded-2xl border-2 border-[#0E1320]/10 hover:border-[#0E1320]/40 transition-colors flex-1">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <div className="text-left">
                <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: pal.primary }}>Précédent</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 800 }}>{prevProduct.shortName}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}
          {nextProduct ? (
            <Link to={`/produits/${nextProduct.slug}`} className="flex items-center gap-3 group bg-white px-5 py-4 rounded-2xl border-2 border-[#0E1320]/10 hover:border-[#0E1320]/40 transition-colors flex-1 justify-end">
              <div className="text-right">
                <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: pal.primary }}>Suivant</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 800 }}>{nextProduct.shortName}</p>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </section>
    </div>
  );
}
