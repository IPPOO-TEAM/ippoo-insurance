import { Link } from "react-router";
import { Phone, Mail, MapPin, ArrowUpRight, Facebook, Instagram, Linkedin } from "lucide-react";
import { products } from "../data/products";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useLang } from "../lib/LanguageContext";
import logoIppoo from "../../imports/Plan_de_travail63.png";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.85a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.28z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const socialLinks = [
  { label: "WhatsApp", href: "https://wa.me/22901415210092", icon: <WhatsAppIcon /> },
  { label: "Facebook", href: "https://facebook.com/ippooassurance", icon: <Facebook className="w-4 h-4" /> },
  { label: "TikTok", href: "https://tiktok.com/@ippooassurance", icon: <TikTokIcon /> },
  { label: "Instagram", href: "https://instagram.com/ippooassurance", icon: <Instagram className="w-4 h-4" /> },
  { label: "LinkedIn", href: "https://linkedin.com/company/ippooassurance", icon: <Linkedin className="w-4 h-4" /> },
  { label: "X", href: "https://x.com/ippooassurance", icon: <XIcon /> },
];

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="relative bg-[#0d1117] text-white overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ippoo-green/30 to-transparent" />
      <div className="absolute top-20 right-[10%] w-72 h-72 bg-ippoo-green/[0.04] rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-[5%] w-64 h-64 bg-ippoo-blue/[0.03] rounded-full blur-[80px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center mb-6 group" aria-label="IPPOO ASSURANCE Accueil">
              <ImageWithFallback
                src={logoIppoo}
                alt="IPPOO ASSURANCE"
                className="h-14 w-auto object-contain transition-transform group-hover:scale-[1.03]"
              />
            </Link>
            <p className="text-white/45 mb-6" style={{ fontSize: "0.8125rem", lineHeight: 1.8 }}>
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {t.footer.tags.map((tag) => (
                <span key={tag} className="text-white/30 bg-white/[0.04] px-3 py-1 rounded-full" style={{ fontSize: "0.6875rem", fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white/70 mb-3" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.footer.followUs}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white/70 mb-5" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.footer.productsTitle}</h4>
            <ul className="space-y-2.5">
              {products.slice(0, 7).map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/produits/${product.slug}`}
                    className="text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {product.shortName}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/produits"
                  className="text-ippoo-green hover:text-ippoo-green/80 transition-colors inline-flex items-center gap-1"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  {t.nav.seeAllProducts}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white/70 mb-5" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.footer.navigationTitle}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t.footer.navHome, path: "/" },
                { label: t.footer.navProducts, path: "/produits" },
                { label: t.footer.navCarte, path: "/carte-ippoo" },
                { label: t.footer.navHowItWorks, path: "/comment-ca-marche" },
                { label: t.footer.navPartners, path: "/points-partenaires" },
                { label: t.footer.navFaq, path: "/faq" },
                { label: t.footer.navContact, path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/70 mb-5" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.footer.contactTitle}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-ippoo-green/70" />
                </div>
                <span className="text-white/45" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>+229 01 41 52 10 92</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-ippoo-green/70" />
                </div>
                <span className="text-white/45" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>contact@ippoo.bj</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-ippoo-green/70" />
                </div>
                <span className="text-white/45" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>Parakou, Borgou, Bénin</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link
                to="/points-partenaires"
                className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-300"
                style={{ fontSize: "0.8125rem", fontWeight: 500 }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {t.footer.partnersCta}
              </Link>
            </div>
          </div>

          {/* Informations légales */}
          <div>
            <h4 className="text-white/70 mb-5" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.footer.legalTitle}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t.footer.mentions, path: "/mentions-legales" },
                { label: t.footer.privacyPolicy, path: "/confidentialite" },
                { label: t.footer.conditions, path: "/conditions-generales" },
                { label: t.footer.mediationFull, path: "/mediateur" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Regulatory band */}
      <div className="border-t border-white/[0.06] bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid sm:grid-cols-3 gap-4 text-white/40" style={{ fontSize: "0.7rem", lineHeight: 1.6 }}>
          <div>
            <p className="text-white/55" style={{ fontWeight: 700 }}>{t.footer.regulated}</p>
            <p>{t.footer.regulatedText}</p>
          </div>
          <div>
            <p className="text-white/55" style={{ fontWeight: 700 }}>{t.footer.supervision}</p>
            <p>{t.footer.supervisionText}</p>
          </div>
          <div>
            <p className="text-white/55" style={{ fontWeight: 700 }}>{t.footer.license}</p>
            <p>{t.footer.licenseText}</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25" style={{ fontSize: "0.75rem" }}>
            {t.footer.copyright}
          </p>
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
            <Link to="/mentions-legales" className="text-white/85 hover:text-white underline underline-offset-4 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.footer.mentions}</Link>
            <Link to="/confidentialite" className="text-white/85 hover:text-white underline underline-offset-4 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.footer.privacyPolicy}</Link>
            <Link to="/conditions-generales" className="text-white/85 hover:text-white underline underline-offset-4 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.footer.conditions}</Link>
            <Link to="/mediateur" className="text-white/85 hover:text-white underline underline-offset-4 transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t.footer.mediation}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
