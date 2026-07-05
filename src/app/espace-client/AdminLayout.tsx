import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ScrollToTop } from "../components/ScrollToTop";
import {
  ShieldAlert, Loader2, LogOut, Eye, EyeOff,
  LayoutDashboard, FileText, Users, Wallet, MessageCircle, Megaphone, Image as ImageIcon, MapPin, Globe, History, ShieldCheck, Tag,
} from "lucide-react";
import logoIppoo from "../../imports/Plan_de_travail72-4.png";
import { Toaster } from "sonner";
import { queryClient } from "./queryClient";
import { api } from "./api";
import { SkeletonStyles } from "./Skeleton";

const STORAGE_KEY = "ippoo:admin:session";
type AdminSession = { token: string; username: string; role?: "superadmin" | "operator" | "support"; expiresAt: number };

type LoginResult = { kind: "session" } | { kind: "2fa"; challenge: string };
type AdminAuthValue = {
  session: AdminSession | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  verify2fa: (challenge: string, code: string) => Promise<void>;
  logout: () => void;
};
// Valeur par défaut sûre : permet aux tabs exportés (KycTab, PromosTab, etc.)
// d'être rendus isolément (preview Figma Make, tests unitaires) hors du
// routeur sans crash. En production, AdminAuthProvider remplace cette valeur ;
// hors provider, on tombe sur session=null → l'écran de login s'affiche.
// (Sentinel HMR : ne pas réintroduire un throw ici.)
const noopAuth: AdminAuthValue = {
  session: null,
  login: async () => { throw new Error("Provider absent : navigation /admin requise"); },
  verify2fa: async () => { throw new Error("Provider absent : navigation /admin requise"); },
  logout: () => {},
};
const AdminAuthCtx = createContext<AdminAuthValue>(noopAuth);
export function useAdminAuth() {
  return useContext(AdminAuthCtx);
}

// Helper UI : true si le compte courant a au moins un des rôles requis. Sert
// à masquer les boutons destructifs (broadcast, billing, promos...) pour les
// rôles operator / support sans dupliquer la matrice de droits côté client.
export function useAdminHasRole(...allowed: ("superadmin" | "operator" | "support")[]) {
  const { session } = useAdminAuth();
  const role = session?.role ?? "superadmin"; // legacy sessions = superadmin
  return allowed.includes(role);
}

function loadSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (!s.token || !s.expiresAt || Date.now() > s.expiresAt) return null;
    return s;
  } catch { return null; }
}

function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => loadSession());

  useEffect(() => {
    if (!session) return;
    const ms = Math.max(1000, session.expiresAt - Date.now());
    const t = window.setTimeout(() => {
      setSession(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }, ms);
    return () => window.clearTimeout(t);
  }, [session?.expiresAt]);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const res = await api.adminLogin(username, password);
    if (res.requires2FA && res.challenge) return { kind: "2fa", challenge: res.challenge };
    if (!res.token || !res.username || !res.expiresAt) throw new Error("Réponse invalide");
    const next: AdminSession = { token: res.token, username: res.username, role: res.role, expiresAt: res.expiresAt };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setSession(next);
    return { kind: "session" };
  };
  const verify2fa = async (challenge: string, code: string) => {
    const res = await api.adminLogin2fa(challenge, code);
    const next: AdminSession = { token: res.token, username: res.username, role: res.role, expiresAt: res.expiresAt };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setSession(next);
  };
  const logout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSession(null);
  };

  return <AdminAuthCtx.Provider value={{ session, login, verify2fa, logout }}>{children}</AdminAuthCtx.Provider>;
}

