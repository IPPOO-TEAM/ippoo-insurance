import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, QrCode, Fingerprint, Mail, KeyRound, Headphones } from "lucide-react";
import { useAuth } from "../AuthContext";
import { QrLoginModal } from "../components/QrLoginModal";
import { BiometricLoginModal } from "../components/BiometricLoginModal";
import { hasSeenIntro } from "./IntroOnboardingPage";

type Etape = "email" | "motdepasse" | "alternatives";

const ETAPES: Etape[] = ["email", "motdepasse", "alternatives"];

export function ConnexionPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const etape = (params.get("etape") as Etape) ?? "email";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  useEffect(() => {
    if (!ETAPES.includes(etape)) {
      const next = new URLSearchParams(params);
      next.set("etape", "email");
      setParams(next, { replace: true });
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etape]);

  if (!authLoading && user) return <Navigate to="/espace-client" replace />;
  if (!authLoading && !user && !hasSeenIntro()) return <Navigate to="/espace-client/decouverte" replace />;

  const goto = (e: Etape) => {
    const next = new URLSearchParams(params);
    next.set("etape", e);
    setParams(next);
  };

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Renseignez votre adresse e-mail."); return; }
    goto("motdepasse");
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate("/espace-client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = ETAPES.indexOf(etape);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0E1320] via-[#1a1f33] to-[#FF3B57]/40 sm:p-4">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl px-5 py-8 sm:p-10 min-h-screen sm:min-h-0">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF3B57] to-[#FF7A00] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p style={{ fontWeight: 900, fontSize: "1.1rem" }}>IPPOO</p>
            <p className="text-[#666]" style={{ fontSize: "0.65rem", letterSpacing: "0.18em" }}>ESPACE CLIENT</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-6" aria-label="Progression">
          {ETAPES.map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= stepIndex ? "#FF3B57" : "#E8E4DC" }}
            />
          ))}
        </div>

        {etape === "email" && (
          <>
            <h1 className="t-title1">Votre adresse e-mail</h1>
            <p className="mt-2 text-[#666]" style={{ fontSize: "0.9rem" }}>
              Étape 1 sur 3 identifiez-vous pour accéder à votre espace IPPOO.
            </p>
            <form onSubmit={submitEmail} className="mt-7 space-y-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] transition-colors"
                    placeholder="vous@exemple.com"
                  />
                </div>
              </div>
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white"
                style={{ background: "#FF3B57", fontWeight: 800 }}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => goto("alternatives")}
                className="w-full text-[#666] hover:text-[#FF3B57]"
                style={{ fontSize: "0.82rem", fontWeight: 600 }}
              >
                Se connecter autrement (QR / biométrie)
              </button>
            </form>
          </>
        )}

        {etape === "motdepasse" && (
          <>
            <h1 className="t-title1">Mot de passe</h1>
            <p className="mt-2 text-[#666]" style={{ fontSize: "0.9rem" }}>
              Étape 2 sur 3 connexion de <span style={{ fontWeight: 700 }}>{email}</span>.
            </p>
            <form onSubmit={submitPassword} className="mt-7 space-y-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Mot de passe</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input
                    type={show ? "text" : "password"}
                    required
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] transition-colors"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#666]">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white disabled:opacity-60"
                style={{ background: "#FF3B57", fontWeight: 800 }}
              >
                {loading ? "Connexion..." : (<>Se connecter <ArrowRight className="w-4 h-4" /></>)}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => goto("email")} className="inline-flex items-center gap-1.5 text-[#666] hover:text-[#FF3B57]" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Modifier l'e-mail
                </button>
                <button type="button" onClick={() => goto("alternatives")} className="text-[#666] hover:text-[#FF3B57]" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  Connexion alternative
                </button>
              </div>
            </form>
          </>
        )}

        {etape === "alternatives" && (
          <>
            <h1 className="t-title1">Connexion rapide</h1>
            <p className="mt-2 text-[#666]" style={{ fontSize: "0.9rem" }}>
              Étape 3 sur 3 utilisez votre carte membre ou votre empreinte.
            </p>
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-black/10 hover:border-[#FF3B57]"
                style={{ fontSize: "0.9rem", fontWeight: 700 }}
              >
                <QrCode className="w-4 h-4" /> Scanner mon QR membre
              </button>
              <button
                type="button"
                onClick={() => setBioOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-black/10 hover:border-[#FF3B57]"
                style={{ fontSize: "0.9rem", fontWeight: 700 }}
              >
                <Fingerprint className="w-4 h-4" /> Empreinte biométrique
              </button>
              <button type="button" onClick={() => goto("email")} className="w-full inline-flex items-center justify-center gap-1.5 text-[#666] hover:text-[#FF3B57]" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Revenir à la connexion par mot de passe
              </button>
            </div>
            {qrOpen && <QrLoginModal onClose={() => setQrOpen(false)} onSuccess={() => navigate("/espace-client")} />}
            {bioOpen && <BiometricLoginModal onClose={() => setBioOpen(false)} onSuccess={() => navigate("/espace-client")} />}
          </>
        )}

        <Link
          to="/agent"
          className="mt-6 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-black/10 hover:border-[#FF3B57] hover:bg-[#FF3B57]/5 transition-colors"
          style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666" }}
        >
          <Headphones className="w-4 h-4 text-[#FF3B57] shrink-0" />
          <span className="flex-1">
            Vous êtes conseiller IPPOO ? <span style={{ fontWeight: 800, color: "#0E1320" }}>Accédez à l'espace agent</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>

        <p className="mt-6 text-center text-[#666]" style={{ fontSize: "0.85rem" }}>
          Pas encore inscrit ?{" "}
          <Link to="/espace-client/inscription" className="text-[#FF3B57]" style={{ fontWeight: 700 }}>
            Créer un compte
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link to="/" className="text-[#666]" style={{ fontSize: "0.8rem" }}>
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
