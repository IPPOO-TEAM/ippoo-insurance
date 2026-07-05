import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Phone, Mail, MapPin, Clock, Send, CheckCircle, ArrowRight, Sparkles, MessageCircle,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PromoCarousel } from "./PromoCarousel";
import { usePageMeta } from "../lib/usePageMeta";
import { useLang } from "../lib/LanguageContext";

import heroImg from "../../imports/Black_Girls.jpg";

const channels = [
  { icon: Phone, label: "Téléphone", value: "+229 01 41 52 10 92", color: "#16B26A", soft: "#DBFBE7" },
  { icon: MessageCircle, label: "WhatsApp", value: "+229 01 41 52 10 92", color: "#16B26A", soft: "#DBFBE7" },
  { icon: Mail, label: "E-mail", value: "contact@ippoo.bj", color: "#2A6BFF", soft: "#DDE7FF" },
  { icon: MapPin, label: "Adresse", value: "Parakou, Borgou, Bénin", color: "#FF7A00", soft: "#FFE8D1" },
];

export function ContactPage() {
  const { t } = useLang();
  usePageMeta({
    title: "Contact Parler à un conseiller IPPOO",
    description: "Joignez IPPOO ASSURANCE par téléphone, WhatsApp, e-mail ou en agence.",
  });
  const [formData, setFormData] = useState({ nom: "", metier: "", besoin: "", telephone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ nom: "", metier: "", besoin: "", telephone: "", message: "" });
  };

  return (
    <div className="overflow-hidden bg-[#FFF8F2]">
      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[#16B26A]/30 blur-3xl" aria-hidden />
        <div className="absolute top-20 -right-10 w-80 h-80 rounded-full bg-[#2A6BFF]/30 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full bg-[#FFC419]/40 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1
              className="gradient-title"
              style={{ fontSize: "clamp(2.25rem, 8vw, 4.5rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}
            >
              {t.contact.titleA}
              <br />
              {t.contact.titleAccent}
            </h1>
            <p className="mt-5 max-w-lg text-[#3a3a3a]" style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}>
              {t.contact.lead}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {channels.map((ch) => (
                <div
                  key={ch.label}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 border-2"
                  style={{ borderColor: `${ch.color}25` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: ch.soft }}>
                    <ch.icon className="w-5 h-5" style={{ color: ch.color }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: "0.625rem", fontWeight: 700, color: ch.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {ch.label}
                    </p>
                    <p className="truncate" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{ch.value}</p>
                  </div>
                </div>
              ))}
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
              <ImageWithFallback src={heroImg} alt="Conseillère IPPOO" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl bg-white shadow-xl flex items-center gap-2.5" style={{ borderTop: "4px solid #2A6BFF" }}>
              <div className="w-10 h-10 rounded-xl bg-[#DDE7FF] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#2A6BFF]" />
              </div>
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#2A6BFF", letterSpacing: "0.08em" }}>RÉPONSE</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>sous 24 h</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-[20px] rotate-12 bg-gradient-to-br from-[#FFC419] to-[#FF7A00] shadow-xl flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      <PromoCarousel />

      {/* FORM */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div
              className="bg-white rounded-3xl p-7 sm:p-10 border-2"
              style={{ borderColor: "#FF3B5725", boxShadow: "0 22px 50px -22px #FF3B5755" }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
                Envoyez-nous un message
              </h2>
              <p className="text-[#3a3a3a] mt-1" style={{ fontSize: "0.875rem" }}>
                Un conseiller vous rappelle dans la journée.
              </p>

              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-[#DBFBE7] flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-[#16B26A]" />
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "0.5rem" }}>Message envoyé !</h3>
                  <p className="text-[#3a3a3a]" style={{ fontSize: "0.9375rem" }}>Nous reviendrons vers vous rapidement.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FF3B57", letterSpacing: "0.06em", textTransform: "uppercase" }}>Nom complet</label>
                      <input
                        type="text"
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#FFF8F2] border-2 border-[#FF3B57]/20 rounded-xl focus:outline-none focus:border-[#FF3B57] transition-all"
                        placeholder="Votre nom"
                        style={{ fontSize: "0.9375rem" }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#16B26A", letterSpacing: "0.06em", textTransform: "uppercase" }}>Téléphone</label>
                      <input
                        type="tel"
                        required
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#FFF8F2] border-2 border-[#16B26A]/20 rounded-xl focus:outline-none focus:border-[#16B26A] transition-all"
                        placeholder="+229 XX XX XX XX"
                        style={{ fontSize: "0.9375rem" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2A6BFF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Métier / Activité</label>
                      <input
                        type="text"
                        value={formData.metier}
                        onChange={(e) => setFormData({ ...formData, metier: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#FFF8F2] border-2 border-[#2A6BFF]/20 rounded-xl focus:outline-none focus:border-[#2A6BFF] transition-all"
                        placeholder="Ex : Commerçant, Artisan..."
                        style={{ fontSize: "0.9375rem" }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FF7A00", letterSpacing: "0.06em", textTransform: "uppercase" }}>Besoin</label>
                      <select
                        value={formData.besoin}
                        onChange={(e) => setFormData({ ...formData, besoin: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#FFF8F2] border-2 border-[#FF7A00]/20 rounded-xl focus:outline-none focus:border-[#FF7A00] transition-all appearance-none"
                        style={{ fontSize: "0.9375rem" }}
                      >
                        <option value="">Sélectionnez un besoin</option>
                        <option value="sante">Santé & Maladie</option>
                        <option value="marchandises">Marchandises</option>
                        <option value="equipement">Équipement & Outillage</option>
                        <option value="transport">Transport</option>
                        <option value="maternite">Maternité</option>
                        <option value="education">Éducation</option>
                        <option value="retraite">Retraite & Prévoyance</option>
                        <option value="sociale">Sociale & RC</option>
                        <option value="juridique">Juridique</option>
                        <option value="comptable">Comptable & Fiscale</option>
                        <option value="administrative">Administrative</option>
                        <option value="carte">Carte IPPOO</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8A4BFF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Message</label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3.5 bg-[#FFF8F2] border-2 border-[#8A4BFF]/20 rounded-xl focus:outline-none focus:border-[#8A4BFF] transition-all resize-none"
                      placeholder="Décrivez votre besoin ou votre question..."
                      style={{ fontSize: "0.9375rem" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2.5 text-white px-7 py-4 rounded-2xl shadow-[0_18px_40px_-12px_rgba(255,59,87,0.55)] hover:scale-[1.01] active:scale-95 transition-transform"
                    style={{ background: "linear-gradient(90deg,#FF3B57,#FF7A00)", fontSize: "0.95rem", fontWeight: 800 }}
                  >
                    <Send className="w-4 h-4" />
                    Envoyer mon message
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-5"
          >
            <div
              className="bg-white rounded-3xl p-7 border-2"
              style={{ borderColor: "#16B26A25", boxShadow: "0 18px 40px -22px #16B26A55" }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 900 }}>Coordonnées</h3>
              <ul className="mt-5 space-y-4">
                {channels.map((ch) => (
                  <li key={ch.label} className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: ch.soft }}>
                      <ch.icon className="w-5 h-5" style={{ color: ch.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.625rem", fontWeight: 800, color: ch.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{ch.label}</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>{ch.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-5 border-t-2 border-[#0E1320]/8 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF2BF] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#FFC419]" />
                </div>
                <div>
                  <p style={{ fontSize: "0.625rem", fontWeight: 800, color: "#FFC419", letterSpacing: "0.08em", textTransform: "uppercase" }}>Horaires</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Lun–Ven · 8h00 – 17h30</p>
                  <p className="text-[#3a3a3a]" style={{ fontSize: "0.8125rem" }}>Sam · 8h00 – 12h00</p>
                </div>
              </div>
            </div>

            <div
              className="relative rounded-3xl overflow-hidden text-white p-7"
              style={{ background: "linear-gradient(135deg,#8A4BFF 0%,#FF4FAE 50%,#FF3B57 100%)" }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 900 }}>Points partenaires</h3>
                <p className="text-white/90 mt-2" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                  Rendez-vous dans un point de service pour un accompagnement de proximité.
                </p>
                <Link
                  to="/points-partenaires"
                  className="mt-5 inline-flex items-center gap-2 bg-white text-[#0E1320] px-5 py-3 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
                  style={{ fontSize: "0.85rem", fontWeight: 800 }}
                >
                  Voir nos points <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
