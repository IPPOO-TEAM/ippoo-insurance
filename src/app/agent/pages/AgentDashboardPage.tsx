import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  RefreshCw, MessageCircle, FileWarning, ShieldCheck, Wallet, Users, FilePlus2,
  TrendingUp, AlertCircle, ListTodo, Activity, type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi } from "../api";
import { formatXOF } from "../../espace-client/hooks";
import { getSupabase } from "../../espace-client/supabaseClient";
import { AgentPromosBriefing } from "../components/AgentPromosBriefing";

type Stats = Awaited<ReturnType<typeof agentApi.dashboard>>;

export function AgentDashboardPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"mine" | "all">("mine");

  async function reload() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agentApi.dashboard(token);
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  // Realtime : on rafraîchit les KPIs quand un paiement, un sinistre ou une
  // assignation change. Debounce 2 s pour absorber les rafales sans rafraîchir
  // 10 fois à la suite.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => reloadRef.current(), 2000);
    };
    const ch1 = sb.channel("payments:live").on("broadcast", { event: "payments:dirty" }, bump).subscribe();
    const ch2 = sb.channel("assignments:live").on("broadcast", { event: "assignments:dirty" }, bump).subscribe();
    const id = setInterval(() => reloadRef.current(), 60_000);
    return () => {
      if (t) clearTimeout(t);
      clearInterval(id);
      sb.removeChannel(ch1);
      sb.removeChannel(ch2);
    };
  }, []);

  const k = stats ? (scope === "mine" ? stats.mine : stats.all) : null;

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Accueil
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            {stats ? `Portefeuille : ${stats.portfolioSize} client(s) · MAJ ${new Date(stats.generatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Vue du jour"}
          </p>
        </div>
        <button
          onClick={reload}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Recharger"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div
        className="inline-flex p-1 rounded-2xl mb-3"
        style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
        role="tablist"
      >
        {(["mine", "all"] as const).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              role="tab"
              aria-selected={active}
              className="px-3 py-1.5 rounded-xl transition"
              style={{
                background: active ? "var(--ippoo-text)" : "transparent",
                color: active ? "var(--surface-card)" : "var(--ippoo-text-muted)",
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              {s === "mine" ? "Mon portefeuille" : "Tous"}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {!stats && loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 animate-pulse"
              style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", minHeight: 86 }}
            />
          ))}
        </div>
      ) : k ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Kpi to="/agent" icon={MessageCircle} label="Messages non lus" value={String(k.unreadMessages)} color="#FF3B57" highlight={k.unreadMessages > 0} />
            <Kpi to="/agent/sinistres" icon={FileWarning} label="Sinistres ouverts" value={String(k.claimsOpen)} color="#FF7A00" highlight={k.claimsOpen > 0} />
            <Kpi to="/agent/kyc" icon={ShieldCheck} label="KYC à valider" value={String(k.kycPending)} color="#5B34D4" highlight={k.kycPending > 0} />
            <Kpi to="/agent/paiements" icon={Wallet} label="Paiements en attente" value={String(k.paymentsPending)} color="#8A5A00" highlight={k.paymentsPending > 0} />
            <Kpi to="/agent/paiements" icon={TrendingUp} label="Encaissé aujourd'hui" value={formatXOF(k.paidTodayAmount)} color="#16B26A" />
            <Kpi to="/agent/portefeuille" icon={FilePlus2} label="Contrats du jour" value={String(k.contractsToday)} color="#0E7AB6" sub={scope === "mine" ? `dont ${stats.mine.contractsBySelfToday} par moi` : undefined} />
          </div>

          {scope === "all" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Kpi to="/agent" icon={MessageCircle} label="Conversations ouvertes" value={String(stats.all.openConversations)} color="#0E1320" />
              <Kpi to="/agent/portefeuille" icon={Users} label="Mon portefeuille" value={String(stats.portfolioSize)} color="#0E1320" />
            </div>
          )}

          {scope === "mine" && k.unreadMessages === 0 && k.claimsOpen === 0 && k.kycPending === 0 && k.paymentsPending === 0 && (
            <div
              className="mt-4 rounded-2xl p-4 flex items-start gap-2.5"
              style={{ background: "rgba(22,178,106,0.10)", border: "1px solid rgba(22,178,106,0.25)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#0F7A47" }} />
              <div>
                <p style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0F7A47" }}>Tout est à jour</p>
                <p style={{ fontSize: "0.78rem", color: "#0F7A47", opacity: 0.85 }}>
                  Aucune action immédiate requise sur votre portefeuille.
                </p>
              </div>
            </div>
          )}

          <AgentPromosBriefing />

          <section className="mt-4">
            <p className="px-1 mb-2" style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ippoo-text-muted)" }}>
              Raccourcis
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ShortcutLink to="/agent/taches" label="Mes tâches" icon={ListTodo} />
              <ShortcutLink to="/agent/portefeuille" label="Mon portefeuille" icon={Users} />
              <ShortcutLink to="/agent/performance" label="Ma performance" icon={Activity} />
              <ShortcutLink to="/agent/modeles" label="Modèles de réponse" icon={MessageCircle} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({
  to, icon: Icon, label, value, color, highlight, sub,
}: { to: string; icon: LucideIcon; label: string; value: string; color: string; highlight?: boolean; sub?: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-3 active:scale-[0.98] transition"
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${highlight ? color : "var(--line-hairline)"}`,
        boxShadow: highlight ? `0 4px 14px ${color}26` : "none",
        display: "block",
        minHeight: 86,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1A`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="truncate" style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ippoo-text-muted)" }}>
          {label}
        </p>
      </div>
      <p className="mt-1.5 truncate" style={{ fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.02em", color: highlight ? color : "var(--ippoo-text)" }}>
        {value}
      </p>
      {sub && (
        <p className="truncate" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
          {sub}
        </p>
      )}
    </Link>
  );
}

function ShortcutLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      to={to}
      className="rounded-2xl px-3 py-2.5 flex items-center gap-2 active:scale-[0.98] transition"
      style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", fontSize: "0.82rem", fontWeight: 700 }}
    >
      <Icon className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
