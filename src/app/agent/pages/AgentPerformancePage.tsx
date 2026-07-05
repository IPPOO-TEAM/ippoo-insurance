import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, CreditCard, FileText, MessageCircle, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi } from "../api";
import { formatXOF } from "../../espace-client/hooks";

type Window = 7 | 30 | 90;
type Perf = Awaited<ReturnType<typeof agentApi.performance>>;

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h} h ${m}` : `${h} h`;
}

export function AgentPerformancePage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [windowDays, setWindowDays] = useState<Window>(30);
  const [data, setData] = useState<Perf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload(d: Window = windowDays) {
    if (!token) return;
    setLoading(true); setError(null);
    try { setData(await agentApi.performance(token, d)); }
    catch (err) { setError(err instanceof Error ? err.message : "Erreur de chargement"); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(windowDays); /* eslint-disable-next-line */ }, [token, windowDays]);

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate flex items-center gap-2" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            <Activity className="w-5 h-5" /> Ma performance
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            {data?.agent?.name ? `${data.agent.name} · ${data.agent.matricule}` : "Activité personnelle"}
          </p>
        </div>
        <button
          onClick={() => reload()}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Recharger"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="flex gap-1.5 mb-3">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setWindowDays(d as Window)}
            className="flex-1 px-2 py-2 rounded-xl active:scale-[0.98] transition"
            style={{
              background: windowDays === d ? "var(--ippoo-text)" : "var(--surface-card)",
              color: windowDays === d ? "var(--surface-card)" : "var(--ippoo-text)",
              border: "1px solid var(--line-hairline)",
              fontSize: "0.85rem",
              fontWeight: 800,
              minHeight: 40,
            }}
            aria-pressed={windowDays === d}
          >
            {d} jours
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {!data ? (
        <div className="py-12 text-center" style={{ color: "var(--ippoo-text-muted)" }}>
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p style={{ fontSize: "0.85rem" }}>Chargement…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Kpi icon={CreditCard} color="#16B26A" label="Encaissements" value={formatXOF(data.payments.amount)} hint={`${data.payments.recorded} reçu(s)`} />
            <Kpi icon={FileText} color="#FF3B57" label="Contrats" value={String(data.contracts.subscribed)} hint={`+${data.contracts.renewed} renouv. · ${data.contracts.cancelled} résil.`} />
            <Kpi icon={AlertTriangle} color="#FF7A00" label="Sinistres décidés" value={String(data.claims.decided)} hint={`${data.claims.validated}✓ ${data.claims.rejected}✗ ${data.claims.settled}€`} />
            <Kpi icon={ShieldCheck} color="#1D4ED8" label="KYC tranchés" value={String(data.kyc.decided)} hint={`${data.kyc.validated}✓ ${data.kyc.rejected}✗`} />
            <Kpi icon={MessageCircle} color="#8A5A00" label="Messages envoyés" value={String(data.messages.sent)} />
            <Kpi icon={Timer} color="#0F7A47" label="Temps de réponse moyen" value={formatDuration(data.messages.avgResponseSec)} />
          </div>

          <p className="text-center px-2" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)" }}>
            <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-1" />
            Période : {new Date(data.since).toLocaleDateString("fr-FR")} → aujourd'hui · généré à {new Date(data.generatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, color, label, value, hint }: { icon: typeof Activity; color: string; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1A`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="truncate" style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ippoo-text-muted)" }}>{label}</p>
      </div>
      <p className="mt-1.5 truncate" style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.015em" }}>{value}</p>
      {hint && <p className="truncate" style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)", fontWeight: 600 }}>{hint}</p>}
    </div>
  );
}
