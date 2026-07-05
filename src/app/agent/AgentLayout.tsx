import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Shield, LogOut, MessageCircle, Circle, FileWarning, ShieldCheck, Wallet, Users, MessageSquareText, LayoutDashboard, Search } from "lucide-react";
import { AuthProvider, useAuth } from "../espace-client/AuthContext";
import { queryClient } from "../espace-client/queryClient";
import { agentApi, getStoredAgent2FAToken, setStoredAgent2FAToken, type AgentMe, type AgentTwoFactor } from "./api";
import { GlobalSearch } from "./components/GlobalSearch";
import { AgentNotifBell } from "./components/AgentNotifBell";
import { AgentInboxNotifier } from "./components/AgentInboxNotifier";
import { AgentInboxHistoryBell } from "./components/AgentInboxHistoryBell";
import { Agent2FAChallenge } from "./components/Agent2FAChallenge";
import { OfflineBanner } from "../espace-client/components/OfflineBanner";
import { enqueue as enqueueOffline, isOnline as isQueueOnline } from "../espace-client/offlineQueue";
import ippooLogo from "../../imports/FAV_IPPOO.png";

// Console conseillers IPPOO. Même langage visuel que l'app client (surface
// claire, accent rouge IPPOO, mêmes tokens design) pour que la marque reste
// cohérente. Le statut « conseiller » est marqué par un bandeau matricule
// dans le header — pas par un thème séparé.

