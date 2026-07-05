import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { Users, FileText, Wallet, RefreshCw, Loader2, AlertTriangle, Clock, ShieldAlert, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth, useAdminData } from "../AdminLayout";
import { getSupabase } from "../../espace-client/supabaseClient";
import { formatXOF } from "../../espace-client/hooks";
import { api } from "../../espace-client/api";
import { StatCard, Empty, PIE_COLORS } from "../components/shared";

export function OverviewTab() {
  const { session } = useAdminAuth();
  const statsQ = useAdminData((t) => api.adminStats(t));
  const [running, setRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Realtime: refresh stats whenever the server emits `stats:dirty`.
  useEffect(() => {
    const sb = getSupabase();
    const ch = sb.channel("admin:stats", { config: { broadcast: { self: false } } });
    let timer: number | null = null;
    ch.on("broadcast", { event: "stats:dirty" }, () => {
      if (timer) window.clearTimeout(timer);
      // Debounce bursts; reload at most every 3s.
      timer = window.setTimeout(() => {
        statsQ.reload();
        setLastUpdate(Date.now());
        timer = null;
      }, 3000);
    });
    ch.subscribe();
    return () => { if (timer) window.clearTimeout(timer); sb.removeChannel(ch); };
  }, [statsQ.reload]);

  async function runBilling() {
    if (!session?.token) return;
    if (!window.confirm("Lancer le cycle de prélèvement mensuel pour tous les contrats actifs ?")) return;
    setRunning(true);
    try {
      const res = await api.adminRunBilling(session.token);
      toast.success(`Cycle ${res.cycleKey}`, { description: `${res.generated} prélèvements créés · ${res.skipped} ignorés` });
      statsQ.reload();
    } catch (err) {
      toast.error("Échec du cycle", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

  const d = statsQ.data;
  const revenueSeries = (d?.timeseries.days ?? []).map((day, i) => ({
    day: day.slice(5),
    revenue: d!.timeseries.revenue[i],
    signups: d!.timeseries.signups[i],
  }));
  const claimsPie = Object.entries(d?.breakdown.claimsByStatus ?? {}).map(([name, value]) => ({ name, value }));
  const methodBars = Object.entries(d?.breakdown.revenueByMethod ?? {}).map(([name, value]) => ({ name, value }));
  const productBars = Object.entries(d?.breakdown.productMix ?? {}).map(([name, value]) => ({ name, value }));
  const deptRows = Object.entries(d?.breakdown.membersByDept ?? {}).sort((a, b) => b[1] - a[1]);
  const deptMax = Math.max(1, ...deptRows.map(([, v]) => v));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="t-title1">Vue d'ensemble</h1>
          <p className="text-[#666]" style={{ fontSize: "0.82rem" }}>
            Activité temps réel · {lastUpdate ? `mise à jour il y a ${Math.max(0, Math.round((Date.now() - lastUpdate) / 1000))}s` : "synchro live"}
          </p>
        </div>
        <button onClick={() => statsQ.reload()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-black/10" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {d?.alerts && (() => {
        const a = d.alerts;
        const total = (a.paymentsStale2d ?? 0) + (a.claimsStale48h ?? 0) + (a.kycStale24h ?? 0) + (a.agentsOffline4h ?? 0);
        if (total === 0) {
          return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2" style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0F7A47" }}>
              ✓ Aucune alerte opérationnelle — tout est à jour.
            </div>
          );
        }
        const cells = [
          { Icon: Clock, label: "Paiements en souffrance > 2 j", value: a.paymentsStale2d, tone: "#B85400", bg: "#FFE6CC" },
          { Icon: AlertTriangle, label: "Sinistres SLA > 48 h", value: a.claimsStale48h, tone: "#C0263A", bg: "#FFE2E7" },
          { Icon: ShieldAlert, label: "KYC > 24 h", value: a.kycStale24h, tone: "#7A4E00", bg: "#FFF4E0" },
          { Icon: UserX, label: "Conseillers offline > 4 h", value: a.agentsOffline4h, tone: "#2A4366", bg: "#E6ECF7" },
        ];
        return (
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="mb-3 inline-flex items-center gap-1.5" style={{ fontSize: "0.88rem", fontWeight: 800, color: "#C0263A" }}>
              <AlertTriangle className="w-4 h-4" /> Alertes opérationnelles
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {cells.map((c, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: c.value > 0 ? c.bg : "#F5F6FA", border: `1px solid ${c.value > 0 ? c.tone : "rgba(0,0,0,0.06)"}33` }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: c.tone }}>
                    <c.Icon className="w-3.5 h-3.5" />
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>Alerte</span>
                  </div>
                  <p style={{ fontSize: "1.6rem", fontWeight: 900, color: c.value > 0 ? c.tone : "#666", lineHeight: 1 }}>{c.value}</p>
                  <p className="mt-1" style={{ fontSize: "0.72rem", color: "#444", fontWeight: 600 }}>{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Membres" value={d?.users ?? "..."} tone="blue" />
        <StatCard icon={FileText} label="Contrats actifs" value={d?.contractsActive ?? "..."} tone="blue" />
        <StatCard icon={Wallet} label="Encaissé" value={d ? formatXOF(d.revenue) : "..."} tone="green" />
        <StatCard icon={Wallet} label="24 h" value={d ? formatXOF(d.revenueLast24h) : "..."} tone="green" />
        <StatCard icon={FileText} label="Sinistres en cours" value={`${d?.claims.pending ?? "..."} / ${d?.claims.total ?? "..."}`} tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 p-4 lg:col-span-2">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Encaissements & inscriptions · 30 j</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3B57" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#FF3B57" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gsignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A6BFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2A6BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#FF3B57" fill="url(#grevenue)" name="XOF" />
                <Area type="monotone" dataKey="signups" stroke="#2A6BFF" fill="url(#gsignups)" name="Inscriptions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Sinistres par statut</p>
          {claimsPie.length === 0 ? <Empty /> : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={claimsPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2}>
                    {claimsPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Encaissements par méthode</p>
          {methodBars.length === 0 ? <Empty /> : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={methodBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#16B26A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Mix produit</p>
          {productBars.length === 0 ? <Empty /> : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={productBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#2A6BFF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Répartition géographique · membres par département</p>
        {deptRows.length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {deptRows.map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>{dept}</div>
                <div className="flex-1 h-3 bg-[#F2F3F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / deptMax) * 100}%`, background: "linear-gradient(90deg,#FF3B57,#FF7A00)" }} />
                </div>
                <div className="w-12 text-right" style={{ fontSize: "0.78rem", fontWeight: 800 }}>{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Cycle de prélèvement mensuel</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Génère un prélèvement <strong>en attente</strong> pour chaque contrat actif dont la date d'échéance est dépassée. Les membres reçoivent une notification et règlent via KkiaPay.
          </p>
        </div>
        <button
          onClick={runBilling} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
          style={{ fontSize: "0.82rem", fontWeight: 700 }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          Lancer le cycle
        </button>
      </div>
    </div>
  );
}
