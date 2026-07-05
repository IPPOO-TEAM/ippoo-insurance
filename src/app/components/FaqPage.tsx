import { Link } from "react-router";
import { motion } from "motion/react";
import { Phone, MapPin, HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import { faqData } from "../data/products";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";

import heroImg from "../../imports/t_l_chargement_-_2026-02-19T005800.181.jpg";

const itemPalette = [
  { bg: "#FF3B57", soft: "#FFDDE2" },
  { bg: "#FF7A00", soft: "#FFE8D1" },
  { bg: "#16B26A", soft: "#DBFBE7" },
  { bg: "#2A6BFF", soft: "#DDE7FF" },
  { bg: "#FF4FAE", soft: "#FFDCEE" },
  { bg: "#8A4BFF", soft: "#ECE0FF" },
  { bg: "#FFC419", soft: "#FFF2BF" },
];

export function FaqPage() {
  const { t } = useLang();
  usePageMeta({
    title: "FAQ Toutes les réponses sur la micro-assurance",
    description: "Questions fréquentes sur la souscription, les cotisations, les sinistres et la Carte IPPOO.",
  });

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#8A4BFF]/30 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#FF4FAE]/30 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1
              className="gradient-title"
              style={{ fontSize: "clamp(2.25rem, 8vw, 4.5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}
            >
              {t.faq.titleA}
              <br />
              {t.faq.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.faq.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#faq"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white shadow-[0_18px_40px_-12px_rgba(138,75,255,0.55)] hover:scale-[1.02] active:scale-95 transition-transform"
                style={{ background: "linear-gradient(90deg,#8A4BFF,#FF4FAE)", fontSize: "0.95rem", fontWeight: 800 }}
              >
                {t.faq.seeAnswers} <Sparkles className="w-4 h-4" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#0E1320]/15 hover:border-[#0E1320]/40 transition-colors"
                style={{ fontSize: "0.95rem", fontWeight: 700 }}
              >
                <Phone className="w-4 h-4 text-[#16B26A]" />
                {t.faq.talkAdvisor}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-[5/4] max-w-md mx-auto w-full"
          >
            <div className="absolute inset-0 rounded-[36px] rotate-[-5deg] bg-[#FF4FAE]/70" aria-hidden />
            <div className="absolute inset-0 rounded-[36px] rotate-[3deg] bg-white shadow-2xl overflow-hidden">
              <ImageWithFallback src={heroImg} alt="Support client" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl bg-white shadow-xl flex items-center gap-2.5" style={{ borderTop: "4px solid #8A4BFF" }}>
              <div className="w-10 h-10 rounded-xl bg-[#ECE0FF] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#8A4BFF]" />
              </div>
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#8A4BFF", letterSpacing: "0.08em" }}>{t.faq.responseLabel}</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>{t.faq.in24h}</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#FFC419] to-[#FF7A00] shadow-xl flex items-center justify-center">
              <HelpCircle className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      <PromoCarousel />

      {/* FAQ ACCORDIONS */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((faq, idx) => {
              const c = itemPalette[idx % itemPalette.length];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15px" }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <AccordionItem
                    value={`faq-${idx}`}
                    className="bg-white rounded-2xl border-2 px-5 sm:px-6 transition-all duration-300"
                    style={{ borderColor: `${c.bg}25`, boxShadow: `0 14px 30px -22px ${c.bg}55` }}
                  >
                    <AccordionTrigger className="hover:no-underline py-5" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                      <span className="text-left pr-4 flex items-center gap-3">
                        <span
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white"
                          style={{ background: c.bg, fontSize: "0.75rem", fontWeight: 900 }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-[#3a3a3a] pb-5 pl-12" style={{ fontSize: "0.9375rem", lineHeight: 1.8 }}>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="max-w-5xl mx-auto rounded-[32px] p-8 sm:p-14 text-center text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#8A4BFF 0%,#FF4FAE 50%,#FFC419 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[#FF3B57]/30 blur-3xl" aria-hidden />
          <MessageCircle className="relative w-10 h-10 mx-auto mb-4 text-white/90" />
          <h2 className="relative" style={{ fontSize: "clamp(1.7rem, 5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {t.faq.ctaTitle}
          </h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            {t.faq.ctaLead}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-[#0E1320] px-7 py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
              <Phone className="w-4 h-4 text-[#FF3B57]" /> {t.faq.ctaContact}
            </Link>
            <Link to="/points-partenaires" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-2xl hover:bg-white/25 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
              <MapPin className="w-4 h-4" /> {t.faq.ctaPartners}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