function AgentShell() {
  const { user, loading, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<AgentMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [online, setOnline] = useState(false);
  const [pauseSince, setPauseSince] = useState<number | null>(null);
  const [pauseTick, setPauseTick] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [twoFactor, setTwoFactor] = useState<AgentTwoFactor | null>(null);
  const accessToken = session?.access_token ?? null;

  // Cmd/Ctrl+K ouvre la recherche globale partout dans la console.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { setChecking(false); return; }
    let cancelled = false;
    (async () => {
      try {
        if (!accessToken) { setForbidden(true); return; }
        const res = await agentApi.me(accessToken);
        if (cancelled) return;
        if (res.isAgent && res.agent) {
          setMe(res.agent);
          setTwoFactor(res.twoFactor ?? { enrolled: false, verified: true, required: false });
          // Hydrate persisted presence so the toggle reflects the real
          // server state (and not just "online" by default on every reload).
          try {
            const p = await agentApi.getPresence(accessToken);
            if (!cancelled) {
              const isOnline = p.presence?.status === "online";
              setOnline(isOnline);
              if (!isOnline) {
                // Restore pause start from localStorage if previously stored,
                // else seed with last presence update so the duration is accurate
                // across reloads instead of resetting to 0.
                const stored = Number(localStorage.getItem("ippoo:agent:pauseSince") ?? "0");
                const seed = stored || (p.presence?.updatedAt ? Date.parse(p.presence.updatedAt) : Date.now());
                setPauseSince(seed);
              }
            }
          } catch (e) {
            console.log("presence fetch failed:", e);
          }
        }
        else setForbidden(true);
      } catch (err) {
        // 403 here is expected when a non-agent user lands on /agent —
        // the Accès refusé screen below handles it. Only log truly unexpected
        // failures (network, 5xx).
        const status = (err as any)?.status;
        if (status !== 401 && status !== 403) console.warn("Agent role check failed:", err);
        if (!cancelled) setForbidden(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, accessToken]);

  // Heartbeat presence while online so admins / future ticket router know
  // this agent is still actively connected. 30s cadence; server-side
  // consumers consider presence stale after 90s.
  useEffect(() => {
    if (!accessToken || !online) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      agentApi.setPresence(accessToken, true, { silent: true }).catch(() => { /* heartbeat best-effort */ });
    };
    const id = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [accessToken, online]);

  async function togglePresence() {
    const next = !online;
    setOnline(next); // optimistic
    if (next) {
      setPauseSince(null);
      try { localStorage.removeItem("ippoo:agent:pauseSince"); } catch { /* ignore */ }
    } else {
      const now = Date.now();
      setPauseSince(now);
      try { localStorage.setItem("ippoo:agent:pauseSince", String(now)); } catch { /* ignore */ }
    }
    if (!accessToken) return;
    // A3 — Si l'agent est hors-ligne, enqueue la mise à jour présence pour
    // qu'elle parte au prochain retour réseau au lieu d'échouer silencieusement.
    if (!isQueueOnline()) {
      enqueueOffline({
        method: "POST",
        path: "/agent/presence",
        body: { online: next },
        token: accessToken,
        label: next ? "Repasser en ligne" : "Passer en pause",
      });
      return;
    }
    try {
      await agentApi.setPresence(accessToken, next);
    } catch (e) {
      console.log("presence toggle failed:", e);
      setOnline(!next); // rollback
    }
  }

  // A15 — Auto-logout après 30 min d'inactivité. Les conseillers
  // manipulent des décisions sinistres / KYC ; un poste oublié sans verrou
  // serait une vraie fuite. Le timer se reset à chaque interaction utilisateur.
  useEffect(() => {
    if (!user) return;
    const IDLE_MS = 30 * 60_000;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ["mousedown", "keydown", "touchstart", "scroll", "focus"] as const;
    for (const e of events) window.addEventListener(e, bump, { passive: true });
    const id = window.setInterval(async () => {
      if (Date.now() - last < IDLE_MS) return;
      // Idle dépassé : on coupe la session.
      try { if (accessToken) await agentApi.setPresence(accessToken, false); } catch { /* best-effort */ }
      setStoredAgent2FAToken(null);
      await signOut();
      navigate("/agent/connexion?idle=1");
    }, 60_000);
    return () => {
      clearInterval(id);
      for (const e of events) window.removeEventListener(e, bump);
    };
  }, [user, accessToken, signOut, navigate]);

  // Tick to refresh "pause depuis X" label every 30s without re-rendering
  // the whole layout on every animation frame.
  useEffect(() => {
    if (online || !pauseSince) return;
    const id = setInterval(() => setPauseTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [online, pauseSince]);

  function formatPauseDuration(since: number): string {
    const mins = Math.max(0, Math.floor((Date.now() - since) / 60_000));
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} h` : `${h} h ${m}`;
  }
  // Touch pauseTick reference so React lint doesn't drop the dep.
  void pauseTick;

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-app)" }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "4px solid var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/agent/connexion?next=/agent" replace />;
  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--surface-app)", color: "var(--ippoo-text)" }}>
        <div className="max-w-md text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--state-warn-bg, #FFE6CC)", color: "var(--accent-primary)" }}
          >
            <Shield className="w-7 h-7" />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Accès conseiller refusé
          </h1>
          <p className="mt-2" style={{ fontSize: "0.92rem", color: "var(--ippoo-text-muted)" }}>
            Votre compte n'a pas le rôle <code>agent</code>. Si vous êtes un nouveau
            conseiller, créez votre compte ici. Sinon, demandez à votre manager de
            vous transmettre un code d'invitation.
          </p>
          <button
            onClick={() => navigate("/agent/inscription")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white"
            style={{ fontSize: "0.88rem", fontWeight: 800, background: "var(--accent-primary)" }}
          >
            Créer un compte conseiller
          </button>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={async () => { setStoredAgent2FAToken(null); await signOut(); navigate("/agent/connexion"); }}
              className="px-4 py-2 rounded-xl"
              style={{ fontSize: "0.85rem", fontWeight: 700, border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
            >
              Changer de compte
            </button>
            <button
              onClick={() => navigate("/espace-client")}
              className="px-4 py-2 rounded-xl"
              style={{ fontSize: "0.85rem", fontWeight: 700, border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
            >
              Espace client
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate 2FA : si le conseiller a activé un second facteur et que la session
  // navigateur n'a pas encore présenté de code valide, on bloque toute la
  // console derrière l'écran de challenge.
  if (twoFactor?.enrolled && !twoFactor.verified && accessToken) {
    return (
      <Agent2FAChallenge
        token={accessToken}
        agentEmail={me?.email ?? user.email ?? ""}
        onVerified={() => setTwoFactor((s) => (s ? { ...s, verified: true } : s))}
        onSignOut={async () => {
          setStoredAgent2FAToken(null);
          await signOut();
          navigate("/agent/connexion");
        }}
      />
    );
  }

  const tabs = [
    { to: "/agent", end: true, label: "Accueil", Icon: LayoutDashboard },
    { to: "/agent/inbox", end: false, label: "Inbox", Icon: MessageCircle },
    { to: "/agent/sinistres", end: false, label: "Sinistres", Icon: FileWarning },
    { to: "/agent/kyc", end: false, label: "KYC", Icon: ShieldCheck },
    { to: "/agent/paiements", end: false, label: "Paiements", Icon: Wallet },
    { to: "/agent/portefeuille", end: false, label: "Portef.", Icon: Users },
    { to: "/agent/modeles", end: false, label: "Modèles", Icon: MessageSquareText },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--surface-app)",
        color: "var(--ippoo-text)",
        // iOS-style font stack pour un rendu plus "natif" côté mobile.
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* A18 — Tutoriel d'onboarding au premier login. */}
      <AgentOnboarding agentId={me?.id} />

      {/* A3 — File d'actions hors-ligne agent. Boote la queue commune
          (startOfflineQueueLoop) et affiche la bannière + le détail des
          actions en attente lorsque le conseiller perd la connexion. */}
      <OfflineBanner />

      {/* Header compact, style "navigation bar" iOS / Material : juste
          identité conseiller + toggle présence + logout. Le reste de la nav
          est déplacé dans la bottom bar (cf. plus bas). */}
      <header
        className="sticky top-0 z-30"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
          paddingBottom: 10,
          paddingLeft: "max(env(safe-area-inset-left, 0px), 16px)",
          paddingRight: "max(env(safe-area-inset-right, 0px), 16px)",
          background: "color-mix(in srgb, var(--surface-card) 88%, transparent)",
          backdropFilter: "saturate(160%) blur(14px)",
          WebkitBackdropFilter: "saturate(160%) blur(14px)",
          borderBottom: "1px solid var(--line-hairline)",
        }}
      >
        <div className="mx-auto w-full max-w-2xl flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/agent/profil")}
            className="flex items-center gap-2.5 min-w-0 text-left active:scale-95 transition"
            title="Mon profil"
          >
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "white", boxShadow: "0 3px 10px rgba(255,59,87,0.18)" }}
            >
              <img src={ippooLogo} alt="IPPOO" className="w-full h-full object-contain p-1" />
            </div>
            <div className="min-w-0 leading-tight">
              <p
                className="truncate"
                style={{ fontSize: "0.92rem", fontWeight: 800, letterSpacing: "-0.015em", color: "var(--ippoo-text)" }}
              >
                {me?.username ?? user.email}
              </p>
              {me?.matricule && (
                <span
                  className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md"
                  style={{
                    background: "rgba(255,59,87,0.10)",
                    color: "var(--accent-primary)",
                    fontSize: "0.64rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                  }}
                  title="Matricule conseiller"
                >
                  {me.matricule}
                </span>
              )}
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            {accessToken && <AgentNotifBell token={accessToken} matricule={me?.matricule} />}
            <AgentInboxHistoryBell />
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
              style={{ color: "var(--ippoo-text-muted)", background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
              title="Rechercher un client (Ctrl+K)"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={togglePresence}
              className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full transition active:scale-95"
              style={{
                border: `1px solid ${online ? "rgba(22,178,106,0.30)" : "var(--line-hairline)"}`,
                background: online ? "rgba(22,178,106,0.12)" : "var(--surface-app)",
                color: online ? "#0F7A47" : "var(--ippoo-text-muted)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.01em",
              }}
              aria-pressed={online}
              title={online ? "En ligne — vous recevez des tickets" : `En pause depuis ${pauseSince ? formatPauseDuration(pauseSince) : "—"} — pas de nouveaux tickets`}
            >
              <span className="relative inline-flex w-2 h-2">
                <span
                  className={`absolute inset-0 rounded-full ${online ? "animate-ping" : ""}`}
                  style={{ background: online ? "#16B26A" : "#FFB020", opacity: online ? 0.5 : 0 }}
                />
                <Circle className="w-2 h-2 relative" fill={online ? "#16B26A" : "#FFB020"} stroke="none" />
              </span>
              <span>{online ? "En ligne" : `Pause · ${pauseSince ? formatPauseDuration(pauseSince) : "0 min"}`}</span>
            </button>
            <button
              onClick={async () => {
                if (accessToken) {
                  try { await agentApi.setPresence(accessToken, false); } catch { /* best-effort */ }
                }
                setStoredAgent2FAToken(null);
                await signOut();
                navigate("/agent/connexion");
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
              style={{ color: "var(--ippoo-text-muted)", background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 min-w-0 w-full"
        style={{
          // Reserve room for the floating bottom bar (height + safe-area).
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
        }}
      >
        <div className="mx-auto w-full max-w-2xl">
          <Outlet context={{ me, online }} />
        </div>
      </main>

      {/* Bottom app bar — pattern natif iOS/Android. Cible tactile 56–64px,
          icône + label, indicateur actif coloré accent. Safe-area en bas
          pour éviter le home indicator. Couche backdrop-blur pour la
          sensation "frosted glass" iOS. */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          background: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
          backdropFilter: "saturate(160%) blur(18px)",
          WebkitBackdropFilter: "saturate(160%) blur(18px)",
          borderTop: "1px solid var(--line-hairline)",
          boxShadow: "0 -4px 24px rgba(14,19,32,0.06)",
        }}
      >
        {/* Scroll horizontal natif (overflow-x-auto + snap) pour que tous les
            onglets soient atteignables même quand ils dépassent la largeur
            de l'écran. Chaque onglet a une largeur min fixe + padding
            horizontal généreux pour respirer. */}
        <div
          className="mx-auto w-full max-w-2xl overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity" }}
        >
          <style>{`nav > div::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex items-stretch px-2 gap-1">
            {tabs.map(({ to, end, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-2 transition active:scale-95"
                style={({ isActive }) => ({
                  color: isActive ? "var(--accent-primary)" : "var(--ippoo-text-muted)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  minHeight: 60,
                  minWidth: 72,
                  scrollSnapAlign: "center",
                })}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="flex items-center justify-center transition"
                      style={{
                        width: 48,
                        height: 30,
                        borderRadius: 15,
                        background: isActive ? "rgba(255,59,87,0.14)" : "transparent",
                      }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {searchOpen && accessToken && (
        <GlobalSearch token={accessToken} onClose={() => setSearchOpen(false)} />
      )}

      <AgentInboxNotifier online={online} />

      <Toaster position="top-center" expand={false} visibleToasts={3} />
    </div>
  );
}

// A18 — Onboarding minimal. Une seule fois par agent (clé localStorage par
// uid), affiche un panneau récapitulatif des 4 actions clés : présence, 2FA,
// notifs push, recherche client. Pas de tour interactif élaboré : on respecte
// le temps du conseiller — un encart, un bouton "Compris".
function AgentOnboarding({ agentId }: { agentId?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!agentId) return;
    try {
      const seen = localStorage.getItem(`ippoo:agent:onboarded:${agentId}`);
      if (!seen) setOpen(true);
    } catch { /* noop */ }
  }, [agentId]);
  if (!open) return null;
  const dismiss = () => {
    try { if (agentId) localStorage.setItem(`ippoo:agent:onboarded:${agentId}`, "1"); } catch { /* noop */ }
    setOpen(false);
  };
  return (
    <div role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,15,20,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 22, maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: 10 }}>Bienvenue dans la console IPPOO</h2>
        <ol style={{ fontSize: "0.9rem", lineHeight: 1.55, paddingLeft: 18 }}>
          <li>Bascule en <b>En ligne</b> dans l'en-tête pour recevoir des tickets clients.</li>
          <li>Active la <b>2FA TOTP</b> dans ton profil — obligatoire pour décider d'un sinistre ou d'une KYC.</li>
          <li>Active les <b>notifications push</b> pour être alerté hors-onglet d'un nouveau message ou d'une décision admin.</li>
          <li>Utilise <b>Cmd/Ctrl+K</b> ou la loupe pour ouvrir une fiche client en 1 frappe.</li>
        </ol>
        <button onClick={dismiss} style={{
          marginTop: 16, width: "100%", padding: "12px 16px",
          borderRadius: 12, background: "#FF3B57",
          color: "#fff", fontWeight: 800, border: "none", cursor: "pointer",
        }}>Compris, commencer</button>
      </div>
    </div>
  );
}

export function AgentLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgentShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}
