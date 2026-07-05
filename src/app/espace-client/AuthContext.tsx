import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, apiFetch } from "./supabaseClient";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; name: string; phone?: string; profile?: Record<string, any>; enrollerMatricule?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

// True if the Supabase user carries the `agent` role (or `superadmin`, which
// inherits it server-side). Agents must NEVER reach the espace-client — using
// the same identifier in both spaces creates massive confusion (notifs,
// contracts, KYC, etc. would mix the conseiller's own data with their
// portfolio). The gate is enforced both at sign-in time and as a defensive
// check in the protected shell, in case a session was created elsewhere.
export function isAgentUser(user: User | null | undefined): boolean {
  if (!user) return false;
  // app_metadata is the source of truth (server-controlled, immutable via the
  // public API). user_metadata is read only for legacy agent accounts created
  // before the role moved to app_metadata.
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = (appMeta.role as string | undefined) ?? (meta.role as string | undefined);
  return role === "agent" || role === "superadmin";
}

export class AgentAccountInClientSpaceError extends Error {
  constructor() {
    super("Ce compte est un compte conseiller. Connectez-vous depuis l'espace conseiller (/agent) — l'espace client est réservé aux assurés.");
    this.name = "AgentAccountInClientSpaceError";
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error("Auth getSession error in AuthProvider initial load:", err);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [supabase]);

  // Session timeout: sign out after 30 min of inactivity
  useEffect(() => {
    if (!session) return;
    const TIMEOUT = 30 * 60 * 1000;
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        console.log("Auto sign-out after 30 min inactivity");
        supabase.auth.signOut().catch((err) => console.error("Auto signOut failed:", err));
      }, TIMEOUT);
    };
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session, supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error(`signIn error for ${email}:`, error.message);
        throw new Error(error.message);
      }
      // Refuse agent identifiers in the client space — sign them right back out
      // so the session can't leak into protected client routes.
      if (isAgentUser(data.user ?? null)) {
        await supabase.auth.signOut().catch(() => {});
        throw new AgentAccountInClientSpaceError();
      }
    },
    async signUp({ email, password, name, phone, profile, enrollerMatricule }) {
      await apiFetch("/signup", { method: "POST", body: { email, password, name, phone, profile, enrollerMatricule } });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error(`Post-signup auto signIn failed for ${email}:`, error.message);
        throw new Error(error.message);
      }
      // Defense in depth: should never happen because /signup never assigns the
      // agent role, but a leftover agent user with the same email would taint
      // the session if we didn't check.
      if (isAgentUser(data.user ?? null)) {
        await supabase.auth.signOut().catch(() => {});
        throw new AgentAccountInClientSpaceError();
      }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("signOut error:", error.message);
        throw new Error(error.message);
      }
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        reg?.active?.postMessage({ type: "IPPOO_CLEAR_OFFLINE_CACHE" });
      } catch (e) {
        console.warn("SW offline-cache flush failed:", e);
      }
    },
  }), [session, loading, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hors AuthProvider (preview Figma Make standalone, tests), on renvoie une
// valeur dégradée : session=null, loading=false, et les méthodes lèvent à
// l'usage. Cela évite que le rendu isolé d'une page protégée casse tout
// l'arbre React au lieu d'afficher proprement son état "non connecté".
const noopAuthCtx = {
  session: null,
  loading: false,
  supabase: null as any,
  signIn: async () => { throw new Error("AuthProvider absent"); },
  signOut: async () => { throw new Error("AuthProvider absent"); },
  signUp: async () => { throw new Error("AuthProvider absent"); },
  refresh: async () => {},
  clearOfflineCache: async () => {},
} as unknown as AuthContextValue;
export function useAuth() {
  return useContext(AuthContext) ?? noopAuthCtx;
}
