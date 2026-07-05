import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FileText, AlertTriangle, CreditCard, Sparkles, Users, FolderOpen,
  MessageCircle, Bell, User as UserIcon, Settings, CreditCard as CardIcon, MapPin, Shield, ChevronRight, LogOut, Search, Sun, Moon, ShieldCheck,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { shellHeaderTexture } from "../lib/images";

const RAIL = [
  { to: "/espace-client", end: true, label: "Accueil", icon: LayoutDashboard },
  { to: "/espace-client/contrats", label: "Contrats", icon: FileText },
  { to: "/espace-client/sinistres", label: "Sinistres", icon: AlertTriangle },
  { to: "/espace-client/cotisations", label: "Cotisations", icon: CreditCard },
  { to: "/espace-client/souscription", label: "Souscrire", icon: Sparkles },
  { to: "/espace-client/beneficiaires", label: "Bénéficiaires", icon: Users },
  { to: "/espace-client/documents", label: "Documents", icon: FolderOpen },
  { to: "/espace-client/carte", label: "Ma carte", icon: CardIcon },
  { to: "/espace-client/messagerie", label: "Messagerie", icon: MessageCircle },
  { to: "/espace-client/notifications", label: "Alertes", icon: Bell },
  { to: "/espace-client/partenaires", label: "Partenaires", icon: MapPin },
  { to: "/espace-client/profil", label: "Profil", icon: UserIcon },
  { to: "/espace-client/verification-identite", label: "Vérification ID", icon: ShieldCheck },
  { to: "/espace-client/parametres", label: "Réglages", icon: Settings },
];

export function AppShell({ children, onLogout, userName }: { children: ReactNode; onLogout: () => void; userName: string }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const cmd = useCommandPalette();
  const rail = RAIL;

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden flex"
      style={{
        background: "linear-gradient(180deg,#F5F6FA 0%, #EEF0F6 100%)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Desktop navigation rail */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-0 h-screen p-5 gap-4">
        <Link to="/espace-client" className="flex items-center gap-3 px-1">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: "linear-gradient(135deg,#FF3B57,#FF7A00)" }}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>IPPOO</p>
            <p className="text-[#888]" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", fontWeight: 700 }}>ESPACE CLIENT</p>
          </div>
        </Link>

        <button
          onClick={() => cmd.setOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white border border-black/5 text-[#888] hover:text-[#0E1320] shadow-sm"
          style={{ fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#F5F6FA]" style={{ fontSize: "0.65rem", fontWeight: 800 }}>⌘K</kbd>
        </button>

        <nav className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5">
          {rail.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                  isActive ? "text-[#0E1320]" : "text-[#666] hover:text-[#0E1320] hover:bg-white/70"
                }`
              }
              style={{ fontSize: "0.88rem", fontWeight: 700 }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-white shadow-md border border-black/5"
                    />
                  )}
                  <span className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? "text-white" : "bg-[#F5F6FA] text-[#0E1320]"}`}
                    style={isActive ? { background: "linear-gradient(135deg,#FF3B57,#FF7A00)" } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-black/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#0E1320,#2A1840)" }}>
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{userName}</p>
            <p className="text-[#888]" style={{ fontSize: "0.68rem" }}>Connecté</p>
          </div>
          <button onClick={toggle} title="Thème" className="p-2 rounded-xl hover:bg-[#F5F6FA]">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onLogout} title="Déconnexion" className="p-2 rounded-xl text-[#C0263A] hover:bg-[#FFE2E7]">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main column phone shell on mobile, fluid on desktop */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 min-w-0 pb-28 lg:pb-10"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <CommandPalette open={cmd.open} onClose={() => cmd.setOpen(false)} />
    </div>
  );
}

/** Native-style large title header used at the top of every page. */
export function PageHeader({
  title,
  subtitle,
  trailing,
  back,
  gradient = false,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  back?: { to: string; label?: string };
  gradient?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wrapperBg = gradient
    ? "transparent"
    : scrolled ? "rgba(245,246,250,0.85)" : "transparent";
  const textColor = gradient ? "text-white" : "text-[#0E1320]";
  const subtitleColor = gradient ? "text-white/85" : "text-[#666]";

  const innerContent = (
    <div className="px-4 sm:px-7 pt-3 pb-4 sm:pt-5 sm:pb-5 flex items-start justify-between gap-3 relative z-10">
      <div className="min-w-0 flex-1">
        {back && (
          <Link to={back.to} className={`inline-flex items-center gap-1 mb-1 ${gradient ? "text-white/80" : "text-[#666]"}`} style={{ fontSize: "0.78rem", fontWeight: 700 }}>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> {back.label ?? "Retour"}
          </Link>
        )}
        <h1 className={`truncate ${textColor}`} style={{ fontSize: "clamp(1.55rem, 5vw, 2rem)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.1, textShadow: gradient ? "0 2px 12px rgba(0,0,0,0.18)" : undefined }}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-1.5 ${subtitleColor}`} style={{ fontSize: "0.88rem", fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-2 pt-1">{trailing}</div>}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur transition-shadow ${
        scrolled && !gradient ? "shadow-[0_8px_24px_-18px_rgba(0,0,0,0.25)]" : ""
      }`}
      style={{ backgroundColor: wrapperBg }}
    >
      {gradient ? (
        <div className="px-2 sm:px-6 pt-0 pb-2 sm:pt-3">
          <div
            className="relative overflow-hidden rounded-3xl shadow-[0_20px_40px_-22px_rgba(42,107,255,0.55)]"
            style={{ background: "linear-gradient(135deg,#2A6BFF 0%, #5b34d4 60%, #7a1fb8 100%)" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url('${shellHeaderTexture}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.18,
                mixBlendMode: "overlay",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)" }}
            />
            {innerContent}
          </div>
        </div>
      ) : (
        innerContent
      )}
    </header>
  );
}

/** Page content container keeps consistent gutters and rhythm. */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-2 sm:px-6 pt-3 pb-6 space-y-4 max-w-3xl lg:max-w-5xl mx-auto ${className}`}>{children}</div>;
}

/** Native-style card with subtle elevation. */
export function Card({ children, className = "", interactive = false, onClick }: { children: ReactNode; className?: string; interactive?: boolean; onClick?: () => void }) {
  const base = "bg-white rounded-3xl border border-black/[0.04] shadow-[0_8px_24px_-18px_rgba(14,19,32,0.18)]";
  const tap = interactive ? "transition-transform active:scale-[0.985] cursor-pointer" : "";
  return (
    <div className={`${base} ${tap} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

/** Bottom sheet slides up from the bottom on mobile, centers on desktop. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-[28px] shadow-2xl max-h-[92vh] flex flex-col sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:max-w-md sm:rounded-[28px]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="pt-2 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-black/15" /></div>
            {title && (
              <div className="px-6 pt-3 pb-1">
                <h2 style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{title}</h2>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Native-style segmented control. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-[#EAECF2] relative">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative px-4 py-1.5 rounded-full transition-colors ${active ? "text-[#0E1320]" : "text-[#666]"}`}
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-white shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Silence unused-import linters during rapid iteration.
export const _appShellExports = { useAuth };
