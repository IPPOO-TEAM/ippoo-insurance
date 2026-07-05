import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, ChevronDown, Shield, ArrowUpRight, ArrowRight, Phone, MessageCircle,
  Home, CreditCard, Sparkles, MapPin, Info, AlertTriangle, HelpCircle, Package,
  LogIn, UserPlus, LogOut, LayoutDashboard, FileText, Bell, User as UserIcon,
  Users as UsersIcon, FolderOpen, Settings as SettingsIcon, CreditCard as CardIcon,
} from "lucide-react";
import { products } from "../data/products";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLang } from "../lib/LanguageContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoIppoo from "../../imports/insurance_fav.jpg";

const navIcons = { Home, CreditCard, Sparkles, MapPin, Info, AlertTriangle, HelpCircle };

interface HeaderProps {
  appMode?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function Header({ appMode = false, userName, onLogout }: HeaderProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useLang();

  const publicLinks = [
    { label: t.nav.home, path: "/", icon: navIcons.Home },
    { label: t.nav.carte, path: "/carte-ippoo", icon: navIcons.CreditCard },
    { label: t.nav.howItWorks, path: "/comment-ca-marche", icon: navIcons.Sparkles },
    { label: t.nav.partners, path: "/points-partenaires", icon: navIcons.MapPin },
    { label: t.nav.about, path: "/a-propos", icon: navIcons.Info },
    { label: t.nav.sinistre, path: "/sinistre", icon: navIcons.AlertTriangle },
    { label: t.nav.faq, path: "/faq", icon: navIcons.HelpCircle },
  ];
  const appLinks = [
    { label: "Tableau de bord", path: "/espace-client", icon: LayoutDashboard },
    { label: "Mes contrats", path: "/espace-client/contrats", icon: FileText },
    { label: "Sinistres", path: "/espace-client/sinistres", icon: AlertTriangle },
    { label: "Cotisations", path: "/espace-client/cotisations", icon: CreditCard },
    { label: "Ma carte", path: "/espace-client/carte", icon: CardIcon },
    { label: "Souscrire", path: "/espace-client/souscription", icon: Sparkles },
    { label: "Bénéficiaires", path: "/espace-client/beneficiaires", icon: UsersIcon },
    { label: "Documents", path: "/espace-client/documents", icon: FolderOpen },
    { label: "Messagerie", path: "/espace-client/messagerie", icon: MessageCircle },
    { label: "Notifications", path: "/espace-client/notifications", icon: Bell },
    { label: "Profil", path: "/espace-client/profil", icon: UserIcon },
    { label: "Paramètres", path: "/espace-client/parametres", icon: SettingsIcon },
  ];
  const navLinks = appMode ? appLinks : publicLinks;
  const primaryDesktop = appMode ? appLinks.slice(0, 5) : publicLinks.slice(0, 5);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProductsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (path: string) => location.pathname === path;
  const onProducts = location.pathname.startsWith("/produits");

  const assurance = products.filter((p) => p.category === "assurance");
  const assistance = products.filter((p) => p.category === "assistance");

  return (
    <>
    <div
      className={
        appMode
          ? "fixed top-0 left-0 right-0 z-50"
          : "sticky top-2 sm:top-3 z-50 px-2 sm:px-3 lg:px-4"
      }
      style={appMode ? { paddingTop: "env(safe-area-inset-top, 0px)" } : undefined}
    >
      <header
        className={`${appMode ? "w-full" : "max-w-7xl mx-auto rounded-2xl sm:rounded-3xl"} transition-all duration-500 ${
          appMode
            ? "bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_18px_-12px_rgba(0,0,0,0.18)]"
            : scrolled
            ? "bg-white/85 backdrop-blur-xl shadow-[0_18px_50px_-20px_rgba(0,0,0,0.22)] border border-black/[0.05]"
            : "bg-white/95 backdrop-blur-md shadow-[0_8px_30px_-18px_rgba(0,0,0,0.15)] border border-black/[0.04]"
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.75rem] gap-4">
          {/* Logo */}
          {appMode ? (
            <div className="flex items-center shrink-0 select-none" aria-label="IPPOO ASSURANCE">
              <ImageWithFallback
                src={logoIppoo}
                alt="IPPOO ASSURANCE"
                className="h-8 sm:h-10 lg:h-12 w-auto max-w-[180px] sm:max-w-[240px] lg:max-w-none object-contain"
              />
            </div>
          ) : (
            <Link to="/" className="flex items-center shrink-0 group" aria-label="IPPOO ASSURANCE Accueil">
              <ImageWithFallback
                src={logoIppoo}
                alt="IPPOO ASSURANCE"
                className="h-8 sm:h-10 lg:h-12 w-auto max-w-[180px] sm:max-w-[240px] lg:max-w-none object-contain transition-transform group-hover:scale-[1.04]"
              />
            </Link>
          )}

          {/* Desktop Navigation pill */}
          <nav className="hidden lg:flex items-center bg-[#F4F2EE]/70 backdrop-blur rounded-full p-1 border border-black/[0.04]">
            {primaryDesktop.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-full transition-colors duration-200 whitespace-nowrap ${
                  isActive(link.path) ? "text-white" : "text-[#3a3a3a] hover:text-black"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] shadow-[0_8px_20px_-10px_rgba(11,110,79,0.6)]"
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}

            {/* Products Dropdown (public only) */}
            {!appMode && (
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <Link
                to="/produits"
                className={`relative px-3.5 py-2 rounded-full transition-colors duration-200 inline-flex items-center gap-1.5 whitespace-nowrap ${
                  onProducts ? "text-white" : "text-[#3a3a3a] hover:text-black"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {onProducts && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] shadow-[0_8px_20px_-10px_rgba(11,110,79,0.6)]"
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  {t.nav.products}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${productsOpen ? "rotate-180" : ""}`} />
                </span>
              </Link>

              {/* MEGA MENU */}
              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[44rem]"
                  >
                    <div className="bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] border border-black/[0.04] overflow-hidden">
                      <div className="grid grid-cols-[1fr_1fr_0.9fr]">
                        {/* Assurance */}
                        <div className="p-5 border-r border-black/[0.04]">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B57]" />
                            <p style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em", color: "#FF3B57" }}>
                              {t.nav.microAssurance}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            {assurance.map((p) => (
                              <Link
                                key={p.id}
                                to={`/produits/${p.slug}`}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#F8F5F0] transition-colors group/i"
                              >
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: p.colorLight, color: p.color, fontSize: "0.7rem", fontWeight: 800 }}
                                >
                                  {p.shortName.charAt(0)}
                                </span>
                                <span className="text-[#1a1a1a] truncate" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{p.shortName}</span>
                                <ArrowUpRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover/i:opacity-100 transition-opacity" />
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Assistance */}
                        <div className="p-5 border-r border-black/[0.04]">
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2A6BFF]" />
                            <p style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em", color: "#2A6BFF" }}>
                              {t.nav.assistance}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            {assistance.map((p) => (
                              <Link
                                key={p.id}
                                to={`/produits/${p.slug}`}
                                className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#F8F5F0] transition-colors group/i"
                              >
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: p.colorLight, color: p.color, fontSize: "0.7rem", fontWeight: 800 }}
                                >
                                  {p.shortName.charAt(0)}
                                </span>
                                <span className="text-[#1a1a1a] truncate" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{p.shortName}</span>
                                <ArrowUpRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover/i:opacity-100 transition-opacity" />
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Featured CTA */}
                        <div className="p-5 bg-gradient-to-br from-[#0B6E4F] to-[#083d2e] text-white flex flex-col justify-between">
                          <div>
                            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                              <Package className="w-4.5 h-4.5" />
                            </div>
                            <p style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.15 }}>
                              {t.nav.findFormula}
                            </p>
                            <p className="mt-2 text-white/75" style={{ fontSize: "0.75rem", lineHeight: 1.55 }}>
                              {t.nav.productsCount}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-col gap-1.5">
                            <Link
                              to="/produits"
                              className="inline-flex items-center justify-between bg-white text-[#0B6E4F] px-3 py-2 rounded-xl hover:scale-[1.02] transition-transform"
                              style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                            >
                              {t.nav.seeAllProducts} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              to="/devis"
                              className="inline-flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-xl transition-colors"
                              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                            >
                              {t.nav.getQuote} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {!appMode && (
            <Link
              to="/sinistre"
              className={`relative px-3.5 py-2 rounded-full transition-colors duration-200 whitespace-nowrap inline-flex items-center gap-1.5 ${
                isActive("/sinistre") ? "text-white" : "text-[#3a3a3a] hover:text-black"
              }`}
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              {isActive("/sinistre") && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] shadow-[0_8px_20px_-10px_rgba(11,110,79,0.6)]"
                />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] animate-pulse" />
                {t.nav.sinistre}
              </span>
            </Link>
            )}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <LanguageSwitcher compact />
            <a
              href="tel:+22901415210092"
              title="Appeler IPPOO"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F2EE] hover:bg-[#0B6E4F] text-[#0B6E4F] hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
            {appMode ? (
              <>
                {userName && (
                  <span className="hidden xl:inline-flex items-center px-3 py-2 rounded-xl bg-[#F4F2EE] text-[#1a1a1a] max-w-[10rem] truncate" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                    {userName}
                  </span>
                )}
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFE2E7] text-[#C0263A] hover:bg-[#FFD1D9] transition-colors"
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/espace-client/connexion"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[#0B6E4F] hover:bg-[#E8F8EF] transition-colors"
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                >
                  <LogIn className="w-3.5 h-3.5" /> {t.nav.signin}
                </Link>
                <Link
                  to="/espace-client/inscription"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B6E4F]/10 text-[#0B6E4F] hover:bg-[#0B6E4F]/15 transition-colors"
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                >
                  <UserPlus className="w-3.5 h-3.5" /> {t.nav.signup}
                </Link>
                <Link
                  to="/devis"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] text-white px-5 py-2.5 rounded-xl shadow-[0_10px_24px_-10px_rgba(11,110,79,0.55)] hover:scale-[1.03] active:scale-95 transition-transform"
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                >
                  {t.ctaDevisShort}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile right cluster */}
          <div className="lg:hidden flex items-center gap-1.5">
            {appMode ? (
              <Link
                to="/espace-client/notifications"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F2EE] text-[#0B6E4F]"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/devis"
                className="inline-flex items-center gap-1 bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] text-white px-3.5 py-2 rounded-xl shadow-[0_8px_18px_-8px_rgba(11,110,79,0.55)]"
                style={{ fontSize: "0.75rem", fontWeight: 700 }}
              >
                {t.ctaDevisShort}
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t.nav.openMenu}
              className="p-2 rounded-xl bg-[#F4F2EE] hover:bg-black/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      </header>
    </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="fixed top-0 right-0 bottom-0 w-[88%] max-w-sm bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                {appMode ? (
                  <div className="select-none" aria-label="IPPOO">
                    <ImageWithFallback src={logoIppoo} alt="IPPOO" className="h-7 w-auto max-w-[180px] object-contain" />
                  </div>
                ) : (
                  <Link to="/" onClick={() => setMobileOpen(false)} aria-label="Accueil">
                    <ImageWithFallback src={logoIppoo} alt="IPPOO" className="h-7 w-auto max-w-[180px] object-contain" />
                  </Link>
                )}
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label={t.nav.closeMenu}
                  className="w-9 h-9 rounded-xl bg-[#F4F2EE] hover:bg-black/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer scroll */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <a
                    href="https://wa.me/22901415210092"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#E8F8EF] text-[#0B6E4F] hover:scale-[1.02] active:scale-95 transition-transform"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em" }}>{t.nav.whatsappTitle}</p>
                      <p style={{ fontSize: "0.75rem", fontWeight: 800 }}>{t.nav.whatsappAction}</p>
                    </div>
                  </a>
                  <a
                    href="tel:+22901415210092"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FFF1E8] text-[#C04A00] hover:scale-[1.02] active:scale-95 transition-transform"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#FF7A00] flex items-center justify-center text-white">
                      <Phone className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em" }}>{t.nav.callTitle}</p>
                      <p style={{ fontSize: "0.75rem", fontWeight: 800 }}>{t.nav.callAction}</p>
                    </div>
                  </a>
                </div>

                {/* Nav sections */}
                <p className="px-2 mb-2 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                  {t.nav.navigation}
                </p>
                <nav className="space-y-1 mb-5">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                          active ? "bg-[#0B6E4F] text-white shadow-[0_10px_24px_-10px_rgba(11,110,79,0.55)]" : "hover:bg-[#F4F2EE] text-[#1a1a1a]"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            active ? "bg-white/15 text-white" : "bg-[#F4F2EE] text-[#0B6E4F]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{link.label}</span>
                        <ArrowUpRight className={`w-4 h-4 ml-auto ${active ? "text-white/70" : "text-muted-foreground"}`} />
                      </Link>
                    );
                  })}
                </nav>

                {/* Products section (public only) */}
                {!appMode && (<>
                <p className="px-2 mb-2 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                  {t.nav.ourProducts}
                </p>
                <Link
                  to="/produits"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] text-white mb-2 shadow-[0_10px_24px_-10px_rgba(11,110,79,0.55)]"
                >
                  <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <p style={{ fontSize: "0.875rem", fontWeight: 800 }}>{t.nav.allProducts}</p>
                    <p className="text-white/75" style={{ fontSize: "0.7rem" }}>{t.nav.productsCount}</p>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/produits/${p.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-[#F4F2EE] transition-colors"
                    >
                      <span className="text-[#1a1a1a] truncate" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{p.shortName}</span>
                    </Link>
                  ))}
                </div>
                </>)}

                {/* Account */}
                <p className="px-2 mb-2 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.1em" }}>
                  {t.nav.account}
                </p>
                {appMode ? (
                  <div className="mb-3">
                    {userName && (
                      <div className="px-3 py-3 rounded-2xl bg-[#F4F2EE] mb-2">
                        <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", fontWeight: 700 }}>CONNECTÉ</p>
                        <p className="truncate text-[#0E1320]" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{userName}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); onLogout?.(); }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-2xl bg-[#FFE2E7] text-[#C0263A]"
                      style={{ fontSize: "0.9rem", fontWeight: 800 }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Link
                      to="/espace-client/inscription"
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF3B57] text-white shadow-[0_10px_24px_-10px_rgba(255,59,87,0.55)]"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>{t.nav.signup}</span>
                      <span className="text-white/85" style={{ fontSize: "0.6875rem" }}>{t.nav.signupCreate}</span>
                    </Link>
                    <Link
                      to="/espace-client/connexion"
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-[#E8F8EF] text-[#0B6E4F] border border-[#0B6E4F]/15"
                    >
                      <LogIn className="w-4 h-4" />
                      <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>{t.nav.signin}</span>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600 }}>{t.nav.memberArea}</span>
                    </Link>
                  </div>
                )}
                <div className="px-1 py-1">
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Sticky CTA */}
              {!appMode && (
              <div className="border-t border-black/[0.06] p-4 bg-white">
                <Link
                  to="/devis"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B6E4F] to-[#0a5f45] text-white py-3.5 rounded-2xl shadow-[0_14px_30px_-12px_rgba(11,110,79,0.6)]"
                  style={{ fontSize: "0.9375rem", fontWeight: 700 }}
                >
                  {t.ctaDevisShort} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
