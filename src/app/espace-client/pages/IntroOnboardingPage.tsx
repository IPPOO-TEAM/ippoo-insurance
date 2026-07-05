import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, ShieldCheck, Smartphone, Users, HeartHandshake, Briefcase, HandHeart,
  ArrowRight, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../AuthContext";

import ippooLogo from "../../../imports/FAV_IPPOO.png";
import imgSmartphoneJoy from "../../../imports/photo_2026-05-25_15-34-28.jpg";
import imgCoiffeuse from "../../../imports/afrique-coiffeuses-ambassadrices-sante-mentale-32825.png";
import imgFamilleToit from "../../../imports/photo_4_2026-05-25_15-34-44.jpg";
import imgGrandPere from "../../../imports/photo_3_2026-05-25_15-34-44.jpg";
import imgSeniorSmartphone from "../../../imports/photo_15_2026-05-25_15-34-44-1.jpg";
import imgConseillere from "../../../imports/photo_9_2026-05-25_15-34-44.jpg";

// First-launch tour shown BEFORE any authentication. Each phase uses its photo
// as a full-bleed transparent background (the image bleeds behind the content)
// so the user feels the story without a separate illustration card. Layout is
// height-constrained via 100svh + min-h-0 so it never overflows on mobile.

const INTRO_FLAG = "ippoo:intro:seen:v1";

type Phase = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  icon: typeof Shield;
  accent: string;
  tint: string; // rgba overlay applied over the background photo
  illustration: string;
  alt: string;
  focus?: string;
};

const PHASES: Phase[] = [
  {
    id: "bienvenue",
    eyebrow: "Bienvenue",
    title: "IPPOO, l'assurance qui vous ressemble",
    desc: "Pensée pour l'Afrique et chaque génération : jeunes actifs, familles, commerçants, aînés.",
    icon: HeartHandshake,
    accent: "#FF3B57",
    tint: "rgba(255,59,87,0.18)",
    illustration: imgSmartphoneJoy,
    alt: "Jeune femme africaine souriante, smartphone en main",
    focus: "center 30%",
  },
  {
    id: "metiers",
    eyebrow: "Vos métiers",
    title: "Une couverture pour votre quotidien",
    desc: "Coiffeuses, mécaniciens, commerçantes, taxi-motos : 11 offres adaptées, dès 500 FCFA / jour.",
    icon: Briefcase,
    accent: "#FF7A00",
    tint: "rgba(255,122,0,0.20)",
    illustration: imgCoiffeuse,
    alt: "Coiffeuse africaine prenant soin d'une cliente",
    focus: "center 35%",
  },
  {
    id: "famille",
    eyebrow: "Votre famille",
    title: "Protégez le toit qui vous abrite",
    desc: "Ajoutez conjoint(e) et enfants en bénéficiaires. IPPOO veille sur toute la maison.",
    icon: Users,
    accent: "#16B26A",
    tint: "rgba(22,178,106,0.20)",
    illustration: imgFamilleToit,
    alt: "Parents formant un toit avec leurs mains au-dessus de leur fille",
    focus: "center 30%",
  },
  {
    id: "generations",
    eyebrow: "Solidarité",
    title: "Des enfants aux aînés, personne n'est seul",
    desc: "Couvrez aussi vos parents et grands-parents. Une seule carte IPPOO pour la famille élargie.",
    icon: HandHeart,
    accent: "#C2410C",
    tint: "rgba(194,65,12,0.22)",
    illustration: imgGrandPere,
    alt: "Grand-père et petit-fils éclatant de rire",
    focus: "center 35%",
  },
  {
    id: "paiement",
    eyebrow: "Mobile Money",
    title: "Souscrivez en quelques secondes",
    desc: "MTN, Moov, Celtiis : payez votre cotisation depuis votre téléphone. Pas de paperasse.",
    icon: Smartphone,
    accent: "#2A6BFF",
    tint: "rgba(42,107,255,0.20)",
    illustration: imgSeniorSmartphone,
    alt: "Femme senior souriante consultant son smartphone",
    focus: "center 30%",
  },
  {
    id: "humain",
    eyebrow: "Conseil humain",
    title: "Un vrai humain à vos côtés",
    desc: "Nos conseillères vous répondent, vous accompagnent en cas de sinistre, vérifient vos pièces.",
    icon: ShieldCheck,
    accent: "#6A1B9A",
    tint: "rgba(106,27,154,0.22)",
    illustration: imgConseillere,
    alt: "Conseillère IPPOO serrant la main d'une cliente",
    focus: "center 25%",
  },
];

