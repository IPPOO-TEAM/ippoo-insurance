import { useState } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { agentApi, setStoredAgent2FAToken } from "../api";

// Écran de challenge TOTP affiché à l'entrée de la console conseiller quand
// le compte a activé le second facteur. Pas de bypass : on bloque tout
// l'arbre /agent jusqu'à présentation d'un code valide. Le token de session
// renvoyé est stocké en sessionStorage et automatiquement injecté par
// apiFetch sur chaque appel /agent/*.
export function Agent2FAChallenge({
  token,
  onVerified,
  onSignOut,
  agentEmail,
}: {
  token: string;
  onVerified: () => void;
  onSignOut: () => void;
  agentEmail: string;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) { setError("Saisissez les 6 chiffres affichés par votre application."); return; }
    setSubmitting(true);
    try {
      const { twoFactorToken } = await agentApi.twoFactor.verify(token, clean);
      setStoredAgent2FAToken(twoFactorToken);
      onVerified();
    } catch (err: any) {
      setError(err?.message === "invalid-code" ? "Code incorrect ou expiré." : (err?.message ?? "Vérification impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--surface-app)" }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
        <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center" style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)" }}>
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 900, letterSpacing: "-0.015em" }}>
          Vérification en deux étapes
        </h1>
        <p className="mt-1.5" style={{ fontSize: "0.85rem", color: "var(--ippoo-text-muted)" }}>
          Saisissez le code à 6 chiffres affiché par votre application d'authentification pour <strong>{agentEmail}</strong>.
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-4 w-full rounded-xl px-4 py-3 tracking-[0.4em] text-center"
          style={{ fontSize: "1.4rem", fontWeight: 700, background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
          placeholder="••••••"
        />
        {error && (
          <p className="mt-2" style={{ fontSize: "0.78rem", color: "#D63B3B" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="mt-4 w-full py-3 rounded-xl text-white disabled:opacity-50"
          style={{ background: "var(--accent-primary)", fontSize: "0.92rem", fontWeight: 800 }}
        >
          {submitting ? "Vérification…" : "Valider"}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 w-full py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5"
          style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
