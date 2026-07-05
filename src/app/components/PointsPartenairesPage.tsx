import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { MapPin, Phone as PhoneIcon, Search, Building2, Sparkles, Users } from "lucide-react";
import { partnerPoints } from "../data/products";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";

import heroImg from "../../imports/Gemini_Generated_Image_oourz6oourz6oour.png";

const zonePalette = [
  { bg: "#B07A7A", soft: "#F1E6E6" },
  { bg: "#6E7FA3", soft: "#E6EAF1" },
  { bg: "#6FA38A", soft: "#E2EFE9" },
  { bg: "#B8946A", soft: "#F1E9DC" },
  { bg: "#A98AA8", soft: "#EDE3ED" },
  { bg: "#8A8AAE", soft: "#E5E5F0" },
  { bg: "#B8A86A", soft: "#F0EBD8" },
];

const accent = "#8A8579";
const accentSoft = "#EDE9E2";

export function PointsPartenairesPage() {
  const { t } = useLang();
  usePageMeta({
    title: "Points partenaires Trouvez le plus proche",
    description: "320 points partenaires IPPOO ASSURANCE en Afrique.",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("Toutes");

  const zones = ["Toutes", ...Array.from(new Set(partnerPoints.map((p) => p.zone)))];

  const filteredPoints = partnerPoints.filter((point) => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "Toutes" || point.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const groupedPoints: Record<string, typeof partnerPoints> = {};
  filteredPoints.forEach((point) => {
    if (!groupedPoints[point.zone]) groupedPoints[point.zone] = [];
    groupedPoints[point.zone].push(point);
  });

  return (
    <div className="overflow-hidden bg-[#FAF7F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#B8946A]/15 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#6FA38A]/15 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#A98AA8]/15 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1
              className="gradient-title"
              style={{ fontSize: "clamp(2.25rem, 8vw, 4.5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}
            >
              {t.partenaires.titleA}
              <br />
              {t.partenaires.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#5a544c]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.partenaires.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#search"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white shadow-[0_14px_30px_-14px_rgba(176,122,122,0.5)] hover:scale-[1.02] active:scale-95 transition-transform"
                style={{ background: "linear-gradient(90deg,#B8946A,#B07A7A)", fontSize: "0.95rem", fontWeight: 800 }}
              >
                Trouver un point <Search className="w-4 h-4" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#2A2620]/15 hover:border-[#2A2620]/30 transition-colors"
                style={{ fontSize: "0.95rem", fontWeight: 700 }}
              >
                <PhoneIcon className="w-4 h-4 text-[#6FA38A]" />
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
            <div className="absolute inset-0 rounded-[36px] rotate-[-5deg] bg-[#B8946A]/40" aria-hidden />
            <div className="absolute inset-0 rounded-[36px] rotate-[3deg] bg-white shadow-xl overflow-hidden">
              <ImageWithFallback src={heroImg} alt="Commerce local" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl bg-white shadow-lg flex items-center gap-2.5" style={{ borderTop: "4px solid #6E7FA3" }}>
              <div className="w-10 h-10 rounded-xl bg-[#E6EAF1] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#6E7FA3]" />
              </div>
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#6E7FA3", letterSpacing: "0.08em" }}>RÉSEAU</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>de proximité</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#6FA38A] to-[#B8A86A] shadow-lg flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      <PromoCarousel />

      {/* SEARCH & LIST */}
      <section id="search" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mb-10 max-w-4xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8946A]" />
              <input
                type="text"
                placeholder="Rechercher un point de service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-13 pr-5 py-4 bg-white border-2 border-[#B8946A]/20 rounded-2xl focus:outline-none focus:border-[#B8946A] transition-all shadow-sm"
                style={{ fontSize: "0.9375rem", paddingLeft: "3.25rem" }}
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {zones.map((zone, i) => {
                const c = zonePalette[i % zonePalette.length];
                const active = selectedZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className="px-4 py-2.5 rounded-full transition-all duration-300 border-2"
                    style={{
                      background: active ? c.bg : c.soft,
                      color: active ? "#fff" : c.bg,
                      borderColor: active ? c.bg : "transparent",
                      fontSize: "0.8125rem",
                      fontWeight: 800,
                    }}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {Object.entries(groupedPoints).map(([zone, points], zoneIdx) => {
            const c = zonePalette[zoneIdx % zonePalette.length];
            return (
              <motion.div key={zone} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: c.soft }}>
                    <Building2 className="w-5 h-5" style={{ color: c.bg }} />
                  </div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{zone}</h2>
                  <span className="px-3 py-1 rounded-full text-white" style={{ background: c.bg, fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.08em" }}>
                    {points.length} POINT{points.length > 1 ? "S" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {points.map((point, idx) => (
                    <motion.div
                      key={`${zone}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1"
                      style={{ borderColor: `${c.bg}22`, boxShadow: `0 12px 26px -20px ${c.bg}55` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.bg }} />
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 800 }}>{point.name}</h3>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: c.bg }} />
                          <span className="text-[#5a544c]" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>{point.address}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <PhoneIcon className="w-4 h-4 shrink-0" style={{ color: c.bg }} />
                          <span className="text-[#5a544c]" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{point.phone}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {filteredPoints.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: accentSoft }}>
                <MapPin className="w-7 h-7" style={{ color: accent }} />
              </div>
              <p className="text-[#5a544c]" style={{ fontSize: "1rem", fontWeight: 600 }}>
                Aucun point trouvé pour cette recherche.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#B8946A 0%,#B07A7A 50%,#A98AA8 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#B8A86A]/25 blur-3xl" aria-hidden />
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Pas de point près de chez vous ?
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            Contactez IPPOO directement pour être orienté vers la solution la plus proche.
          </p>
          <div className="relative mt-7">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#2A2620] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
              <PhoneIcon className="w-4 h-4 text-[#B07A7A]" /> Contacter IPPOO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