export function IntroOnboardingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [i, setI] = useState(0);
  const [direction, setDirection] = useState(1);
  const dragStart = useRef<{ x: number; t: number } | null>(null);

  const phase = PHASES[i];
  const isLast = i === PHASES.length - 1;
  const Icon = phase.icon;
  const last = useMemo(() => PHASES.length - 1, []);

  function go(next: number) {
    if (next < 0 || next > last) return;
    setDirection(next > i ? 1 : -1);
    setI(next);
  }

  function finish() {
    try { localStorage.setItem(INTRO_FLAG, "1"); } catch { /* ignore */ }
    navigate("/espace-client/connexion", { replace: true });
  }

  function skip() {
    try { localStorage.setItem(INTRO_FLAG, "1"); } catch { /* ignore */ }
    navigate("/espace-client/connexion", { replace: true });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "Escape") skip();
      else if (e.key === "Enter" && isLast) finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, isLast]);

  if (!authLoading && user) return <Navigate to="/espace-client" replace />;

  function onPointerDown(e: ReactPointerEvent) {
    dragStart.current = { x: e.clientX, t: Date.now() };
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dt = Date.now() - dragStart.current.t;
    dragStart.current = null;
    if (Math.abs(dx) < 48 || dt > 600) return;
    if (dx < 0) go(i + 1);
    else go(i - 1);
  }

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col text-white"
      // 100svh = small viewport height; on mobile this excludes browser chrome
      // so the layout never gets pushed below the address bar.
      style={{ height: "100svh", minHeight: "100svh" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Background photo (crossfades between phases) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`${phase.id}-bg`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={phase.illustration}
            alt={phase.alt}
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: phase.focus ?? "center" }}
          />
          {/* Brand tint + dark scrim so text stays readable on any photo */}
          <div aria-hidden className="absolute inset-0" style={{ background: phase.tint }} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-4 sm:px-8 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md overflow-hidden"
            style={{ background: "white" }}
          >
            <img src={ippooLogo} alt="IPPOO" className="w-full h-full object-contain p-1" />
          </div>
          <span style={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: "1rem" }}>IPPOO</span>
        </div>
        <button
          onClick={skip}
          className="rounded-full px-3 py-1.5 text-white/85 hover:text-white hover:bg-white/10"
          style={{ fontSize: "0.8rem", fontWeight: 700 }}
        >
          Passer
        </button>
      </header>

      {/* Stage — flex-1 + min-h-0 so children never push the footer off-screen */}
      <main className="relative z-10 flex-1 min-h-0 flex items-end sm:items-center justify-center px-4 sm:px-8 pb-3">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={phase.id}
              custom={direction}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm"
                  style={{ color: "white" }}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span
                  className="px-2.5 py-1 rounded-full uppercase bg-white/15 backdrop-blur-sm"
                  style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em" }}
                >
                  {phase.eyebrow}
                </span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(1.4rem, 5.5vw, 1.95rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  textShadow: "0 2px 16px rgba(0,0,0,0.35)",
                }}
              >
                {phase.title}
              </h1>
              <p
                className="mt-2 text-white/90"
                style={{
                  fontSize: "clamp(0.88rem, 3.6vw, 0.98rem)",
                  lineHeight: 1.45,
                  textShadow: "0 1px 8px rgba(0,0,0,0.45)",
                }}
              >
                {phase.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom controls */}
      <footer
        className="relative z-10 px-4 sm:px-8 shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)", paddingTop: 8 }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {PHASES.map((p, idx) => (
              <button
                key={p.id}
                aria-label={`Aller à l'étape ${idx + 1}`}
                onClick={() => go(idx)}
                className="rounded-full transition-all"
                style={{
                  width: idx === i ? 22 : 7,
                  height: 7,
                  background: idx === i ? "white" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label="Précédent"
              className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {!isLast ? (
              <button
                onClick={() => go(i + 1)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl text-white shadow-lg transition-transform active:scale-[0.985]"
                style={{ height: 50, background: phase.accent, fontSize: "0.95rem", fontWeight: 800 }}
              >
                Suivant <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl text-white shadow-lg transition-transform active:scale-[0.985]"
                style={{ height: 50, background: phase.accent, fontSize: "0.95rem", fontWeight: 800 }}
              >
                Commencer <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-center mt-3 text-white/75" style={{ fontSize: "0.76rem" }}>
            Déjà inscrit ?{" "}
            <button onClick={finish} className="underline text-white" style={{ fontWeight: 700 }}>
              Se connecter
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper for callers (e.g. the connexion guard) to check whether the intro
// was already dismissed on this device.
export function hasSeenIntro(): boolean {
  try { return localStorage.getItem(INTRO_FLAG) === "1"; } catch { return true; }
}
