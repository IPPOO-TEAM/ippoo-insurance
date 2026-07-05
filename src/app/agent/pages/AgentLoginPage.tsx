import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2, Shield } from "lucide-react";
import { AuthProvider, isAgentUser, useAuth } from "../../espace-client/AuthContext";
import { getSupabase } from "../../espace-client/supabaseClient";
import { queryClient } from "../../espace-client/queryClient";
import ippooLogo from "../../../imports/FAV_IPPOO.png";

// Écran de connexion dédié aux conseillers IPPOO. Distinct de
// /espace-client/connexion pour éviter la confusion (les deux espaces
// ont des règles différentes : ici un compte sans rôle agent est rejeté
// immédiatement avec un message clair, là c'est l'inverse).
//
// Pourquoi ne pas réutiliser AuthContext.signIn ? Parce qu'il rejette
// précisément les agents (pour protéger l'espace client). On appelle donc
// Supabase directement, puis on vérifie l'inverse : isAgentUser === true.

function LoginForm() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/agent";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && isAgentUser(user)) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const supabase = getSupabase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      if (!isAgentUser(data.user ?? null)) {
        // L'identifiant est valide mais pointe sur un compte client : on
        // déconnecte immédiatement pour ne pas laisser une session client
        // active dans l'espace conseiller.
        await supabase.auth.signOut().catch(() => {});
        throw new Error(
          "Ce compte n'a pas le rôle conseiller. Si vous êtes assuré, connectez-vous depuis l'espace client.",
        );
      }
      toast.success("Bienvenue !");
      navigate(next, { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-app)", color: "var(--ippoo-text)" }}>
      <header
        className="flex items-center justify-between px-5 sm:px-8"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 12,
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--line-hairline)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: "white", boxShadow: "0 4px 12px rgba(255,59,87,0.18)" }}
          >
            <img src={ippooLogo} alt="IPPOO" className="w-full h-full object-contain p-1" />
          </div>
          <div className="leading-tight">
            <p style={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: "0.95rem" }}>IPPOO · Conseillers</p>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>Connexion</p>
          </div>
        </div>
        <Link
          to="/agent/inscription"
          className="px-3 py-1.5 rounded-full"
          style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}
        >
          S'inscrire
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <div
          className="w-full max-w-md p-5 sm:p-6 rounded-3xl"
          style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", boxShadow: "0 8px 30px rgba(14,19,32,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,59,87,0.12)", color: "var(--accent-primary)" }}
            >
              <Shield className="w-4 h-4" />
            </div>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.04em", color: "var(--accent-primary)" }}>
              ESPACE CONSEILLER
            </span>
          </div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Connexion
          </h1>
          <p className="mt-2" style={{ fontSize: "0.92rem", color: "var(--ippoo-text-muted)" }}>
            Réservé aux équipes IPPOO. Vous gérez les conversations, sinistres, KYC et paiements de votre portefeuille.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Field icon={Mail} placeholder="Email professionnel" value={email} onChange={setEmail} type="email" autoComplete="email" required />
            <Field icon={Lock} placeholder="Mot de passe" value={password} onChange={setPassword} type="password" autoComplete="current-password" required />

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white shadow-md transition-transform active:scale-[0.985] disabled:opacity-60"
              style={{ height: 52, background: "var(--accent-primary)", fontSize: "0.95rem", fontWeight: 800 }}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Se connecter <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: "0.82rem", color: "var(--ippoo-text-muted)" }}>
            Pas encore de compte conseiller ?{" "}
            <Link to="/agent/inscription" className="underline" style={{ fontWeight: 700, color: "var(--ippoo-text)" }}>
              Créer un compte
            </Link>
          </p>
          <p className="text-center mt-2" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
            Vous êtes assuré ?{" "}
            <Link to="/espace-client/connexion" className="underline" style={{ fontWeight: 700, color: "var(--ippoo-text)" }}>
              Espace client
            </Link>
          </p>
        </div>
      </main>

      <Toaster position="top-center" expand={false} visibleToasts={3} />
    </div>
  );
}

function Field({
  icon: Icon, placeholder, value, onChange, type, autoComplete, required,
}: {
  icon: typeof Mail;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="relative block">
      <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ippoo-text-muted)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full pl-9 pr-3 py-3 rounded-xl focus:outline-none"
        style={{
          fontSize: "0.92rem",
          background: "var(--surface-app)",
          border: "1px solid var(--line-hairline)",
          color: "var(--ippoo-text)",
        }}
      />
    </label>
  );
}

export function AgentLoginPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </QueryClientProvider>
  );
}
