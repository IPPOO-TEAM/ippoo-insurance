import { useEffect, useState, type ReactNode } from "react";
import { Fingerprint, Loader2, AlertTriangle, LogOut } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useAuth } from "./AuthContext";
import { api } from "./api";

/**
 * Optional biometric lock screen — overlays the app when:
 *   1. The user is logged in
 *   2. WebAuthn credentials are registered for this account
 *   3. The session has not been unlocked yet in this tab
 *
 * The user must present their biometric to access the app. This is a
 * soft re-auth gate using existing WebAuthn credentials; it does not
 * issue a new Supabase session — it just gates the UI.
 *
 * Honors a "skip" preference (toggleable in Paramètres).
 */
const UNLOCK_KEY = "ippoo:applock:unlocked";
const DISABLE_KEY = "ippoo:applock:disabled";

export function isAppLockDisabled() {
  try { return localStorage.getItem(DISABLE_KEY) === "1"; } catch { return false; }
}
export function setAppLockDisabled(v: boolean) {
  try { localStorage.setItem(DISABLE_KEY, v ? "1" : "0"); } catch {}
}

export function AppLock({ children }: { children: ReactNode }) {
  const { user, session, signOut } = useAuth();
  const [check, setCheck] = useState<"loading" | "needed" | "unlocked" | "skip">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !session?.access_token) { setCheck("skip"); return; }
      if (isAppLockDisabled()) { setCheck("skip"); return; }
      try {
        if (sessionStorage.getItem(UNLOCK_KEY) === "1") { setCheck("unlocked"); return; }
      } catch {}
      try {
        const status = await api.webauthnStatus(session.access_token);
        if (cancelled) return;
        if ((status?.count ?? 0) > 0) setCheck("needed");
        else setCheck("skip");
      } catch {
        if (!cancelled) setCheck("skip");
      }
    })();
    return () => { cancelled = true; };
  }, [user, session?.access_token]);

  if (check === "loading") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "var(--surface-app)" }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
      </div>
    );
  }
  if (check === "needed") {
    return <LockScreen onUnlock={() => { try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch {}; setCheck("unlocked"); }} onSignOut={signOut} email={user?.email ?? ""} />;
  }
  return <>{children}</>;
}

function LockScreen({ onUnlock, onSignOut, email }: { onUnlock: () => void; onSignOut: () => void; email: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attemptUnlock() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const options = await api.webauthnLoginOptions(email);
      await startAuthentication({ optionsJSON: options });
      // Local authenticator validated user identity — gate passes.
      onUnlock();
    } catch (err: any) {
      const msg = err?.message ?? "Authentification annulée";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void attemptUnlock(); /* eslint-disable-next-line */ }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "var(--surface-app)", padding: "var(--space-6)" }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: "88px", height: "88px",
          borderRadius: "9999px",
          background: "var(--ippoo-red-light)",
          color: "var(--accent-primary)",
          marginBottom: "var(--space-5)",
        }}
      >
        <Fingerprint className="w-10 h-10" strokeWidth={1.6} />
      </div>
      <h1 className="t-title2" style={{ textAlign: "center" }}>IPPOO est verrouillé</h1>
      <p className="t-callout t-muted" style={{ textAlign: "center", marginTop: "8px", maxWidth: "320px" }}>
        Confirmez votre identité avec votre empreinte ou Face ID pour accéder à votre espace.
      </p>
      <button
        type="button"
        onClick={attemptUnlock}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
        style={{
          marginTop: "var(--space-6)",
          minHeight: "50px",
          padding: "0 24px",
          borderRadius: "var(--radius-sm)",
          background: "var(--accent-primary)",
          color: "var(--accent-on-primary)",
          fontSize: "var(--type-headline)",
          fontWeight: 600,
        }}
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
        {busy ? "Vérification…" : "Déverrouiller"}
      </button>
      {error && (
        <div
          className="flex items-start gap-2"
          style={{
            marginTop: "var(--space-4)",
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--state-danger-bg)",
            color: "var(--state-danger)",
            fontSize: "var(--type-footnote)",
            maxWidth: "320px",
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-1.5 t-subhead t-muted active:opacity-60"
        style={{ marginTop: "var(--space-8)" }}
      >
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  );
}
