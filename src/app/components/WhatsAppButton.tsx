import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Phone, AlertTriangle, Calculator, ChevronUp } from "lucide-react";
import { useLang } from "../lib/LanguageContext";

const PHONE = "22901415210092";
const URGENCE = "+229 01 41 52 10 92";
const MESSAGE = "Bonjour IPPOO ASSURANCE, j'aimerais en savoir plus sur vos solutions de micro-assurance.";

export function WhatsAppButton({ appMode = false }: { appMode?: boolean } = {}) {
  const { t } = useLang();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 2500);
    const t2 = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  if (appMode && location.pathname.startsWith("/espace-client/messagerie")) return null;

  const whatsappHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <div
      className={`fixed right-5 sm:right-7 z-50 flex flex-col items-end gap-3 ${appMode ? "" : "bottom-5 sm:bottom-7"}`}
      style={appMode ? { bottom: "calc(var(--nav-bottom-h, 0px) + env(safe-area-inset-bottom, 0px) + 16px)" } : undefined}
    >

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !dismissed && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] border border-border/50 px-4 py-3 max-w-[260px]"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              aria-label="Fermer"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md border border-border/40 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, lineHeight: 1.4 }}>
              Une urgence ou une question ?
            </p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
              Numéro 24/7, WhatsApp, devis ou déclaration de sinistre.
            </p>
            <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white border-r border-b border-border/50 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action stack */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-end gap-2.5"
          >
            <FabAction
              as="a"
              href={`tel:${URGENCE.replace(/\s/g, "")}`}
              label={t.urgence}
              sub={URGENCE}
              icon={Phone}
              bg="#c0392b"
              pulse
            />
            <FabAction
              as="link"
              to="/sinistre"
              label={t.sinistre}
              sub={t.fabSinistreSub}
              icon={AlertTriangle}
              bg="#E65100"
            />
            <FabAction
              as="link"
              to="/devis"
              label={t.devis}
              sub={t.fabDevisSub}
              icon={Calculator}
              bg="#0B6E4F"
            />
            <FabAction
              as="a"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              label={t.whatsapp}
              sub={t.fabWhatsappSub}
              icon={MessageCircle}
              bg="#25D366"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB toggle */}
      <motion.button
        type="button"
        onClick={() => { setOpen(!open); setDismissed(true); }}
        aria-label={open ? `Fermer ${t.menuAide.toLowerCase()}` : `Ouvrir ${t.menuAide.toLowerCase()}`}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.6 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative group"
      >
        {!open && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 blur-xl scale-110 group-hover:scale-125 transition-transform duration-500" />
        <span className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_12px_30px_-6px_rgba(37,211,102,0.55)] transition-colors ${open ? "bg-[#0d1117]" : "bg-gradient-to-br from-[#25D366] to-[#128C7E]"}`}>
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <ChevronUp className="w-6 h-6 sm:w-7 sm:h-7 text-white rotate-180" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="white" strokeWidth={0} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </div>
  );
}

type FabActionProps = {
  label: string;
  sub: string;
  icon: React.ElementType;
  bg: string;
  pulse?: boolean;
} & (
  | { as: "link"; to: string }
  | { as: "a"; href: string; target?: string; rel?: string }
);

function FabAction(props: FabActionProps) {
  const { label, sub, icon: Icon, bg, pulse } = props;
  const inner = (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-[0_12px_30px_-8px_rgba(0,0,0,0.2)] border border-border/40 pl-3 pr-4 py-2.5 hover:shadow-lg transition-all group">
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        {pulse && <span className="absolute inset-0 rounded-xl animate-ping opacity-40" style={{ backgroundColor: bg }} />}
        <Icon className="relative w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <p style={{ fontSize: "0.8125rem", fontWeight: 800, lineHeight: 1.2 }}>{label}</p>
        <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", lineHeight: 1.3 }}>{sub}</p>
      </div>
    </div>
  );

  if (props.as === "link") {
    return (
      <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}>
        <Link to={props.to}>{inner}</Link>
      </motion.div>
    );
  }
  return (
    <motion.a initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      href={props.href} target={props.target} rel={props.rel}>
      {inner}
    </motion.a>
  );
}
