import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { Mail, Lock, User, Phone, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "../../espace-client/AuthContext";
import { getSupabase } from "../../espace-client/supabaseClient";
import { queryClient } from "../../espace-client/queryClient";
import { agentApi } from "../api";
import ippooLogo from "../../../imports/FAV_IPPOO.png";

// Flux d'inscription dédié aux conseillers IPPOO. Même langage visuel que
// l'app client (surface claire, accent rouge IPPOO) avec un bandeau
// « Conseillers » pour ne pas le confondre avec /inscription client. Gated
// côté serveur par AGENT_SIGNUP_CODE (env var) : sans le code d'invitation,
// l'API refuse — impossible de s'auto-promouvoir conseiller.

function SignupForm() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/agent" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await agentApi.signup({ code: code.trim(), email: email.trim(), password, name: name.trim(), phone: phone.trim() });
      // Le serveur a créé l'utilisateur Supabase avec role=agent — on signe maintenant.
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      toast.success("Compte conseiller créé !");
      navigate("/agent", { replace: true });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      toast.error(msg);
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
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>Inscription</p>
          </div>
        </div>
        <Link
          to="/agent/connexion"
          className="px-3 py-1.5 rounded-full"
          style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}
        >
          Se connecter
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
        <div
          className="w-full max-w-md p-5 sm:p-6 rounded-3xl"
          style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", boxShadow: "0 8px 30px rgba(14,19,32,0.06)" }}
        >
          <h1 style={{ fontSize: "1.7rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Inscription conseiller
          </h1>
          <p className="mt-2" style={{ fontSize: "0.92rem", color: "var(--ippoo-text-muted)" }}>
            Réservé aux équipes IPPOO. Un code d'invitation est requis — votre manager vous l'a transmis.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Field icon={KeyRound} placeholder="Code d'invitation" value={code} onChange={setCode} type="text" autoComplete="off" required />
            <Field icon={User} placeholder="Votre nom complet" value={name} onChange={setName} type="text" autoComplete="name" required />
            <Field icon={Mail} placeholder="Email professionnel" value={email} onChange={setEmail} type="email" autoComplete="email" required />
            <Field icon={Phone} placeholder="Téléphone (facultatif)" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
            <Field icon={Lock} placeholder="Mot de passe (8 min.)" value={password} onChange={setPassword} type="password" autoComplete="new-password" required minLength={8} />

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white shadow-md transition-transform active:scale-[0.985] disabled:opacity-60"
              style={{ height: 52, background: "var(--accent-primary)", fontSize: "0.95rem", fontWeight: 800 }}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Créer mon compte <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div
            className="mt-5 p-3 rounded-xl"
            style={{ border: "1px solid var(--line-hairline)", background: "rgba(255,59,87,0.06)" }}
          >
            <p style={{ fontSize: "0.78rem", lineHeight: 1.5, color: "var(--ippoo-text-muted)" }}>
              À la création, un <strong style={{ color: "var(--ippoo-text)" }}>matricule unique</strong> au format <code style={{ color: "var(--accent-primary)", fontWeight: 700 }}>IPPOO-A-XXXX</code> vous est attribué. Il identifie toutes vos actions (messages, sinistres, KYC) dans l'audit.
            </p>
          </div>

          <p className="text-center mt-6" style={{ fontSize: "0.82rem", color: "var(--ippoo-text-muted)" }}>
            Pas encore conseiller ?{" "}
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
  icon: Icon, placeholder, value, onChange, type, autoComplete, required, minLength,
}: {
  icon: typeof Mail;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
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
        minLength={minLength}
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

export function AgentSignupPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SignupForm />
      </AuthProvider>
    </QueryClientProvider>
  );
}
