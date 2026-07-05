import { useState, type FormEvent } from "react";
import { X, Fingerprint, Loader2, AlertTriangle } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import { getSupabase } from "../supabaseClient";
import { api } from "../api";

export function BiometricLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const options = await api.webauthnLoginOptions(email.trim());
      const response = await startAuthentication({ optionsJSON: options });
      const { email: confirmEmail, tokenHash } = await api.webauthnLoginVerify(email.trim(), response);
      const supabase = getSupabase();
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: confirmEmail, token_hash: tokenHash, type: "magiclink" as any,
      });
      if (otpErr) throw new Error(otpErr.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur biométrique");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#FF3B57]" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900 }}>Connexion biométrique</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!supported ? (
          <p className="text-[#666]" style={{ fontSize: "0.85rem" }}>
            Votre appareil ne prend pas en charge l'authentification biométrique (WebAuthn).
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-[#666]" style={{ fontSize: "0.85rem" }}>
              Saisissez votre email puis confirmez avec votre empreinte ou Face ID.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white disabled:opacity-60"
              style={{ background: "#FF3B57", fontWeight: 800, fontSize: "0.9rem" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
              {busy ? "Vérification..." : "S'authentifier"}
            </button>
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2" style={{ fontSize: "0.82rem" }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