function AdminLogin() {
  const { login, verify2fa } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (challenge) {
        await verify2fa(challenge, code.trim());
      } else {
        const r = await login(username.trim(), password);
        if (r.kind === "2fa") { setChallenge(r.challenge); setCode(""); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg,#0E1320 0%, #1a1f2e 100%)" }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF3B57] to-[#FF7A00] text-white flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-center" style={{ fontSize: "1.35rem", fontWeight: 900 }}>Back office IPPOO</h1>
        <p className="text-center text-[#666] mt-1 mb-6" style={{ fontSize: "0.82rem" }}>
          Accès réservé à l'équipe d'administration.
        </p>

        {!challenge ? (
          <>
            <label className="block mb-3">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Identifiant</span>
              <input
                type="text" autoComplete="username" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-black/10"
                style={{ fontSize: "0.9rem" }}
              />
            </label>
            <label className="block mb-4">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Mot de passe</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-black/10"
                  style={{ fontSize: "0.9rem" }}
                />
                <button type="button" onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#888]" aria-label="Afficher/masquer">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          </>
        ) : (
          <label className="block mb-4">
            <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Code à 6 chiffres (TOTP)</span>
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} autoFocus
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 tracking-[0.3em] text-center"
              style={{ fontSize: "1.1rem", fontWeight: 800 }}
              placeholder="••••••"
            />
            <button type="button" onClick={() => { setChallenge(null); setCode(""); setError(null); }}
              className="mt-2 text-[#666] hover:text-[#0E1320]" style={{ fontSize: "0.74rem", fontWeight: 700 }}>
              ← Retour à l'identifiant
            </button>
          </label>
        )}

        {error && (
          <p className="mb-3 px-3 py-2 rounded-lg bg-[#FFE5EB] text-[#C0263A]" style={{ fontSize: "0.8rem" }}>{error}</p>
        )}

        <button type="submit" disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white disabled:opacity-50"
          style={{ background: "#0E1320", fontSize: "0.9rem", fontWeight: 800 }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Connexion
        </button>

        <p className="text-center text-[#888] mt-5" style={{ fontSize: "0.72rem" }}>
          Authentification isolée — aucun lien avec la base des clients.
        </p>
      </form>
    </div>
  );
}

const ADMIN_NAV: { to: string; label: string; icon: any; end?: boolean }[] = [
  { to: "/admin", end: true, label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: "/admin/sinistres", label: "Sinistres", icon: FileText },
  { to: "/admin/membres", label: "Membres", icon: Users },
  { to: "/admin/contrats", label: "Contrats", icon: FileText },
  { to: "/admin/paiements", label: "Paiements", icon: Wallet },
  { to: "/admin/messagerie", label: "Messagerie", icon: MessageCircle },
  { to: "/admin/agents", label: "Conseillers", icon: Users },
  { to: "/admin/kyc", label: "KYC", icon: ShieldCheck },
  { to: "/admin/diffusion", label: "Diffusion", icon: Megaphone },
  { to: "/admin/carrousel", label: "Carrousel", icon: ImageIcon },
  { to: "/admin/tarifs", label: "Tarifs & fiches", icon: Tag },
  { to: "/admin/partenaires", label: "Partenaires", icon: MapPin },
  { to: "/admin/contenu", label: "Contenu du site", icon: Globe },
  { to: "/admin/journal", label: "Journal d'activité", icon: History },
];

function AdminShell() {
  const { session, logout } = useAdminAuth();
  if (!session) return <AdminLogin />;
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">
      <ScrollToTop />
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen bg-[#0E1320] text-white">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src={logoIppoo} alt="IPPOO" className="w-9 h-9 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.01em" }}>IPPOO</p>
            <p className="text-white/55 truncate" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", fontWeight: 700 }}>BACK OFFICE</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {ADMIN_NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? "bg-white text-[#0E1320]" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
              style={{ fontSize: "0.82rem", fontWeight: 700 }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={isActive ? { background: "linear-gradient(135deg,#FF3B57,#FF7A00)", color: "white" } : { background: "rgba(255,255,255,0.08)" }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#FF3B57,#FF7A00)" }}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: "0.78rem", fontWeight: 800 }}>{session.username}</p>
              <p className="text-white/50 capitalize" style={{ fontSize: "0.66rem" }}>{session.role ?? "admin"}</p>
            </div>
            <button onClick={logout} title="Déconnexion" className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-[#0E1320] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <img src={logoIppoo} alt="IPPOO" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 900, letterSpacing: "-0.01em" }}>IPPOO · Back office</p>
              <p className="text-white/60" style={{ fontSize: "0.68rem" }}>{session.username}</p>
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
            <LogOut className="w-3.5 h-3.5" /> Sortir
          </button>
        </header>
        <nav className="lg:hidden bg-white border-b border-black/5 px-2 py-2 flex gap-1 overflow-x-auto sticky top-[56px] z-20">
          {ADMIN_NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition ${
                  isActive ? "bg-[#0E1320] text-white" : "text-[#0E1320] hover:bg-black/5"
                }`
              }
              style={{ fontSize: "0.76rem", fontWeight: 700 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-center"
        expand={false}
        gap={8}
        offset={16}
        visibleToasts={3}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: "ippoo-toast",
            title: "ippoo-toast-title",
            description: "ippoo-toast-desc",
            icon: "ippoo-toast-icon",
            closeButton: "ippoo-toast-close",
          },
        }}
      />
      <SkeletonStyles />
    </div>
  );
}

export function useAdminData<T>(fetcher: (adminToken: string) => Promise<T>) {
  const { session, logout } = useAdminAuth();
  const token = session?.token;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(token);
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      if (/admin-token/i.test(msg)) logout();
    } finally {
      setLoading(false);
    }
  }, [token, fetcher, logout]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

export function AdminLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AdminShell />
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
