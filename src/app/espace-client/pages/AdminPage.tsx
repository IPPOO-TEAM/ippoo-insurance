import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  Users, FileText, Wallet, RefreshCw, Search, X,
  Megaphone, History, Ban, CheckCircle2, ChevronRight, ListChecks, Image as ImageIcon, Trash2, Plus, Save, MapPin, Globe, MessageCircle, Send, Loader2,
} from "lucide-react";
import { useAdminAuth, useAdminData } from "../AdminLayout";
import { getSupabase } from "../supabaseClient";
import { formatDate, formatXOF } from "../hooks";
import { api, type Claim, type AdminMember, type Promo, type Partner, type SiteContent, type Payment, type Profile } from "../api";
import { Invoice } from "../components/Invoice";
import { PaymentCalendar } from "../components/PaymentCalendar";
import { AgentsPresenceWidget } from "../components/AgentsPresenceWidget";
import { RemindersHistoryWidget } from "../components/RemindersHistoryWidget";
import { SystemHealthWidget } from "../components/SystemHealthWidget";
import { DbHealthWidget } from "../components/DbHealthWidget";
import { Receipt, Paperclip, Reply, Pencil, Download, Filter, UserCheck, AlertTriangle, UploadCloud } from "lucide-react";
import { AttachmentView } from "./MessageriePage";
import { StatusBadge } from "./DashboardPage";
import { toast } from "sonner";
import { RowSkeleton } from "../Skeleton";
import { statusLabel, methodLabel, relationLabel, auditActionLabel, formatMeta } from "../labels";
import { Modal } from "../Modal";
import { useUrlState } from "../useUrlState";
import { PromoPreview, defaultPromoSlides } from "../../components/PromoCarousel";
import { buildPricingDraft, draftToPricingMap, setPricingCache, blankOfferRow, PRODUCT_ICON_NAMES, type PricingDraftRow } from "../../data/pricing";

type AdminClaim = Claim & {
  userId: string; userEmail: string; userName: string; memberNumber: string; adminNote?: string;
};

type TabKey = "overview" | "claims" | "members" | "contracts" | "payments" | "messages" | "broadcast" | "promos" | "partners" | "site" | "audit";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: ListChecks },
  { key: "claims", label: "Sinistres", icon: FileText },
  { key: "members", label: "Membres", icon: Users },
  { key: "contracts", label: "Contrats", icon: FileText },
  { key: "payments", label: "Paiements", icon: Wallet },
  { key: "messages", label: "Messagerie", icon: MessageCircle },
  { key: "broadcast", label: "Diffusion", icon: Megaphone },
  { key: "promos", label: "Carrousel", icon: ImageIcon },
  { key: "partners", label: "Partenaires", icon: MapPin },
  { key: "site", label: "Contenu du site", icon: Globe },
  { key: "audit", label: "Journal d'activité", icon: History },
];

export function AdminPage() {
  const { session } = useAdminAuth();
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="t-title1">Administration</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>
          Session ouverte par <strong>{session?.username}</strong>
        </p>
      </header>

      <nav className="bg-white rounded-2xl border border-black/5 p-2 mb-6 flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${on ? "bg-[#0E1320] text-white" : "text-[#0E1320] hover:bg-black/5"}`}
              style={{ fontSize: "0.82rem", fontWeight: 700 }}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {tab === "overview" && <OverviewTab />}
      {tab === "claims" && <ClaimsTab />}
      {tab === "members" && <MembersTab />}
      {tab === "contracts" && <ContractsTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "broadcast" && <BroadcastTab />}
      {tab === "promos" && <PromosTab />}
      {tab === "partners" && <PartnersTab />}
      {tab === "site" && <SiteTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

// =========================================================================
// OVERVIEW
// =========================================================================

export function OverviewTab() {
  const { session } = useAdminAuth();
  const statsQ = useAdminData((t) => api.adminStats(t));
  const portfoliosQ = useAdminData((t) => api.adminPortfolios(t));
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

  async function runReminders() {
    if (!session?.token) return;
    setRunning(true);
    try {
      const res = await api.adminRunReminders(session.token);
      const f = res.fanout;
      toast.success("Rappels envoyés", {
        description: `${res.sent} in-app · push ${f.push} · email ${f.email} · sms ${f.sms} · opt-out ${f.opted_out_type} (${res.scanned} comptes)`,
      });
    } catch (err) {
      toast.error("Échec des rappels", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

  const [exportMonth, setExportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [exportTo, setExportTo] = useState<string>("");

  async function downloadCsv(kind: "accounting" | "commissions") {
    if (!session?.token) return;
    setRunning(true);
    try {
      const opts = exportTo && exportTo > exportMonth
        ? { from: exportMonth, to: exportTo }
        : { month: exportMonth };
      const blob = kind === "accounting"
        ? await api.adminDownloadAccountingCsv(session.token, opts)
        : await api.adminDownloadCommissionsCsv(session.token, opts);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const label = "from" in opts ? `${opts.from}_${opts.to}` : opts.month;
      a.href = url;
      a.download = `ippoo-${kind === "accounting" ? "comptable" : "commissions"}-${label}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Export ${kind === "accounting" ? "comptable" : "commissions"} téléchargé`);
    } catch (err) {
      toast.error("Échec export", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

  async function runRotateHmac() {
    if (!session?.token) return;
    if (!window.confirm("Régénérer le secret HMAC ? Toutes les sessions admin actives (vous compris) seront invalidées et devront se reconnecter.")) return;
    setRunning(true);
    try {
      const res = await api.adminRotateHmac(session.token);
      toast.success("Secret HMAC régénéré", { description: res.message });
    } catch (err) {
      toast.error("Échec rotation", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

  async function runDispatchSweep() {
    if (!session?.token) return;
    setRunning(true);
    try {
      const res = await api.adminDispatchSweep(session.token, 4);
      if (res.reason === "no-online-agent") {
        toast.warning("Aucun conseiller en ligne", { description: `${res.offlineMatricules.length} matricule(s) hors-ligne en attente.` });
      } else {
        toast.success(`Sweep : ${res.reassigned} réassignation(s)`, { description: `${res.conversations} conv. · ${res.claims} sinistres · ${res.onlineCount} agent(s) en ligne` });
      }
    } catch (err) {
      toast.error("Échec du sweep", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

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

  async function runBackfillBeneficiaries() {
    if (!session?.token) return;
    if (!window.confirm("Rejouer le backfill des bénéficiaires pour les comptes legacy ?")) return;
    setRunning(true);
    try {
      const res = await api.adminBackfillBeneficiaries(session.token);
      toast.success(`Backfill terminé`, { description: `${res.migrated} migré(s) · ${res.skipped} ignoré(s) · ${res.scanned} profils scannés` });
    } catch (err) {
      toast.error("Échec du backfill", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setRunning(false);
    }
  }

  const d = statsQ.data;
  const dedupe = <T extends { name: string }>(arr: T[]) => {
    const seen = new Map<string, T>();
    for (const item of arr) {
      const base = item.name || "—";
      let key = base; let n = 1;
      while (seen.has(key)) key = `${base} (${++n})`;
      seen.set(key, { ...item, name: key });
    }
    return Array.from(seen.values());
  };
  const seenDays = new Set<string>();
  const revenueSeries = (d?.timeseries.days ?? []).map((day, i) => {
    let key = day || `d${i}`;
    while (seenDays.has(key)) key = `${key}·${i}`;
    seenDays.add(key);
    return {
      day: key,
      label: (day ?? "").slice(5),
      revenue: d!.timeseries.revenue[i] ?? 0,
      signups: d!.timeseries.signups[i] ?? 0,
    };
  });
  const claimsPie = dedupe(Object.entries(d?.breakdown.claimsByStatus ?? {}).map(([name, value]) => ({ name: name || "—", value })));
  const methodBars = dedupe(Object.entries(d?.breakdown.revenueByMethod ?? {}).map(([name, value]) => ({ name: name || "—", value })));
  const productBars = dedupe(Object.entries(d?.breakdown.productMix ?? {}).map(([name, value]) => ({ name: name || "—", value })));
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

      <SystemHealthWidget />
      <DbHealthWidget />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Membres" value={d?.users ?? "..."} tone="blue" />
        <StatCard icon={FileText} label="Contrats actifs" value={d?.contractsActive ?? "..."} tone="blue" />
        <StatCard icon={Wallet} label="Encaissé" value={d ? formatXOF(d.revenue) : "..."} tone="green" />
        <StatCard icon={Wallet} label="24 h" value={d ? formatXOF(d.revenueLast24h) : "..."} tone="green" />
        <StatCard icon={FileText} label="Sinistres en cours" value={`${d?.claims.pending ?? "..."} / ${d?.claims.total ?? "..."}`} tone="orange" />
      </div>

      <HealthTile />

      <BusinessKpiWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AgentsPresenceWidget />
        <RemindersHistoryWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 p-4 lg:col-span-2">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Encaissements & inscriptions · 30 j</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs id="ov-defs">
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
                <XAxis dataKey="day" tickFormatter={(_, i) => revenueSeries[i]?.label ?? ""} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
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
                    {claimsPie.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
                  <YAxis tick={{ fontSize: 11 }} width={48} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#16B26A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Charge des conseillers</p>
          {(portfoliosQ.data?.portfolios ?? []).length === 0 ? <Empty /> : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart
                  data={dedupe((portfoliosQ.data?.portfolios ?? []).slice(0, 10).map((p) => ({
                    name: (p.name ? `${p.name.split(" ")[0]} (${p.matricule})` : p.matricule) || "—",
                    clients: p.clients,
                    payments: p.payments,
                  })))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} width={36} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="clients" fill="#2A6BFF" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="payments" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {portfoliosQ.data?.unassignedPayments ? (
            <p className="mt-2" style={{ fontSize: "0.72rem", color: "#B42318" }}>
              {portfoliosQ.data.unassignedPayments} paiement(s) hors portefeuille (clients non attribués)
            </p>
          ) : null}
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <p className="mb-3" style={{ fontSize: "0.88rem", fontWeight: 800 }}>Mix produit</p>
          {productBars.length === 0 ? <Empty /> : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={productBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
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

      <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Backfill bénéficiaires legacy</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Rejoue la matérialisation des bénéficiaires saisis au wizard d'inscription pour les comptes existants dont la liste est vide. Idempotent : skip les comptes déjà peuplés.
          </p>
        </div>
        <button
          onClick={runBackfillBeneficiaries} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
          style={{ fontSize: "0.82rem", fontWeight: 700 }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
          Lancer le backfill
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Export comptable (mois ou plage)</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            CSV des paiements confirmés (date, membre, produit, méthode, montant) et CSV des commissions agrégées par matricule. Laisser le 2ᵉ mois vide pour exporter un seul mois ; sinon exporte la plage inclusive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={exportMonth}
            onChange={(e) => setExportMonth(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
            title="Mois de début (ou mois seul si pas de mois de fin)"
          />
          <span style={{ fontSize: "0.72rem", color: "#666", fontWeight: 700 }}>→</span>
          <input
            type="month"
            value={exportTo}
            onChange={(e) => setExportTo(e.target.value)}
            placeholder="optionnel"
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
            title="Mois de fin (optionnel pour exporter une plage)"
          />
          <button
            onClick={() => downloadCsv("accounting")} disabled={running || !exportMonth}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            <FileText className="w-3.5 h-3.5" /> Comptable
          </button>
          <button
            onClick={() => downloadCsv("commissions")} disabled={running || !exportMonth}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#0E1320] disabled:opacity-50"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            <Wallet className="w-3.5 h-3.5" /> Commissions
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#FECDCA] p-4 flex flex-wrap items-center justify-between gap-3" style={{ background: "#FFFBFA" }}>
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#B42318" }}>Sécurité — rotation du secret HMAC</p>
          <p className="text-[#7A271A]" style={{ fontSize: "0.78rem" }}>
            Régénère le secret qui signe les jetons admin. <strong>Toutes les sessions actives sont invalidées</strong>, vous compris : vous serez déconnecté et devrez vous reconnecter. À faire périodiquement (ex. trimestriellement) ou immédiatement en cas de suspicion de fuite.
          </p>
        </div>
        <button
          onClick={runRotateHmac} disabled={running}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#B42318] text-white disabled:opacity-50"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Régénérer le secret
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Dispatch automatique — sweep des absents</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Détecte les conversations et sinistres assignés à un conseiller hors-ligne depuis &gt; 4 h et les redistribue en round-robin vers les agents en ligne (notification push au repreneur).
          </p>
        </div>
        <button
          onClick={runDispatchSweep} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
          style={{ fontSize: "0.82rem", fontWeight: 700 }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Redistribuer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Rappels & notifications automatiques</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Scanne tous les comptes et envoie les rappels nécessaires : prélèvements à venir (J-3 / J-1 / J), paiements en attente &gt; 24h, paiements échoués, contrats expirant (J-7 / J-1 / J). Idempotent — chaque rappel n'est envoyé qu'une fois.
          </p>
        </div>
        <button
          onClick={runReminders} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
          style={{ fontSize: "0.82rem", fontWeight: 700 }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Envoyer les rappels
        </button>
      </div>
    </div>
  );
}

const PIE_COLORS = ["#FF3B57", "#FF7A00", "#2A6BFF", "#16B26A", "#8A4BFF", "#FFB020", "#0E1320"];

// =========================================================================
// CLAIMS
// =========================================================================

const CLAIM_FILTERS: { key: "all" | Claim["status"]; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "en_cours", label: "En cours" },
  { key: "valide", label: "Validés" },
  { key: "regle", label: "Réglés" },
  { key: "rejete", label: "Rejetés" },
];

const KANBAN_COLS: { status: Claim["status"]; label: string; accent: string; bg: string }[] = [
  { status: "en_cours", label: "En cours", accent: "#FFB020", bg: "#FFF7E5" },
  { status: "valide", label: "Validés", accent: "#2A6BFF", bg: "#E7F0FF" },
  { status: "regle", label: "Réglés", accent: "#0F7A47", bg: "#DBFBE7" },
  { status: "rejete", label: "Rejetés", accent: "#C0263A", bg: "#FFE2E7" },
];

export function ClaimsTab() {
  const { session } = useAdminAuth();
  const [filter, setFilter] = useUrlState<"all" | Claim["status"]>("status", "en_cours", { scope: "claims", allowed: ["all", "en_cours", "valide", "regle", "rejete"] as const });
  const [view, setView] = useUrlState<"kanban" | "list">("view", "kanban", { scope: "claims", allowed: ["kanban", "list"] as const });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<Claim["status"] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminClaim | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const claimsQ = useAdminData((t) => api.adminClaims(t));
  const agentsQ = useAdminData((t) => api.adminListAgents(t));
  const claimKey = (c: { userId: string; id: string }) => `${c.userId}::${c.id}`;
  const activeAgents = (((agentsQ.data as any)?.agents ?? []) as any[]).filter((a: any) => !a.banned && a.matricule);

  async function reassign(cl: AdminClaim, matricule: string) {
    if (!session?.token || !matricule) return;
    setBusyId(cl.id);
    try {
      await api.adminReassignClaim(session.token, cl.userId, cl.id, matricule);
      await claimsQ.reload();
      toast.success(`Réassigné à ${matricule}`);
    } catch (err) {
      toast.error("Échec réassignation", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusyId(null);
    }
  }

  // Realtime: refresh when admin:audit emits claim events.
  useEffect(() => {
    const sb = getSupabase();
    const ch = sb.channel("admin:audit", { config: { broadcast: { self: false } } });
    let timer: number | null = null;
    ch.on("broadcast", { event: "audit:new" }, ({ payload }) => {
      if (!/claim/i.test(String(payload?.action ?? ""))) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => { claimsQ.reload(); timer = null; }, 1500);
    });
    ch.subscribe();
    return () => { if (timer) window.clearTimeout(timer); sb.removeChannel(ch); };
  }, [claimsQ.reload]);

  async function updateStatus(claim: AdminClaim, status: Claim["status"], note?: string) {
    if (!session?.token) return;
    if (status === "rejete" && !note) {
      setRejectTarget(claim);
      return;
    }
    setBusyId(claim.id);
    try {
      await api.adminUpdateClaimStatus(session.token, claim.userId, claim.id, status, note);
      await claimsQ.reload();
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusyId(null);
    }
  }
  function toggleSelect(cl: AdminClaim) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const k = claimKey(cl);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }
  function selectAllFiltered(items: AdminClaim[]) {
    setSelectedIds(new Set(items.map(claimKey)));
  }
  async function bulkApply(status: Claim["status"], note?: string) {
    if (!session?.token) return;
    const items = Array.from(selectedIds).map((k) => {
      const [userId, claimId] = k.split("::");
      return { userId, claimId };
    });
    if (items.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await api.adminBulkUpdateClaims(session.token, items, status, note);
      await claimsQ.reload();
      setSelectedIds(new Set());
      setBulkRejectOpen(false);
      if (res.errors.length > 0) {
        toast.warning(`${res.updated} mis à jour · ${res.errors.length} erreur(s)`);
      } else {
        toast.success(`${res.updated} sinistre${res.updated > 1 ? "s" : ""} mis à jour`);
      }
    } catch (err) {
      toast.error("Échec bulk", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBulkBusy(false);
    }
  }
  async function confirmReject(reason: string) {
    if (!session?.token || !rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await api.adminUpdateClaimStatus(session.token, rejectTarget.userId, rejectTarget.id, "rejete", reason);
      await claimsQ.reload();
      toast.success("Sinistre rejeté");
      setRejectTarget(null);
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusyId(null);
    }
  }

  const claims = (claimsQ.data?.claims ?? []) as AdminClaim[];
  const filtered = filter === "all" ? claims : claims.filter((c) => c.status === filter);
  const byStatus = useMemo(() => {
    const map: Record<string, AdminClaim[]> = { en_cours: [], valide: [], regle: [], rejete: [] };
    for (const c of claims) (map[c.status] ?? (map[c.status] = [])).push(c);
    return map;
  }, [claims]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h1 className="t-title1">Sinistres</h1>
        <div className="inline-flex p-1 rounded-full bg-[#EAECF2]">
          {(["kanban", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-full transition ${view === v ? "bg-white shadow-sm text-[#0E1320]" : "text-[#666]"}`} style={{ fontSize: "0.78rem", fontWeight: 700 }}>
              {v === "kanban" ? "Kanban" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {KANBAN_COLS.map((col) => {
            const items = byStatus[col.status] ?? [];
            const isHover = hoverCol === col.status;
            return (
              <div
                key={col.status}
                onDragOver={(e) => { e.preventDefault(); setHoverCol(col.status); }}
                onDragLeave={() => setHoverCol((s) => (s === col.status ? null : s))}
                onDrop={() => {
                  setHoverCol(null);
                  if (!draggingId) return;
                  const claim = claims.find((c) => c.id === draggingId);
                  if (!claim || claim.status === col.status) return;
                  updateStatus(claim, col.status);
                  setDraggingId(null);
                }}
                className={`rounded-2xl border p-3 min-h-[200px] transition ${isHover ? "border-[#0E1320] bg-white" : "border-black/5 bg-white"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                    <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>{col.label}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.accent, fontSize: "0.7rem", fontWeight: 800 }}>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((cl) => (
                    <article
                      key={`${cl.userId}-${cl.id}`}
                      draggable
                      onDragStart={() => setDraggingId(cl.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="bg-[#F9FAFC] rounded-xl p-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="truncate" style={{ fontSize: "0.84rem", fontWeight: 800 }}>{cl.type}</p>
                        {cl.amount ? <span className="shrink-0 text-[#0E1320]" style={{ fontSize: "0.78rem", fontWeight: 800 }}>{formatXOF(cl.amount)}</span> : null}
                      </div>
                      <p className="text-[#666] truncate" style={{ fontSize: "0.74rem" }}>{cl.userName || cl.userEmail}</p>
                      <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>{formatDate(cl.createdAt)}</p>
                      <p className="text-[#444] line-clamp-2 mt-1.5" style={{ fontSize: "0.76rem" }}>{cl.description}</p>
                      {cl.attachments && cl.attachments.length > 0 && (
                        <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>📎 {cl.attachments.length}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {KANBAN_COLS.filter((c) => c.status !== cl.status).map((c) => (
                          <button
                            key={c.status}
                            onClick={() => updateStatus(cl, c.status)}
                            disabled={busyId === cl.id}
                            className="px-2 py-1 rounded-md disabled:opacity-50"
                            style={{ background: c.bg, color: c.accent, fontSize: "0.68rem", fontWeight: 800 }}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                  {items.length === 0 && (
                    <p className="text-[#aaa] text-center py-6" style={{ fontSize: "0.76rem" }}>Glissez un sinistre ici</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <>
      <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CLAIM_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg ${filter === f.key ? "bg-[#0E1320] text-white" : "bg-black/5 text-[#0E1320]"}`}
              style={{ fontSize: "0.8rem", fontWeight: 700 }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => claimsQ.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {claimsQ.loading && (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
          <RowSkeleton /><RowSkeleton /><RowSkeleton />
        </div>
      )}
      {claimsQ.error && <p className="text-red-600">{claimsQ.error}</p>}
      {!claimsQ.loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-[#666]">
          Aucun sinistre dans cette catégorie.
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 mb-3 bg-[#0E1320] text-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => bulkApply("valide")} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg bg-[#0F7A47] disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Valider</button>
            <button onClick={() => bulkApply("regle")} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg bg-[#1466C0] disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Régler</button>
            <button onClick={() => setBulkRejectOpen(true)} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg bg-[#C0263A] disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Rejeter</button>
            <button onClick={() => bulkApply("en_cours")} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg bg-white/15 disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>En cours</button>
            <button onClick={() => setSelectedIds(new Set())} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Désélectionner</button>
          </div>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => selectedIds.size === filtered.length ? setSelectedIds(new Set()) : selectAllFiltered(filtered)}
            className="px-2.5 py-1 rounded-md bg-black/5 hover:bg-black/10"
            style={{ fontSize: "0.72rem", fontWeight: 700 }}
          >
            {selectedIds.size === filtered.length ? "Tout désélectionner" : `Tout sélectionner (${filtered.length})`}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((cl) => (
          <div key={`${cl.userId}-${cl.id}`} className={`bg-white rounded-2xl border p-4 sm:p-5 ippoo-fade-in ${selectedIds.has(claimKey(cl)) ? "border-[#0E1320]" : "border-black/5"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(claimKey(cl))}
                  onChange={() => toggleSelect(cl)}
                  className="mt-1 w-4 h-4 shrink-0 cursor-pointer"
                  aria-label="Sélectionner"
                />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>{cl.type}</p>
                  <StatusBadge status={cl.status} />
                </div>
                <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>
                  {cl.userName || "Sans nom"} · {cl.userEmail} {cl.memberNumber ? `· ${cl.memberNumber}` : ""}
                </p>
                <p className="text-[#999] mt-0.5" style={{ fontSize: "0.75rem" }}>
                  Déclaré le {formatDate(cl.createdAt)}
                </p>
              </div>
              </div>
              {cl.amount ? (
                <div className="text-right">
                  <p style={{ fontSize: "1rem", fontWeight: 800 }}>{formatXOF(cl.amount)}</p>
                  <p className="text-[#666]" style={{ fontSize: "0.7rem" }}>montant demandé</p>
                </div>
              ) : null}
            </div>
            <p className="text-[#333] mb-3 whitespace-pre-wrap break-words" style={{ fontSize: "0.88rem" }}>{cl.description}</p>
            {cl.attachments && cl.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {cl.attachments.map((a: any, i: number) =>
                  a?.url ? (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-black/10 hover:border-[#FF3B57] hover:bg-[#FF3B57]/5"
                      style={{ fontSize: "0.72rem" }}
                    >
                      📎 {a.name || `pièce ${i + 1}`}
                    </a>
                  ) : (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F5F6FA] text-[#666]" style={{ fontSize: "0.72rem" }}>
                      📎 {a.name || `pièce ${i + 1}`}
                    </span>
                  ),
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <ActionBtn label="Valider" tone="green" disabled={busyId === cl.id || cl.status === "valide"} onClick={() => updateStatus(cl, "valide")} />
              <ActionBtn label="Régler" tone="blue" disabled={busyId === cl.id || cl.status === "regle"} onClick={() => updateStatus(cl, "regle")} />
              <ActionBtn label="Rejeter" tone="red" disabled={busyId === cl.id || cl.status === "rejete"} onClick={() => updateStatus(cl, "rejete")} />
              <ActionBtn label="Remettre en cours" tone="gray" disabled={busyId === cl.id || cl.status === "en_cours"} onClick={() => updateStatus(cl, "en_cours")} />
              <select
                value=""
                disabled={busyId === cl.id || activeAgents.length === 0}
                onChange={(e) => { const v = e.target.value; if (v) reassign(cl, v); }}
                className="px-2.5 py-1.5 rounded-lg border border-black/15 bg-white hover:border-[#0E1320] disabled:opacity-50"
                style={{ fontSize: "0.78rem", fontWeight: 700 }}
                title="Réassigner à un agent"
              >
                <option value="">{cl.assignedTo ? `↻ Réassigner (${cl.assignedTo})` : "↻ Réassigner"}</option>
                {activeAgents.map((a: any) => (
                  <option key={a.id} value={a.matricule}>{a.matricule} · {a.name || a.email}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      </>
      )}
      <RejectClaimModal
        open={!!rejectTarget}
        target={rejectTarget}
        busy={busyId === rejectTarget?.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
      <RejectClaimModal
        open={bulkRejectOpen}
        target={{ type: `${selectedIds.size} sinistre${selectedIds.size > 1 ? "s" : ""}`, userName: "rejet en lot" }}
        busy={bulkBusy}
        onClose={() => setBulkRejectOpen(false)}
        onConfirm={(reason) => bulkApply("rejete", reason)}
      />
    </div>
  );
}

function RejectClaimModal({
  open, target, busy, onClose, onConfirm,
}: {
  open: boolean;
  target: { type?: string; userName?: string; userEmail?: string } | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const ok = reason.trim().length >= 3;
  return (
    <Modal open={open} onClose={onClose} title="Rejeter le sinistre" description={target ? `${target.type ?? ""} · ${target.userName || target.userEmail || ""}` : ""} size="sm">
      <div className="space-y-3">
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Motif du rejet <span className="text-red-600">*</span></span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Indiquez le motif (notifié au membre)"
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.85rem" }}
          />
          <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>Minimum 3 caractères.</p>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
          <button
            onClick={() => ok && onConfirm(reason.trim())}
            disabled={!ok || busy}
            className="px-3 py-2 rounded-lg bg-[#C0263A] text-white disabled:opacity-50"
            style={{ fontSize: "0.8rem", fontWeight: 800 }}
          >
            {busy ? "Rejet..." : "Confirmer le rejet"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =========================================================================
// MEMBERS
// =========================================================================

function EnrollerReassignButton({ member, onDone }: { member: AdminMember; onDone: () => void }) {
  const { session } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(member.enrolledBy ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setVal(member.enrolledBy ?? ""); }, [open, member.enrolledBy]);
  async function save() {
    if (!session?.token) return;
    setBusy(true);
    try {
      await api.adminSetEnroller(session.token, member.id, val.trim());
      toast.success(val.trim() ? "Enrôleur mis à jour" : "Enrôleur détaché");
      setOpen(false);
      onDone();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(false); }
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10"
        style={{ fontSize: "0.78rem", fontWeight: 700 }}
        title="Réattribuer l'enrôleur"
      >
        <UserCheck className="w-3.5 h-3.5" /> Enrôleur
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Réattribuer l'enrôleur" description={member.name || member.email} size="sm">
        <div className="space-y-3">
          <label className="block">
            <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Matricule du conseiller</span>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value.toUpperCase())}
              placeholder="IPPOO-A-XXXX (laisser vide pour détacher)"
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white font-mono"
              style={{ fontSize: "0.85rem" }}
            />
            <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>Actuel : {member.enrolledBy || "aucun"}.</p>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} disabled={busy} className="px-3 py-2 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
            <button onClick={save} disabled={busy} className="px-3 py-2 rounded-lg bg-[#0E1320] text-white disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
              {busy ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function MembersTab() {
  const { session } = useAdminAuth();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminMember | null>(null);
  const membersQ = useAdminData((t) => api.adminMembers(t));

  const members = (membersQ.data?.members ?? []) as AdminMember[];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members;
    return members.filter((m) =>
      (m.name + " " + m.email + " " + (m.memberNumber ?? "") + " " + (m.phone ?? ""))
        .toLowerCase()
        .includes(s),
    );
  }, [members, q]);

  async function reactivate(m: AdminMember) {
    if (!session?.token) return;
    setBusy(m.id);
    try {
      await api.adminSuspend(session.token, m.id, false);
      await membersQ.reload();
      toast.success("Membre réactivé");
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusy(null);
    }
  }
  async function confirmSuspend(reason: string) {
    if (!session?.token || !suspendTarget) return;
    setBusy(suspendTarget.id);
    try {
      await api.adminSuspend(session.token, suspendTarget.id, true, reason);
      await membersQ.reload();
      toast.success("Membre suspendu");
      setSuspendTarget(null);
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, e-mail, n° membre, téléphone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <button
          onClick={() => membersQ.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {membersQ.loading && <RowSkeleton />}
      {!membersQ.loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-[#666]">
          Aucun membre.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {filtered.map((m) => (
          <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-black/5">
            <button
              onClick={() => setSelected(m.id)}
              className="flex-1 min-w-[200px] text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>{m.name || "Sans nom"}</p>
                {m.suspended && <span className="px-2 py-0.5 rounded-full bg-[#FFDDE2] text-[#C0263A]" style={{ fontSize: "0.7rem", fontWeight: 800 }}>Suspendu</span>}
              </div>
              <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
                {m.email}{m.memberNumber ? ` · ${m.memberNumber}` : ""}
              </p>
              <p className="text-[#999] mt-0.5" style={{ fontSize: "0.72rem" }}>
                {m.activeContracts} contrat{m.activeContracts > 1 ? "s" : ""} actif{m.activeContracts > 1 ? "s" : ""} · {m.pendingClaims} sinistre{m.pendingClaims > 1 ? "s" : ""} en cours · {formatXOF(m.revenue)}
              </p>
              <p className="text-[#666] mt-0.5" style={{ fontSize: "0.7rem" }}>
                Enrollé par : <span className="font-mono">{m.enrolledBy || "—"}</span>
                {m.enrolledSource ? <span className="text-[#999]"> · {m.enrolledSource}</span> : null}
              </p>
            </button>
            <div className="flex items-center gap-2">
              <EnrollerReassignButton member={m} onDone={() => membersQ.reload()} />
              <button
                onClick={() => (m.suspended ? reactivate(m) : setSuspendTarget(m))}
                disabled={busy === m.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-40"
                style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  background: m.suspended ? "#DBFBE7" : "#FFDDE2",
                  color: m.suspended ? "#0F7A47" : "#C0263A",
                }}
              >
                {m.suspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                {m.suspended ? "Réactiver" : "Suspendre"}
              </button>
              <button onClick={() => setSelected(m.id)} className="p-2 rounded-lg hover:bg-black/5">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && <MemberDrawer uid={selected} onClose={() => setSelected(null)} />}
      <SuspendReasonModal
        open={!!suspendTarget}
        target={suspendTarget}
        busy={busy === suspendTarget?.id}
        onClose={() => setSuspendTarget(null)}
        onConfirm={confirmSuspend}
      />
    </div>
  );
}

function SuspendReasonModal({
  open, target, busy, onClose, onConfirm,
}: {
  open: boolean;
  target: { name?: string; email?: string } | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const ok = reason.trim().length >= 3;
  return (
    <Modal open={open} onClose={onClose} title="Suspendre le membre" description={target?.name || target?.email || ""} size="sm">
      <div className="space-y-3">
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Motif de la suspension <span className="text-red-600">*</span></span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Indiquez le motif (visible dans l'historique)"
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.85rem" }}
          />
          <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>Minimum 3 caractères.</p>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
          <button
            onClick={() => ok && onConfirm(reason.trim())}
            disabled={!ok || busy}
            className="px-3 py-2 rounded-lg bg-[#C0263A] text-white disabled:opacity-50"
            style={{ fontSize: "0.8rem", fontWeight: 800 }}
          >
            {busy ? "Suspension..." : "Confirmer la suspension"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MemberDrawer({ uid, onClose }: { uid: string; onClose: () => void }) {
  const { session } = useAdminAuth();
  const detailQ = useAdminData((t) => api.adminMember(t, uid));
  const d = detailQ.data;
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);

  async function reactivateOnly() {
    if (!session?.token || !d) return;
    setBusy("suspend");
    try {
      await api.adminSuspend(session.token, uid, false);
      toast.success("Membre réactivé");
      detailQ.reload();
    } catch (err) { toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" }); }
    finally { setBusy(null); }
  }
  async function confirmSuspendDrawer(reason: string) {
    if (!session?.token) return;
    setBusy("suspend");
    try {
      await api.adminSuspend(session.token, uid, true, reason);
      toast.success("Membre suspendu");
      setSuspendOpen(false);
      detailQ.reload();
    } catch (err) { toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" }); }
    finally { setBusy(null); }
  }
  async function sendQuickMessage() {
    if (!session?.token || !msg.trim()) return;
    setBusy("msg");
    try {
      await api.adminReplyMessage(session.token, uid, msg.trim());
      setMsg("");
      toast.success("Message envoyé");
      detailQ.reload();
    } catch (err) { toast.error("Envoi impossible", { description: err instanceof Error ? err.message : "Erreur" }); }
    finally { setBusy(null); }
  }
  async function exportMember() {
    if (!session?.token) return;
    setBusy("export");
    try {
      const data = await api.adminExportMember(session.token, uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ippoo-member-${uid}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Export téléchargé");
    } catch (err) { toast.error("Export impossible", { description: err instanceof Error ? err.message : "Erreur" }); }
    finally { setBusy(null); }
  }

  const fullName = [d?.profile.firstName, d?.profile.lastName].filter(Boolean).join(" ") || d?.profile.name || "Sans nom";
  const daysAsMember = d?.profile.createdAt ? Math.floor((Date.now() - new Date(d.profile.createdAt).getTime()) / 86400000) : null;
  const totalRevenue = (d?.payments ?? []).filter((p) => p.status === "confirme").reduce((s, p) => s + (p.amount ?? 0), 0);
  const activeContracts = (d?.contracts ?? []).filter((c) => c.status === "active").length;
  const pendingClaims = (d?.claims ?? []).filter((c) => c.status === "en_cours" || (c.status as string) === "soumis").length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="truncate" style={{ fontSize: "1.15rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{fullName}</h2>
              {d?.profile.suspended && <span className="px-2 py-0.5 rounded-full bg-[#FFDDE2] text-[#C0263A]" style={{ fontSize: "0.68rem", fontWeight: 800 }}>Suspendu</span>}
            </div>
            <p className="text-[#666] truncate" style={{ fontSize: "0.78rem" }}>
              {d?.profile.email}{d?.profile.memberNumber ? ` · N° ${d.profile.memberNumber}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5"><X className="w-4 h-4" /></button>
        </div>

        {detailQ.loading && <div className="p-5"><RowSkeleton /></div>}
        {detailQ.error && <p className="p-5 text-red-600">{detailQ.error}</p>}
        {d && (
          <div className="p-5 space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat label="Revenu" value={formatXOF(totalRevenue)} />
              <MiniStat label="Contrats actifs" value={activeContracts} />
              <MiniStat label="Sinistres en cours" value={pendingClaims} />
              <MiniStat label="Membre depuis" value={daysAsMember !== null ? `${daysAsMember} j` : "—"} />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => (d.profile.suspended ? reactivateOnly() : setSuspendOpen(true))} disabled={busy === "suspend"} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700, background: d.profile.suspended ? "#DBFBE7" : "#FFDDE2", color: d.profile.suspended ? "#0F7A47" : "#C0263A" }}>
                {d.profile.suspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                {d.profile.suspended ? "Réactiver" : "Suspendre"}
              </button>
              <button onClick={exportMember} disabled={busy === "export"} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F2F3F7] text-[#0E1320] hover:bg-black/10 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                {busy === "export" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Exporter (RGPD)
              </button>
            </div>

            {/* Quick message */}
            <div className="bg-[#F9FAFC] rounded-xl p-3">
              <p className="mb-2 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Envoyer un message</p>
              <div className="flex gap-2">
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message au membre…" className="flex-1 px-3 py-2 rounded-lg border border-black/10 bg-white" style={{ fontSize: "0.85rem" }} />
                <button onClick={sendQuickMessage} disabled={busy === "msg" || !msg.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF3B57] text-white disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  {busy === "msg" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Envoyer
                </button>
              </div>
            </div>

            <Section title="Profil">
              <KV k="Nom complet" v={fullName} />
              <KV k="E-mail" v={d.profile.email} />
              <KV k="Téléphone" v={d.profile.phone || "—"} />
              <KV k="N° membre" v={d.profile.memberNumber || "—"} />
              <KV k="Code parrain" v={d.profile.referralCode || "—"} />
              <KV k="Carte" v={d.profile.cardActive ? "Active" : "Inactive"} />
              <KV k="Nationalité" v={d.profile.nationality || "—"} />
              <KV
                k="Adresse"
                v={d.profile.address
                  || [d.profile.quartier, d.profile.city, d.profile.department, d.profile.country].filter(Boolean).join(", ")
                  || "—"}
              />
              <KV k="Inscrit le" v={d.profile.createdAt ? formatDate(d.profile.createdAt) : "—"} />
            </Section>

            <Section title="Profil métier">
              <KV k="Type de profil" v={d.profile.type || "—"} />
              <KV
                k="Sous-profils"
                v={Array.isArray(d.profile.sousProfil) && d.profile.sousProfil.length
                  ? d.profile.sousProfil.join(", ")
                  : "—"}
              />
              <KV k="Activité" v={d.profile.activite || d.profile.profession || "—"} />
              <KV k="Secteur" v={d.profile.secteur || "—"} />
              <KV k="Entreprise" v={d.profile.entreprise || d.profile.companyName || "—"} />
              <KV k="Statut professionnel" v={d.profile.statutPro || "—"} />
              <KV
                k="Couvertures souhaitées"
                v={[
                  Array.isArray(d.profile.couverture) ? d.profile.couverture.join(", ") : "",
                  d.profile.couvertureAutre || "",
                ].filter(Boolean).join(" · ") || "—"}
              />
              <KV k="Formule visée" v={d.profile.formule || "—"} />
              <KV
                k="Documents déclarés"
                v={[
                  Array.isArray(d.profile.documentsDeclares) ? d.profile.documentsDeclares.join(", ") : "",
                  d.profile.documentAutre || "",
                ].filter(Boolean).join(" · ") || "—"}
              />
            </Section>

            <Section title="Enrôlement">
              <KV k="Enrôleur (matricule)" v={d.profile.enrolledBy || "—"} />
              <KV k="Date enrôlement" v={d.profile.enrolledAt ? formatDate(d.profile.enrolledAt) : "—"} />
              <KV k="Source" v={d.profile.enrolledSource || "—"} />
              <div className="pt-2">
                <EnrollerReassignButton
                  member={{
                    id: uid,
                    email: d.profile.email,
                    name: d.profile.name,
                    phone: d.profile.phone ?? "",
                    memberNumber: d.profile.memberNumber ?? "",
                    createdAt: d.profile.createdAt ?? null,
                    suspended: !!d.profile.suspended,
                    activeContracts,
                    pendingClaims,
                    revenue: totalRevenue,
                    enrolledBy: d.profile.enrolledBy ?? null,
                    enrolledAt: d.profile.enrolledAt ?? null,
                    enrolledSource: d.profile.enrolledSource ?? null,
                  }}
                  onDone={() => detailQ.reload()}
                />
              </div>
            </Section>

            <Section title={`Contrats (${d.contracts.length})`}>
              {d.contracts.length === 0 ? <Empty /> : d.contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5" style={{ fontSize: "0.82rem" }}>
                  <span className="truncate">{c.product}</span>
                  <span className="text-[#666]">{statusLabel(c.status)} · {formatXOF(c.premium)}</span>
                </div>
              ))}
            </Section>

            <Section title={`Sinistres (${d.claims.length})`}>
              {d.claims.length === 0 ? <Empty /> : d.claims.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5" style={{ fontSize: "0.82rem" }}>
                  <span className="truncate">{c.type} · {formatDate(c.submittedAt ?? c.date ?? new Date().toISOString())}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </Section>

            <Section title={`Paiements (${d.payments.length})`}>
              {d.payments.length === 0 ? <Empty /> : d.payments.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5" style={{ fontSize: "0.82rem" }}>
                  <span>{formatDate(p.createdAt)} · {methodLabel(p.method)}</span>
                  <span className="text-[#666]">{formatXOF(p.amount)} · {statusLabel(p.status)}</span>
                </div>
              ))}
            </Section>

            <Section title={`Bénéficiaires (${d.beneficiaries.length})`}>
              {d.beneficiaries.length === 0 ? <Empty /> : d.beneficiaries.map((b) => (
                <div key={b.id} className="py-1.5" style={{ fontSize: "0.82rem" }}>
                  {b.name} <span className="text-[#666]">· {relationLabel(b.relation)}</span>
                </div>
              ))}
            </Section>

            <Section title={`Documents (${d.documents.length})`}>
              {d.documents.length === 0 ? <Empty /> : d.documents.slice(0, 10).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-1.5" style={{ fontSize: "0.82rem" }}>
                  <span className="truncate">{doc.name}{doc.kind ? ` · ${doc.kind}` : ""}</span>
                  <span className="text-[#666]">{formatDate(doc.createdAt)}</span>
                </div>
              ))}
            </Section>

            <Section title={`Journal d'activité (${d.audit.length})`}>
              {d.audit.length === 0 ? <Empty /> : (
                <div className="max-h-64 overflow-y-auto -mx-1 px-1">
                  {d.audit.slice(0, 30).map((a) => (
                    <div key={a.id} className="py-1.5 border-b border-black/5 last:border-0">
                      <div className="flex items-center justify-between gap-2" style={{ fontSize: "0.78rem" }}>
                        <span style={{ fontWeight: 700 }}>{auditActionLabel(a.action)}</span>
                        <span className="text-[#888]" style={{ fontSize: "0.72rem" }}>{formatDate(a.at)}</span>
                      </div>
                      {Object.keys(a.meta).length > 0 && (
                        <p className="text-[#888] truncate" style={{ fontSize: "0.7rem" }}>{formatMeta(a.meta)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
      <SuspendReasonModal
        open={suspendOpen}
        target={d ? { name: d.profile.name, email: d.profile.email } : null}
        busy={busy === "suspend"}
        onClose={() => setSuspendOpen(false)}
        onConfirm={confirmSuspendDrawer}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-[#F9FAFC] rounded-xl px-3 py-2.5">
      <p className="text-[#888]" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <p className="mt-0.5" style={{ fontSize: "0.95rem", fontWeight: 900 }}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F9FAFC] rounded-xl p-3">
      <p className="mb-2 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</p>
      <div>{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ fontSize: "0.82rem" }}>
      <span className="text-[#666]">{k}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
}
function Empty() { return <p className="text-[#999]" style={{ fontSize: "0.78rem" }}>Aucun élément.</p>; }

// =========================================================================
// CONTRACTS
// =========================================================================

export function ContractsTab() {
  const { session } = useAdminAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "pending" | "expired">("all");
  const dataQ = useAdminData((t) => api.adminContracts(t));
  const items = dataQ.data?.contracts ?? [];
  const [busyAd, setBusyAd] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!s) return true;
      return (c.product + " " + c.userEmail + " " + c.userName).toLowerCase().includes(s);
    });
  }, [items, q, status]);

  async function toggleAutoDebit(c: typeof items[number]) {
    if (!session?.token) return;
    const next = !(c.autoDebit !== false);
    const label = next ? "Activer" : "Désactiver";
    if (!window.confirm(`${label} le prélèvement automatique pour ${c.userName || c.userEmail} (${c.product}) ?`)) return;
    const key = `${c.userId}-${c.id}`;
    setBusyAd(key);
    try {
      await api.adminToggleContractAutoDebit(session.token, c.userId, c.id, next);
      toast.success(next ? "Prélèvement automatique activé" : "Prélèvement automatique désactivé");
      dataQ.reload();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusyAd(null); }
  }

  return (
    <div>
      <FiltersBar q={q} setQ={setQ} reload={dataQ.reload}>
        <Select value={status} onChange={(v) => setStatus(v as any)} options={[
          ["all", "Tous"], ["active", "Actifs"], ["pending", "En attente"], ["expired", "Expirés"],
        ]} />
      </FiltersBar>
      {dataQ.loading && <RowSkeleton />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {filtered.map((c) => {
          const key = `${c.userId}-${c.id}`;
          const ad = c.autoDebit !== false;
          const isBusy = busyAd === key;
          return (
            <div key={key} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>{c.product}</p>
                <p className="text-[#666]" style={{ fontSize: "0.76rem" }}>{c.userName || c.userEmail}</p>
                <p className="text-[#999] mt-0.5" style={{ fontSize: "0.72rem" }}>
                  {formatDate(c.startDate)} → {formatDate(c.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAutoDebit(c)}
                  disabled={isBusy}
                  title={ad ? "Désactiver le prélèvement automatique" : "Activer le prélèvement automatique"}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border disabled:opacity-50 ${
                    ad ? "bg-[#E9F7EF] border-[#A5D6B7] text-[#15803D]" : "bg-[#F3F4F6] border-black/10 text-[#374151]"
                  }`}
                  style={{ fontSize: "0.72rem", fontWeight: 800 }}>
                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Auto-débit {ad ? "ON" : "OFF"}
                </button>
                <div className="text-right">
                  <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>{formatXOF(c.premium)}</p>
                  <p className="text-[#666]" style={{ fontSize: "0.72rem" }}>{statusLabel(c.status)}</p>
                </div>
              </div>
            </div>
          );
        })}
        {!dataQ.loading && filtered.length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucun contrat.</div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// PAYMENTS
// =========================================================================

function SendInvoiceButton({ userId, paymentId }: { userId: string; paymentId: string }) {
  const { session } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!session?.token) return;
    if (!window.confirm("Renvoyer la facture par e-mail au membre ?")) return;
    setBusy(true);
    try {
      await api.adminSendInvoice(session.token, userId, paymentId);
      toast.success("Facture envoyée par e-mail");
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(false); }
  }
  return (
    <button onClick={send} disabled={busy}
      title="Renvoyer la facture par e-mail"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 disabled:opacity-50"
      style={{ fontSize: "0.74rem", fontWeight: 700 }}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      E-mail
    </button>
  );
}

const ADMIN_PAYMENTS_PAGE_SIZE = 100;

export function PaymentsTab() {
  const { session } = useAdminAuth();
  const adminToken = session?.token ?? "";
  const [q, setQ] = useUrlState<string>("q", "", { scope: "pay" });
  const [status, setStatus] = useUrlState<"all" | "confirme" | "en_attente" | "echec" | "rembourse" | "annule">("status", "all", { scope: "pay", allowed: ["all", "confirme", "en_attente", "echec", "rembourse", "annule"] as const });
  const [refundTarget, setRefundTarget] = useState<{ p: Payment & { userId: string; userEmail: string; userName: string }; action: "rembourse" | "annule" } | null>(null);
  const [refundBusy, setRefundBusy] = useState(false);
  const [method, setMethod] = useUrlState<"all" | "mtn" | "moov" | "celtiis" | "carte" | "virement" | "especes">("method", "all", { scope: "pay", allowed: ["all", "mtn", "moov", "celtiis", "carte", "virement", "especes"] as const });
  const [period, setPeriod] = useUrlState<"all" | "7" | "30" | "90">("period", "30", { scope: "pay", allowed: ["all", "7", "30", "90"] as const });
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);
  const [invoiceProfile, setInvoiceProfile] = useState<Profile | null>(null);

  type PaymentRow = (Payment & { userId: string; userEmail: string; userName: string });
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(!!adminToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [agentStats, setAgentStats] = useState<{ perAgent: { matricule: string; count: number }[]; unassigned: number } | null>(null);
  const [livePulse, setLivePulse] = useState(false);

  const providersQ = useAdminData((t) => api.adminPaymentProviders(t));
  const providers = providersQ.data?.providers ?? [];

  const reload = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminPayments(adminToken, { limit: ADMIN_PAYMENTS_PAGE_SIZE, stats: true });
      setItems(res.payments);
      setNextBefore(res.nextBefore);
      setTotalCount(res.total);
      setAgentStats(res.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  const loadMore = useCallback(async () => {
    if (!adminToken || !nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.adminPayments(adminToken, { limit: ADMIN_PAYMENTS_PAGE_SIZE, before: nextBefore });
      setItems((prev) => [...prev, ...res.payments]);
      setNextBefore(res.nextBefore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoadingMore(false);
    }
  }, [adminToken, nextBefore, loadingMore]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    const debounced = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => reload(), 1500);
    };
    const ch1 = sb.channel(`admin:stats`)
      .on("broadcast", { event: "stats:dirty" }, debounced)
      .subscribe();
    let pulseT: any = null;
    const ch2 = sb.channel(`payments:live`)
      .on("broadcast", { event: "payments:dirty" }, () => {
        setLivePulse(true);
        if (pulseT) clearTimeout(pulseT);
        pulseT = setTimeout(() => setLivePulse(false), 2000);
        debounced();
      })
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      sb.removeChannel(ch1);
      sb.removeChannel(ch2);
    };
  }, [reload]);

  function openInvoice(p: typeof items[number]) {
    const payment: Payment = {
      id: p.id, amount: p.amount, method: p.method, status: p.status,
      createdAt: p.createdAt, contractId: (p as any).contractId,
    } as Payment;
    const profile = {
      id: p.userId, email: p.userEmail, name: p.userName,
      memberNumber: (p as any).memberNumber,
    } as Profile;
    setInvoicePayment(payment);
    setInvoiceProfile(profile);
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 86400_000;
    return items.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (method !== "all" && p.method !== method) return false;
      if (cutoff && new Date(p.createdAt).getTime() < cutoff) return false;
      if (!s) return true;
      return (p.method + " " + p.userEmail + " " + p.userName + " " + p.id).toLowerCase().includes(s);
    });
  }, [items, q, status, method, period]);

  const total = filtered.filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);
  const pendingTotal = filtered.filter((p) => p.status === "en_attente").reduce((s, p) => s + p.amount, 0);
  const failedCount = filtered.filter((p) => p.status === "echec").length;

  function exportCsv() {
    const header = ["id", "date", "membre", "email", "methode", "statut", "montant_xof", "contratId"];
    const rows = filtered.map((p) => [
      p.id,
      new Date(p.createdAt).toISOString(),
      (p.userName || "").replaceAll('"', '""'),
      p.userEmail || "",
      methodLabel(p.method),
      statusLabel(p.status),
      String(p.amount),
      (p as any).contractId || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} paiement(s) exporté(s)`);
  }

  return (
    <div>
      <FiltersBar q={q} setQ={setQ} reload={reload}>
        <Select value={status} onChange={(v) => setStatus(v as any)} options={[
          ["all", "Tous statuts"], ["confirme", "Confirmés"], ["en_attente", "En attente"], ["echec", "Échecs"], ["rembourse", "Remboursés"], ["annule", "Annulés"],
        ]} />
        <Select value={method} onChange={(v) => setMethod(v as any)} options={[
          ["all", "Toutes méthodes"], ["mtn", "MTN MoMo"], ["moov", "Moov Money"], ["celtiis", "Celtiis Cash"],
          ["carte", "Carte"], ["virement", "Virement"], ["especes", "Espèces"],
        ]} />
        <Select value={period} onChange={(v) => setPeriod(v as any)} options={[
          ["7", "7 jours"], ["30", "30 jours"], ["90", "90 jours"], ["all", "Tout"],
        ]} />
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E1320] text-white hover:bg-[#1a1f2e] disabled:opacity-50"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </FiltersBar>

      {error && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      <PaymentCalendar
        payments={filtered as any}
        title={
          <span className="inline-flex items-center gap-2">
            Calendrier global des prélèvements
            <span
              aria-label={livePulse ? "Live" : "En attente"}
              className={livePulse ? "animate-pulse" : ""}
              style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: livePulse ? "#16B26A" : "rgba(0,0,0,0.2)",
              }}
            />
          </span>
        }
        subtitle={`${filtered.length} affiché(s) · ${items.length}/${totalCount} chargé(s)`}
        showUser
      />

      {agentStats && agentStats.perAgent.length > 0 && (
        <div className="bg-white border border-black/5 rounded-2xl p-3 mb-3">
          <p className="text-[#666] mb-2" style={{ fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            RÉPARTITION PAR CONSEILLER (top 5)
          </p>
          <div className="flex flex-wrap gap-2">
            {agentStats.perAgent.slice(0, 5).map((a) => (
              <span
                key={a.matricule}
                className="px-2.5 py-1 rounded-full bg-[#F2F4F8]"
                style={{ fontSize: "0.78rem", fontWeight: 700 }}
              >
                {a.matricule} · {a.count}
              </span>
            ))}
            {agentStats.unassigned > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-[#FFE7E7] text-[#B42318]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                Non attribué · {agentStats.unassigned}
              </span>
            )}
          </div>
        </div>
      )}

      {providers.length > 0 && (
        <div className="bg-white border border-black/5 rounded-2xl p-3 mb-3">
          <p className="text-[#666] mb-2" style={{ fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.05em" }}>FOURNISSEURS PAIEMENT</p>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => {
              const ok = p.configured && p.webhookConfigured;
              const partial = p.configured && !p.webhookConfigured;
              return (
                <span key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                    ok ? "bg-[#E8F8EF] border-[#16B26A]/30 text-[#0F7A48]"
                    : partial ? "bg-[#FFF5E5] border-[#FFB020]/30 text-[#8A5A00]"
                    : "bg-[#F5F6FA] border-black/10 text-[#666]"
                  }`}
                  style={{ fontSize: "0.74rem", fontWeight: 700 }}
                  title={`${p.supports.join(", ")} — webhook ${p.webhookConfigured ? "✓" : "✗"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[#16B26A]" : partial ? "bg-[#FFB020]" : "bg-[#999]"}`}></span>
                  {p.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-[#E8F8EF] border border-[#16B26A]/20 rounded-2xl p-3">
          <p className="text-[#0F7A48]" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}>ENCAISSÉ</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{formatXOF(total)}</p>
        </div>
        <div className="bg-[#FFF5E5] border border-[#FFB020]/20 rounded-2xl p-3">
          <p className="text-[#8A5A00]" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}>EN ATTENTE</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{formatXOF(pendingTotal)}</p>
        </div>
        <div className="bg-[#FFE5EB] border border-[#FF3B57]/20 rounded-2xl p-3">
          <p className="text-[#C0263A]" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}>ÉCHECS</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{failedCount}</p>
        </div>
      </div>

      {loading && <RowSkeleton />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {filtered.map((p) => (
          <div key={`${p.userId}-${p.id}`} className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>{p.userName || p.userEmail}</p>
              <p className="text-[#666]" style={{ fontSize: "0.74rem" }}>{methodLabel(p.method)} · {formatDate(p.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>{formatXOF(p.amount)}</p>
                <StatusBadge status={p.status} />
              </div>
              {p.status === "confirme" && (
                <>
                  <button
                    onClick={() => openInvoice(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1320] text-white hover:bg-[#1a1f2e]"
                    style={{ fontSize: "0.74rem", fontWeight: 700 }}
                  >
                    <Receipt className="w-3.5 h-3.5" /> Reçu
                  </button>
                  <SendInvoiceButton userId={p.userId} paymentId={p.id} />
                  <button
                    onClick={() => setRefundTarget({ p, action: "rembourse" })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFE5EB] text-[#C0263A] hover:bg-[#FFD5DD]"
                    style={{ fontSize: "0.74rem", fontWeight: 700 }}
                    title="Rembourser ce paiement"
                  >
                    Rembourser
                  </button>
                </>
              )}
              {(p.status === "en_attente" || p.status === "echec") && (
                <button
                  onClick={() => setRefundTarget({ p, action: "annule" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10"
                  style={{ fontSize: "0.74rem", fontWeight: 700 }}
                  title="Annuler ce paiement"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucun paiement.</div>
        )}
      </div>
      {nextBefore && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-black/10 hover:bg-black/5 disabled:opacity-50"
            style={{ fontSize: "0.84rem", fontWeight: 700 }}
          >
            {loadingMore ? "Chargement…" : `Charger plus (${items.length}/${totalCount})`}
          </button>
        </div>
      )}
      {invoicePayment && (
        <Invoice
          open={!!invoicePayment}
          onClose={() => { setInvoicePayment(null); setInvoiceProfile(null); }}
          payment={invoicePayment}
          profile={invoiceProfile}
          contract={null}
        />
      )}
      <RefundPaymentModal
        open={!!refundTarget}
        target={refundTarget}
        busy={refundBusy}
        onClose={() => setRefundTarget(null)}
        onConfirm={async (reason) => {
          if (!refundTarget || !adminToken) return;
          setRefundBusy(true);
          try {
            await api.adminRefundPayment(adminToken, refundTarget.p.userId, refundTarget.p.id, refundTarget.action, reason);
            toast.success(refundTarget.action === "rembourse" ? "Paiement remboursé" : "Paiement annulé");
            setRefundTarget(null);
            await reload();
          } catch (err) {
            toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
          } finally {
            setRefundBusy(false);
          }
        }}
      />
    </div>
  );
}

function RefundPaymentModal({
  open, target, busy, onClose, onConfirm,
}: {
  open: boolean;
  target: { p: Payment & { userName: string; userEmail: string }; action: "rembourse" | "annule" } | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const ok = reason.trim().length >= 3;
  const title = target?.action === "rembourse" ? "Rembourser le paiement" : "Annuler le paiement";
  return (
    <Modal open={open} onClose={onClose} title={title} description={target ? `${formatXOF(target.p.amount)} · ${target.p.userName || target.p.userEmail}` : ""} size="sm">
      <div className="space-y-3">
        {target?.action === "rembourse" && (
          <p className="px-3 py-2 rounded-lg bg-[#FFF5E5] text-[#8A5A00]" style={{ fontSize: "0.78rem" }}>
            ⚠️ Cette action ne déclenche pas un remboursement automatique chez l'opérateur. Effectuer le remboursement côté provider, puis confirmer ici.
          </p>
        )}
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Motif <span className="text-red-600">*</span></span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Indiquez le motif (notifié au membre, conservé dans l'audit)"
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.85rem" }}
          />
          <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>Minimum 3 caractères.</p>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
          <button
            onClick={() => ok && onConfirm(reason.trim())}
            disabled={!ok || busy}
            className="px-3 py-2 rounded-lg bg-[#C0263A] text-white disabled:opacity-50"
            style={{ fontSize: "0.8rem", fontWeight: 800 }}
          >
            {busy ? "Traitement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =========================================================================
// MESSAGES
// =========================================================================

export function MessagesTab() {
  const { session } = useAdminAuth();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ouvert" | "en_cours" | "resolu">("");
  const [mineOnly, setMineOnly] = useState(false);
  const adminUsername = session?.username ?? "";
  const fetcher = useMemo(
    () => (t: string) => api.adminConversations(t, { q: q || undefined, status: statusFilter || undefined, mine: mineOnly || undefined }),
    [q, statusFilter, mineOnly],
  );
  const convosQ = useAdminData(fetcher);
  const [selected, setSelected] = useState<string | null>(null);
  type AdminMsg = { id: string; from: string; author: string; body: string; createdAt: string; read: boolean; attachment?: { name: string; mime: string; size: number; path: string }; replyToId?: string; editedAt?: string; deletedAt?: string };
  const [thread, setThread] = useState<AdminMsg[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string; body: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [userTyping, setUserTyping] = useState(false);
  const userChannelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const userTypingTimerRef = useRef<number | null>(null);
  const lastAdminTypingRef = useRef(0);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const conversations = (() => {
    const seen = new Set<string>();
    return (convosQ.data?.conversations ?? []).filter((c) => {
      if (!c?.userId || seen.has(c.userId)) return false;
      seen.add(c.userId);
      return true;
    });
  })();
  const current = conversations.find((c) => c.userId === selected) ?? null;

  useEffect(() => {
    const sb = getSupabase();
    const ch = sb.channel("admin:chat", { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "message:new" }, ({ payload }) => {
      const uid = payload?.userId as string | undefined;
      const msg = payload?.message as { id: string; from: string; author: string; body: string; createdAt: string; read: boolean } | undefined;
      convosQ.reload();
      if (uid && msg && uid === selected) {
        setThread((t) => (t.some((m) => m.id === msg.id) ? t : [...t, msg]));
      }
    });
    ch.on("broadcast", { event: "message:read" }, ({ payload }) => {
      const uid = payload?.userId as string | undefined;
      convosQ.reload();
      if (uid && uid === selected) {
        setThread((t) => t.map((m) => (m.from === "conseiller" && !m.read ? { ...m, read: true } : m)));
      }
    });
    ch.on("broadcast", { event: "meta:update" }, () => { convosQ.reload(); });
    ch.on("broadcast", { event: "message:update" }, ({ payload }) => {
      const uid = payload?.userId as string | undefined;
      const msg = payload?.message as AdminMsg | undefined;
      convosQ.reload();
      if (uid && msg && uid === selected) {
        setThread((t) => t.map((m) => (m.id === msg.id ? msg : m)));
      }
    });
    ch.subscribe();
    return () => { sb.removeChannel(ch); };
  }, [selected, convosQ.reload]);

  // Open a per-user channel for the currently selected conversation so we can
  // see/send typing pings. Recreated whenever `selected` changes.
  useEffect(() => {
    setUserTyping(false);
    if (!selected) { userChannelRef.current = null; return; }
    const sb = getSupabase();
    const ch = sb.channel(`chat:${selected}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload?.from !== "user") return;
      setUserTyping(!!payload?.typing);
      if (userTypingTimerRef.current) window.clearTimeout(userTypingTimerRef.current);
      if (payload?.typing) userTypingTimerRef.current = window.setTimeout(() => setUserTyping(false), 3500);
    });
    ch.subscribe();
    userChannelRef.current = ch;
    return () => {
      if (userTypingTimerRef.current) window.clearTimeout(userTypingTimerRef.current);
      sb.removeChannel(ch);
      userChannelRef.current = null;
    };
  }, [selected]);

  function emitAdminTyping() {
    if (!userChannelRef.current) return;
    const now = Date.now();
    if (now - lastAdminTypingRef.current < 2000) return;
    lastAdminTypingRef.current = now;
    userChannelRef.current.send({ type: "broadcast", event: "typing", payload: { from: "conseiller", typing: true } });
  }

  async function openThread(uid: string) {
    if (!session?.token) return;
    setSelected(uid);
    setLoadingThread(true);
    try {
      const res = await api.adminConversation(session.token, uid);
      setThread(res.messages);
      convosQ.reload();
      api.adminMarkConversationRead(session.token, uid).catch(() => {});
    } catch (err) {
      toast.error("Échec de chargement", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setLoadingThread(false);
    }
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session?.token || !selected) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 10 Mo)"); return; }
    setSending(true);
    try {
      const res = await api.adminSendAttachment(session.token, selected, file, reply.trim() || undefined);
      setThread((t) => [...t, res.message]);
      setReply("");
      convosQ.reload();
    } catch (err) {
      toast.error("Envoi impossible", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setSending(false); }
  }

  async function send() {
    if (!session?.token || !selected) return;
    const content = reply.trim();
    if (!content) return;
    setSending(true);
    const editing = editingId;
    const replyId = replyTo?.id;
    setReply("");
    setEditingId(null);
    setReplyTo(null);
    try {
      if (editing) {
        const res = await api.adminEditMessage(session.token, selected, editing, content);
        setThread((t) => t.map((m) => (m.id === editing ? (res.message as AdminMsg) : m)));
      } else {
        const res = await api.adminReplyMessage(session.token, selected, content, replyId);
        setThread((t) => [...t, res.message as AdminMsg]);
      }
      convosQ.reload();
    } catch (err) {
      toast.error("Envoi impossible", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSending(false);
    }
  }

  async function adminDelete(id: string) {
    if (!session?.token || !selected) return;
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      const res = await api.adminDeleteMessage(session.token, selected, id);
      setThread((t) => t.map((m) => (m.id === id ? (res.message as AdminMsg) : m)));
    } catch (err) {
      toast.error("Suppression impossible", { description: err instanceof Error ? err.message : "Erreur" });
    }
  }
  function adminStartEdit(m: AdminMsg) { setEditingId(m.id); setReplyTo(null); setReply(m.body); }
  function adminCancelEdit() { setEditingId(null); setReply(""); }

  async function updateMeta(patch: { status?: "ouvert"|"en_cours"|"resolu"; assignee?: string|null }) {
    if (!session?.token || !selected) return;
    try {
      await api.adminUpdateConversationMeta(session.token, selected, patch);
      convosQ.reload();
    } catch (err) {
      toast.error("Mise à jour impossible", { description: err instanceof Error ? err.message : "Erreur" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3 h-[calc(100vh-180px)] min-h-[520px]">
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-black/5 flex items-center justify-between">
          <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>Conversations</span>
          <button onClick={() => convosQ.reload()} className="p-1.5 rounded-lg hover:bg-black/5" title="Rafraîchir">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-3 py-2 border-b border-black/5 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, email, n° membre, texte)"
              className="w-full pl-7 pr-7 py-1.5 rounded-lg border border-black/10"
              style={{ fontSize: "0.78rem" }}
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#888]" aria-label="Effacer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { v: "", label: "Tous" },
              { v: "ouvert", label: "Ouvert" },
              { v: "en_cours", label: "En cours" },
              { v: "resolu", label: "Résolu" },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setStatusFilter(o.v as typeof statusFilter)}
                className={`px-2 py-0.5 rounded-full border ${statusFilter === o.v ? "bg-[#0E1320] text-white border-[#0E1320]" : "bg-white text-[#666] border-black/10 hover:border-black/20"}`}
                style={{ fontSize: "0.68rem", fontWeight: 700 }}
              >
                {o.label}
              </button>
            ))}
            <label className="ml-auto inline-flex items-center gap-1 text-[#666]" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
              <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="accent-[#FF3B57]" />
              Mes conv.
            </label>
          </div>
        </div>
        <div className="divide-y divide-black/5 flex-1 min-h-0 overflow-y-auto">
          {convosQ.loading && <RowSkeleton />}
          {!convosQ.loading && conversations.length === 0 && (
            <div className="p-6 text-center text-[#666]" style={{ fontSize: "0.82rem" }}>Aucune conversation.</div>
          )}
          {conversations.map((c) => {
            const statusColor = c.status === "resolu" ? "#0F7A47" : c.status === "en_cours" ? "#B36B00" : "#2A6BFF";
            const statusBg = c.status === "resolu" ? "#E6F4EC" : c.status === "en_cours" ? "#FFF1DC" : "#E8F0FF";
            return (
              <button
                key={c.userId}
                onClick={() => openThread(c.userId)}
                className={`w-full text-left p-3 transition ${selected === c.userId ? "bg-[#FFF1F3]" : "hover:bg-black/[0.02]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate" style={{ fontSize: "0.84rem", fontWeight: 800 }}>{c.userName || c.userEmail}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor, fontSize: "0.62rem", fontWeight: 800 }}>
                      {c.status === "resolu" ? "Résolu" : c.status === "en_cours" ? "En cours" : "Ouvert"}
                    </span>
                    {c.unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF3B57] text-white" style={{ fontSize: "0.65rem", fontWeight: 800 }}>{c.unread}</span>
                    )}
                  </div>
                </div>
                <p className="truncate text-[#666] mt-0.5" style={{ fontSize: "0.74rem" }}>
                  {c.lastFrom === "user" ? "" : "Vous : "}{c.lastMessage}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[#999]" style={{ fontSize: "0.68rem" }}>{formatDate(c.lastAt)}</p>
                  {c.assignee && (
                    <span className="text-[#888] truncate ml-2" style={{ fontSize: "0.66rem", fontWeight: 700 }}>
                      → {c.assignee === adminUsername ? "moi" : c.assignee}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 flex flex-col min-h-0 overflow-hidden">
        {!current ? (
          <div className="flex-1 flex items-center justify-center text-[#666]" style={{ fontSize: "0.86rem" }}>
            Sélectionnez une conversation.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-black/5 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>{current.userName || current.userEmail}</p>
                <p className="text-[#666]" style={{ fontSize: "0.72rem" }}>
                  {current.userEmail}{current.memberNumber ? ` · ${current.memberNumber}` : ""}
                  {userTyping && <span className="ml-2 text-[#16B26A]" style={{ fontWeight: 700 }}>· écrit…</span>}
                </p>
              </div>
              <select
                value={current.status}
                onChange={(e) => updateMeta({ status: e.target.value as "ouvert"|"en_cours"|"resolu" })}
                className="px-2 py-1.5 rounded-lg border border-black/10 bg-white"
                style={{ fontSize: "0.74rem", fontWeight: 700 }}
                title="Statut de la conversation"
              >
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
              </select>
              {current.assignee === adminUsername ? (
                <button onClick={() => updateMeta({ assignee: null })} className="px-2.5 py-1.5 rounded-lg bg-[#FFF1F3] text-[#C0263A]" style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                  Désassigner
                </button>
              ) : (
                <button onClick={() => updateMeta({ assignee: adminUsername })} className="px-2.5 py-1.5 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                  {current.assignee ? `Reprendre (${current.assignee})` : "M'assigner"}
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#F9FAFC]">
              {loadingThread && <p className="text-[#666]">Chargement...</p>}
              {(() => { const byId = new Map(thread.map((m) => [m.id, m])); const seenIds = new Set<string>(); const uniqueThread = thread.filter((m) => { if (!m?.id || seenIds.has(m.id)) return false; seenIds.add(m.id); return true; }); return uniqueThread.map((m) => {
                const mine = m.from !== "user";
                const deleted = !!m.deletedAt;
                const quoted = m.replyToId ? byId.get(m.replyToId) : undefined;
                const canEdit = mine && !deleted && (Date.now() - new Date(m.createdAt).getTime() < 5 * 60 * 1000);
                const canDelete = mine && !deleted;
                return (
                  <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%]">
                      <div
                        className="px-3 py-2 rounded-2xl"
                        style={{
                          background: deleted ? "#EEE" : mine ? "linear-gradient(90deg,#0E1320,#2A1840)" : "white",
                          color: deleted ? "#888" : mine ? "white" : "#111",
                          fontSize: "0.86rem",
                          fontStyle: deleted ? "italic" : undefined,
                        }}
                      >
                        {quoted && !deleted && (
                          <div className="mb-1.5 px-2 py-1 rounded-lg border-l-2"
                            style={{ borderColor: mine ? "rgba(255,255,255,0.7)" : "#0E1320", background: mine ? "rgba(255,255,255,0.12)" : "#F5F6FA", fontSize: "0.7rem" }}>
                            <p style={{ fontWeight: 800 }}>{quoted.author}</p>
                            <p className="line-clamp-2 opacity-90">{quoted.body || (quoted.attachment ? "📎 Pièce jointe" : "")}</p>
                          </div>
                        )}
                        {deleted ? <span>Message supprimé</span> : <>
                          {m.attachment && (
                            <AttachmentView att={m.attachment} mine={mine} getUrl={async (path) => (await api.adminMessageAttachmentUrl(session!.token, path)).url} />
                          )}
                          {m.body && <div className={m.attachment ? "mt-2" : ""}>{m.body}</div>}
                        </>}
                      </div>
                      <p className={`text-[#888] mt-1 px-1 flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`} style={{ fontSize: "0.66rem" }}>
                        <span>{m.author} · {formatDate(m.createdAt)}{m.editedAt && !deleted ? " · modifié" : ""}</span>
                        {!deleted && (
                          <button onClick={() => setReplyTo({ id: m.id, author: m.author, body: m.body || (m.attachment ? "📎 Pièce jointe" : "") })}
                            className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#0E1320]" title="Répondre" aria-label="Répondre">
                            <Reply className="w-3 h-3" />
                          </button>
                        )}
                        {canEdit && <button onClick={() => adminStartEdit(m)} className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#0E1320]" title="Modifier"><Pencil className="w-3 h-3" /></button>}
                        {canDelete && <button onClick={() => adminDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#C0263A]" title="Supprimer"><Trash2 className="w-3 h-3" /></button>}
                      </p>
                    </div>
                  </div>
                );
              }); })()}
            </div>
            {(replyTo || editingId) && (
              <div className="px-3 py-2 border-t border-black/5 bg-[#F9FAFC] flex items-center gap-2">
                <div className="flex-1 min-w-0 border-l-2 border-[#0E1320] pl-2">
                  <p className="text-[#666] truncate" style={{ fontSize: "0.68rem", fontWeight: 800 }}>
                    {editingId ? "Modification du message" : `Réponse à ${replyTo?.author}`}
                  </p>
                  {replyTo && <p className="text-[#888] truncate" style={{ fontSize: "0.7rem" }}>{replyTo.body}</p>}
                </div>
                <button type="button" onClick={() => { setReplyTo(null); if (editingId) adminCancelEdit(); }} className="p-1 text-[#666] hover:text-[#0E1320]" aria-label="Annuler">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-3 border-t border-black/5 flex items-center gap-2"
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,audio/*,video/mp4,video/webm,text/plain"
                onChange={onPickFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending}
                className="p-2 rounded-xl border border-black/10 text-[#666] hover:text-[#0E1320] disabled:opacity-50"
                title="Joindre un fichier (max 10 Mo)"
                aria-label="Joindre"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={reply} onChange={(e) => { setReply(e.target.value); emitAdminTyping(); }}
                placeholder="Votre réponse au membre…"
                className="flex-1 px-3 py-2 rounded-xl border border-black/10"
                style={{ fontSize: "0.88rem" }}
                disabled={sending}
              />
              <button
                type="submit" disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1320] text-white disabled:opacity-50"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}
              >
                <Send className="w-3.5 h-3.5" /> Envoyer
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// BROADCAST
// =========================================================================

export function BroadcastTab() {
  const { session } = useAdminAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"info" | "success" | "warn">("info");
  const [channels, setChannels] = useState<Record<"in_app" | "push" | "email" | "sms", boolean>>({
    in_app: true, push: true, email: false, sms: false,
  });
  const [audienceKind, setAudienceKind] = useState<"all" | "active" | "department" | "profileType" | "sousProfil" | "couverture">("all");
  const [department, setDepartment] = useState("");
  const [profileType, setProfileType] = useState("");
  const [sousProfil, setSousProfil] = useState("");
  const [couverture, setCouverture] = useState("");
  const [busy, setBusy] = useState(false);
  const historyQ = useAdminData((t) => api.adminBroadcastHistory(t));
  const audienceQ = useAdminData((t) => api.adminBroadcastAudience(t));

  const available = historyQ.data?.channels ?? { in_app: true, push: false, email: false, sms: false };
  const history = historyQ.data?.entries ?? [];
  const aud = audienceQ.data;
  const estimated = useMemo(() => {
    if (!aud) return 0;
    if (audienceKind === "all") return aud.total;
    if (audienceKind === "active") return aud.active;
    if (audienceKind === "department") return aud.byDepartment?.[department] ?? 0;
    if (audienceKind === "profileType") return aud.byProfileType?.[profileType] ?? 0;
    if (audienceKind === "sousProfil") return aud.bySousProfil?.[sousProfil] ?? 0;
    if (audienceKind === "couverture") return aud.byCouverture?.[couverture] ?? 0;
    return 0;
  }, [aud, audienceKind, department, profileType, sousProfil, couverture]);

  const selectedChannels = (Object.keys(channels) as (keyof typeof channels)[]).filter((c) => channels[c]);

  async function send() {
    if (!session?.token) return;
    if (!title.trim() || !body.trim()) { toast.error("Titre et message requis"); return; }
    if (selectedChannels.length === 0) { toast.error("Sélectionnez au moins un canal"); return; }
    if (!window.confirm(`Envoyer à ${estimated} membre(s) via ${selectedChannels.length} canal/canaux ?`)) return;
    setBusy(true);
    try {
      const audience =
        audienceKind === "department" ? { kind: "department" as const, value: department || undefined } :
        audienceKind === "profileType" ? { kind: "profileType" as const, value: profileType || undefined } :
        audienceKind === "sousProfil" ? { kind: "sousProfil" as const, value: sousProfil || undefined } :
        audienceKind === "couverture" ? { kind: "couverture" as const, value: couverture || undefined } :
        { kind: audienceKind };
      const res = await api.adminBroadcast(session.token, {
        title: title.trim(), body: body.trim(), type,
        channels: selectedChannels, audience,
      });
      const parts: string[] = [];
      if (res.stats.in_app) parts.push(`${res.stats.in_app} in-app`);
      if (res.stats.push) parts.push(`${res.stats.push} push`);
      if (res.stats.email) parts.push(`${res.stats.email} email`);
      if (res.stats.sms) parts.push(`${res.stats.sms} SMS`);
      const issues: string[] = [];
      if (res.stats.sms_failed) issues.push(`${res.stats.sms_failed} SMS échoués`);
      if (res.stats.email_failed) issues.push(`${res.stats.email_failed} e-mails échoués`);
      if (res.stats.push_failed) issues.push(`${res.stats.push_failed} push échoués`);
      if (res.stats.no_phone) issues.push(`${res.stats.no_phone} sans téléphone`);
      if (res.stats.no_email) issues.push(`${res.stats.no_email} sans e-mail`);
      if (res.stats.opted_out) issues.push(`${res.stats.opted_out} désinscrits`);
      const desc = [parts.join(" · "), issues.join(" · ")].filter(Boolean).join(" — ");
      if (issues.length) {
        toast.warning(`Diffusion à ${res.recipients} membre(s)`, { description: desc });
      } else {
        toast.success(`Diffusion à ${res.recipients} membre(s)`, { description: desc || "Envoyé" });
      }
      setTitle(""); setBody("");
      historyQ.reload();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusy(false);
    }
  }

  const CHANNEL_META: { key: keyof typeof channels; label: string; desc: string }[] = [
    { key: "in_app", label: "In-app", desc: "Cloche de notifications" },
    { key: "push", label: "Push web", desc: "Notification système (PWA)" },
    { key: "email", label: "E-mail", desc: "Via Resend" },
    { key: "sms", label: "SMS", desc: "Via Termii" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 p-5">
        <h2 style={{ fontSize: "1.05rem", fontWeight: 900 }}>Diffuser une notification</h2>
        <p className="text-[#666] mt-1 mb-4" style={{ fontSize: "0.82rem" }}>
          Multi-canal · audience ciblée · historique conservé.
        </p>

        <label className="block mb-3">
          <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Titre</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="w-full px-3 py-2 rounded-lg border border-black/10"
            placeholder="Ex. Nouveau service disponible" style={{ fontSize: "0.88rem" }} />
        </label>
        <label className="block mb-3">
          <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={400}
            className="w-full px-3 py-2 rounded-lg border border-black/10"
            placeholder="Décrivez l'information à transmettre..." style={{ fontSize: "0.88rem" }} />
        </label>

        <div className="mb-4">
          <span className="block mb-2 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Canaux de diffusion</span>
          <div className="grid grid-cols-2 gap-2">
            {CHANNEL_META.map(({ key, label, desc }) => {
              const enabled = available[key];
              const checked = channels[key] && enabled;
              return (
                <label key={key}
                  className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    checked ? "border-[#FF3B57] bg-[#FFE5EB]/40" : "border-black/10 bg-white"
                  } ${!enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input type="checkbox" disabled={!enabled} checked={checked}
                    onChange={(e) => setChannels((c) => ({ ...c, [key]: e.target.checked }))}
                    className="mt-0.5" />
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 800 }}>{label}{!enabled ? " (non configuré)" : ""}</p>
                    <p className="text-[#888]" style={{ fontSize: "0.72rem" }}>{desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <label className="block">
            <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Type</span>
            <Select value={type} onChange={(v) => setType(v as any)} options={[
              ["info", "Information"], ["success", "Succès"], ["warn", "Alerte"],
            ]} />
          </label>
          <label className="block">
            <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Audience</span>
            <Select value={audienceKind} onChange={(v) => setAudienceKind(v as any)} options={[
              ["all", `Tous (${aud?.total ?? "—"})`],
              ["active", `Contrats actifs (${aud?.active ?? "—"})`],
              ["department", "Par département"],
              ["profileType", "Par type de profil"],
              ["sousProfil", "Par sous-profil / métier"],
              ["couverture", "Par besoin de couverture"],
            ]} />
          </label>
          {audienceKind === "department" && (
            <label className="block">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Département</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 bg-white w-full"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                <option value="">Choisir...</option>
                {Object.entries(aud?.byDepartment ?? {}).map(([dep, n]) => (
                  <option key={dep} value={dep}>{dep} ({n})</option>
                ))}
              </select>
            </label>
          )}
          {audienceKind === "profileType" && (
            <label className="block">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Type de profil</span>
              <select value={profileType} onChange={(e) => setProfileType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 bg-white w-full"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                <option value="">Choisir...</option>
                {Object.entries(aud?.byProfileType ?? {}).map(([t, n]) => (
                  <option key={t} value={t}>{t} ({n})</option>
                ))}
              </select>
            </label>
          )}
          {audienceKind === "sousProfil" && (
            <label className="block">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Sous-profil</span>
              <select value={sousProfil} onChange={(e) => setSousProfil(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 bg-white w-full"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                <option value="">Choisir...</option>
                {Object.entries(aud?.bySousProfil ?? {}).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                  <option key={s} value={s}>{s} ({n})</option>
                ))}
              </select>
            </label>
          )}
          {audienceKind === "couverture" && (
            <label className="block">
              <span className="block mb-1 text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Couverture souhaitée</span>
              <select value={couverture} onChange={(e) => setCouverture(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 bg-white w-full"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                <option value="">Choisir...</option>
                {Object.entries(aud?.byCouverture ?? {}).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                  <option key={c} value={c}>{c} ({n})</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="bg-[#F5F6FA] rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <span className="text-[#666] block" style={{ fontSize: "0.78rem" }}>Destinataires estimés</span>
            <span className="text-[#888]" style={{ fontSize: "0.68rem" }}>
              {audienceKind === "all" && `Tous les membres (${aud?.total ?? 0})`}
              {audienceKind === "active" && `Membres avec un contrat actif (${aud?.active ?? 0})`}
              {audienceKind === "department" && (department ? `Membres du département ${department}` : "Choisir un département")}
              {audienceKind === "profileType" && (profileType ? `Profil « ${profileType} »` : "Choisir un type de profil")}
              {audienceKind === "sousProfil" && (sousProfil ? `Sous-profil « ${sousProfil} »` : "Choisir un sous-profil")}
              {audienceKind === "couverture" && (couverture ? `Intéressés par « ${couverture} »` : "Choisir une couverture")}
              {audienceQ.data && ` · audience calculée${audienceQ.loading ? " (recalcul…)" : ""}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{estimated}</span>
            <button
              onClick={() => audienceQ.reload()}
              disabled={audienceQ.loading}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-black/10 hover:border-[#FF3B57] disabled:opacity-50"
              style={{ fontSize: "0.7rem", fontWeight: 700 }}
              title="Recalculer l'audience depuis les profils à jour"
            >
              <RefreshCw className={`w-3 h-3 ${audienceQ.loading ? "animate-spin" : ""}`} /> Recalculer
            </button>
          </div>
        </div>

        <button onClick={send} disabled={busy || estimated === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF3B57] text-white disabled:opacity-50"
          style={{ fontSize: "0.85rem", fontWeight: 800 }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          {busy ? "Envoi..." : `Diffuser à ${estimated} membre(s)`}
        </button>
      </div>

      <aside className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 900 }}>Historique</h3>
          <button onClick={() => historyQ.reload()} className="p-1.5 rounded-lg hover:bg-black/5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {historyQ.loading && <RowSkeleton />}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {history.map((h) => (
            <div key={h.id} className="p-3 rounded-xl border border-black/5 bg-[#FAFBFC]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{h.title}</p>
                <span className="text-[#999] shrink-0" style={{ fontSize: "0.68rem" }}>{formatDate(h.at)}</span>
              </div>
              <p className="text-[#666] line-clamp-2" style={{ fontSize: "0.74rem" }}>{h.body}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {h.channels.map((ch) => (
                  <span key={ch} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0E1320] text-white" style={{ fontSize: "0.66rem", fontWeight: 700 }}>
                    {ch} {(h.stats as any)[ch] ?? 0}
                  </span>
                ))}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FFE5EB] text-[#C0263A]" style={{ fontSize: "0.66rem", fontWeight: 700 }}>
                  {h.recipients} dest.
                </span>
                {(["sms_failed", "email_failed", "push_failed"] as const).map((k) => {
                  const n = (h.stats as any)[k] ?? 0;
                  if (!n) return null;
                  const label = k === "sms_failed" ? "SMS KO" : k === "email_failed" ? "email KO" : "push KO";
                  return (
                    <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FEE2E2] text-[#991B1B]" style={{ fontSize: "0.66rem", fontWeight: 700 }}>
                      {n} {label}
                    </span>
                  );
                })}
                {(["no_phone", "no_email", "opted_out"] as const).map((k) => {
                  const n = (h.stats as any)[k] ?? 0;
                  if (!n) return null;
                  const label = k === "no_phone" ? "sans tél" : k === "no_email" ? "sans e-mail" : "opt-out";
                  return (
                    <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#E5E7EB] text-[#374151]" style={{ fontSize: "0.66rem", fontWeight: 700 }}>
                      {n} {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          {!historyQ.loading && history.length === 0 && (
            <p className="text-center text-[#888] py-6" style={{ fontSize: "0.78rem" }}>Aucune diffusion encore.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

// =========================================================================
// AUDIT
// =========================================================================

const ALERT_RULES: { test: (action: string) => boolean; tone: "danger" | "warn" | "info"; label: string }[] = [
  { test: (a) => /payment\.echec|admin\.broadcast|claim\.rejet|account\.delete|admin\.login\.2fa/i.test(a), tone: "danger", label: "Critique" },
  { test: (a) => /payment\.confirme|claim\.declare|signup|subscribe/i.test(a), tone: "info", label: "Activité" },
  { test: (a) => /admin\./i.test(a), tone: "warn", label: "Admin" },
];
function alertFor(action: string) {
  return ALERT_RULES.find((r) => r.test(action));
}

export function AuditTab() {
  const [scope, setScope] = useState<"members" | "admins">("members");
  const dataQ = useAdminData((t) => api.adminAuditRecent(t));
  const adminAuditQ = useAdminData((t) => api.adminAuditAdmins(t));
  const [filter, setFilter] = useState<"all" | "critical" | "admin" | "payment" | "claim">("all");
  const [q, setQ] = useState("");
  const [live, setLive] = useState(true);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!live) return;
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    const ch = sb.channel(`admin:audit`)
      .on("broadcast", { event: "audit:new" }, () => {
        setPulse((p) => p + 1);
        if (t) clearTimeout(t);
        t = setTimeout(() => dataQ.reload(), 1200);
      })
      .subscribe();
    return () => { if (t) clearTimeout(t); sb.removeChannel(ch); };
  }, [live, dataQ.reload]);

  const entries = dataQ.data?.entries ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === "critical" && alertFor(e.action)?.tone !== "danger") return false;
      if (filter === "admin" && !/^admin\./i.test(e.action)) return false;
      if (filter === "payment" && !/payment\./i.test(e.action)) return false;
      if (filter === "claim" && !/claim\./i.test(e.action)) return false;
      if (!s) return true;
      return (e.action + " " + (e.userName ?? "") + " " + (e.userEmail ?? "")).toLowerCase().includes(s);
    });
  }, [entries, filter, q]);

  const criticalCount = entries.filter((e) => alertFor(e.action)?.tone === "danger").length;
  const adminCount = entries.filter((e) => /^admin\./i.test(e.action)).length;

  const adminEntries = adminAuditQ.data?.entries ?? [];
  const adminFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return adminEntries.filter((e) => {
      if (!s) return true;
      return `${e.username} ${e.action} ${e.role} ${e.ip}`.toLowerCase().includes(s);
    });
  }, [adminEntries, q]);

  if (scope === "admins") {
    return (
      <div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setScope("members")} className="rounded-xl p-3 text-left border bg-white border-black/5">
            <p className="text-[#888]" style={{ fontSize: "0.7rem", fontWeight: 700 }}>VUE</p>
            <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Activité membres</p>
          </button>
          <button onClick={() => setScope("admins")} className="rounded-xl p-3 text-left border bg-[#0E1320] text-white border-[#0E1320]">
            <p className="text-white/70" style={{ fontSize: "0.7rem", fontWeight: 700 }}>VUE COURANTE</p>
            <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Actions admin</p>
          </button>
        </div>
        <FiltersBar q={q} setQ={setQ} reload={adminAuditQ.reload}>{null}</FiltersBar>
        {adminAuditQ.loading && <RowSkeleton />}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
          {adminFiltered.map((e) => (
            <div key={e.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>
                  {e.action}
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[#F5F6FA] text-[#666]" style={{ fontSize: "0.66rem", fontWeight: 700 }}>{e.role}</span>
                </p>
                <span className="text-[#999] shrink-0" style={{ fontSize: "0.72rem" }}>{formatDate(e.at)}</span>
              </div>
              <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
                {e.username} · {e.ip}{e.ua ? ` · ${e.ua.slice(0, 60)}` : ""}
              </p>
              {e.meta && Object.keys(e.meta).length > 0 && (
                <p className="mt-2 text-[#555]" style={{ fontSize: "0.78rem" }}>{formatMeta(e.meta)}</p>
              )}
            </div>
          ))}
          {!adminAuditQ.loading && adminFiltered.length === 0 && (
            <div className="p-10 text-center text-[#666]">Aucune action admin enregistrée.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => setScope("members")} className="rounded-xl p-3 text-left border bg-[#0E1320] text-white border-[#0E1320]">
          <p className="text-white/70" style={{ fontSize: "0.7rem", fontWeight: 700 }}>VUE COURANTE</p>
          <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Activité membres</p>
        </button>
        <button onClick={() => setScope("admins")} className="rounded-xl p-3 text-left border bg-white border-black/5">
          <p className="text-[#888]" style={{ fontSize: "0.7rem", fontWeight: 700 }}>VUE</p>
          <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Actions admin</p>
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <button onClick={() => setFilter("all")} className={`rounded-xl p-3 text-left border transition ${filter === "all" ? "bg-[#0E1320] text-white border-[#0E1320]" : "bg-white border-black/5"}`}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700 }} className={filter === "all" ? "text-white/70" : "text-[#888]"}>TOTAL</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{entries.length}</p>
        </button>
        <button onClick={() => setFilter("critical")} className={`rounded-xl p-3 text-left border transition ${filter === "critical" ? "bg-[#FF3B57] text-white border-[#FF3B57]" : "bg-white border-black/5"}`}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700 }} className={filter === "critical" ? "text-white/80" : "text-[#888]"}>CRITIQUES</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{criticalCount}</p>
        </button>
        <button onClick={() => setFilter("admin")} className={`rounded-xl p-3 text-left border transition ${filter === "admin" ? "bg-[#8A4BFF] text-white border-[#8A4BFF]" : "bg-white border-black/5"}`}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700 }} className={filter === "admin" ? "text-white/80" : "text-[#888]"}>ADMIN</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 900 }}>{adminCount}</p>
        </button>
        <button onClick={() => setLive((l) => !l)} className={`rounded-xl p-3 text-left border transition ${live ? "bg-[#16B26A] text-white border-[#16B26A]" : "bg-white border-black/5"}`}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700 }} className={live ? "text-white/80" : "text-[#888]"}>{live ? "● LIVE" : "○ PAUSÉ"}</p>
          <p style={{ fontSize: "0.78rem", fontWeight: 800 }}>{pulse} évènement(s)</p>
        </button>
      </div>

      <FiltersBar q={q} setQ={setQ} reload={dataQ.reload}>
        <Select value={filter} onChange={(v) => setFilter(v as any)} options={[
          ["all", "Tous"], ["critical", "Critiques"], ["admin", "Admin"], ["payment", "Paiements"], ["claim", "Sinistres"],
        ]} />
      </FiltersBar>

      {dataQ.loading && <RowSkeleton />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {filtered.map((e) => {
          const al = alertFor(e.action);
          const tone = al?.tone;
          return (
            <div key={e.id} className="p-4 flex items-start gap-3">
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                tone === "danger" ? "bg-[#FF3B57]" : tone === "warn" ? "bg-[#FFB020]" : tone === "info" ? "bg-[#2A6BFF]" : "bg-[#999]"
              }`}></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>{auditActionLabel(e.action)}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {al && (
                      <span className={`px-1.5 py-0.5 rounded-md ${
                        tone === "danger" ? "bg-[#FFE5EB] text-[#C0263A]"
                        : tone === "warn" ? "bg-[#FFF5E5] text-[#8A5A00]"
                        : "bg-[#E8F0FF] text-[#1E4FCC]"
                      }`} style={{ fontSize: "0.66rem", fontWeight: 700 }}>{al.label}</span>
                    )}
                    <span className="text-[#999]" style={{ fontSize: "0.72rem" }}>{formatDate(e.at)}</span>
                  </div>
                </div>
                <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
                  {e.userName || "Sans nom"} · {e.userEmail || e.userId.slice(0, 8)}
                </p>
                {e.meta && Object.keys(e.meta).length > 0 && (
                  <p className="mt-2 text-[#555]" style={{ fontSize: "0.78rem" }}>
                    {formatMeta(e.meta)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {!dataQ.loading && filtered.length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucune entrée correspondante.</div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Shared bits
// =========================================================================

function FiltersBar({
  q, setQ, reload, children,
}: { q: string; setQ: (v: string) => void; reload: () => void; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-white"
          style={{ fontSize: "0.85rem" }}
        />
      </div>
      {children}
      <button
        onClick={reload}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5"
        style={{ fontSize: "0.78rem", fontWeight: 700 }}
      >
        <RefreshCw className="w-3.5 h-3.5" /> Actualiser
      </button>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-black/10 bg-white"
      style={{ fontSize: "0.82rem", fontWeight: 700 }}
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}

function HealthTile() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.health>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.health();
        if (cancelled) return;
        setData(res);
        setErr(null);
        setLoadedAt(Date.now());
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Erreur");
        setLoadedAt(Date.now());
      }
    };
    void load();
    const id = window.setInterval(load, 30_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const statusColor = err ? "#FF3B57" : data?.status === "ok" ? "#1E9E4A" : data?.status === "degraded" ? "#FF7A00" : "#999";
  const statusLabel = err ? "indisponible" : data?.status ?? "...";

  const chips: { label: string; on: boolean; hint?: string }[] = data ? [
    { label: data.integrations.kkiapaySandbox ? "KKiaPay (sandbox)" : "KKiaPay (live)", on: data.integrations.kkiapay },
    { label: "Resend", on: data.integrations.resend },
    { label: "Termii SMS", on: data.integrations.termii },
    { label: "Web Push (VAPID)", on: data.integrations.vapid },
    { label: "Admin TOTP", on: data.integrations.adminTotp },
    { label: "KV store", on: data.kv },
  ] : [];

  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor }} />
          <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Santé du serveur · {statusLabel}</p>
        </div>
        <p className="text-[#666]" style={{ fontSize: "0.72rem" }}>
          {data ? `rev ${data.rev} · KV ${data.latencyMs}ms` : err ? err : "..."}
          {loadedAt ? ` · MAJ ${Math.max(0, Math.round((Date.now() - loadedAt) / 1000))}s` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border"
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              background: c.on ? "#D6F5DC" : "#F3F3F3",
              borderColor: c.on ? "rgba(30,158,74,0.3)" : "rgba(0,0,0,0.08)",
              color: c.on ? "#1E6E36" : "#777",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.on ? "#1E9E4A" : "#BBB" }} />
            {c.label}
          </span>
        ))}
        {!data && !err && <span className="text-[#666]" style={{ fontSize: "0.78rem" }}>Sonde en cours...</span>}
      </div>
    </div>
  );
}

function BusinessKpiWidget() {
  const kpiQ = useAdminData((t) => api.adminKpi(t));
  const d = kpiQ.data;
  const fmtPct = (v: number | null) => v == null ? "—" : `${(v * 100).toFixed(1)}%`;
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  };
  const seenMonths = new Set<string>();
  const series = (d?.months ?? []).map((m, i) => {
    let label = monthLabel(m || "");
    if (!label || label === "Invalid Date") label = String(m ?? `m${i}`);
    while (seenMonths.has(label)) label = `${label}·${i}`;
    seenMonths.add(label);
    return {
      month: label,
      revenue: d!.revenueByMonth[i] ?? 0,
      subs: d!.subsByMonth[i] ?? 0,
      churn: d!.churnByMonth[i] ?? 0,
    };
  });
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>KPIs business · 12 mois</p>
        <button onClick={() => kpiQ.reload()} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
          <RefreshCw className="w-3 h-3" /> Actualiser
        </button>
      </div>
      {kpiQ.loading && !d ? <Empty /> : kpiQ.error ? <p className="text-red-600" style={{ fontSize: "0.78rem" }}>{kpiQ.error}</p> : d && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <KpiTile label="CA mois courant" value={formatXOF(d.summary.currentMonthRevenue)} sub={d.summary.momGrowth != null ? `${d.summary.momGrowth >= 0 ? "▲" : "▼"} ${(Math.abs(d.summary.momGrowth) * 100).toFixed(1)}% vs M-1` : "—"} tone={d.summary.momGrowth != null && d.summary.momGrowth < 0 ? "red" : "green"} />
            <KpiTile label="Conversion devis→contrat" value={fmtPct(d.summary.conversionRate)} sub={`${d.summary.totalQuotes} devis`} tone="blue" />
            <KpiTile label="Taux de churn" value={fmtPct(d.summary.churnRate)} sub={`${d.summary.cancelledTotal} résiliés`} tone={d.summary.churnRate > 0.1 ? "red" : "gray"} />
            <KpiTile label="Taux d'adoption" value={d.summary.totalUsers ? fmtPct(d.summary.usersWithContract / d.summary.totalUsers) : "—"} sub={`${d.summary.usersWithContract}/${d.summary.totalUsers} membres`} tone="blue" />
            <KpiTile label="Souscriptions assistées" value={String(d.summary.assistedSubscriptions)} sub="via conseiller" tone="orange" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2" style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={56} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={36} domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="revenue" name="CA (XOF)" fill="#16B26A" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="subs" name="Souscriptions" fill="#2A6BFF" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="churn" name="Résiliations" fill="#FF3B57" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="mb-2 text-[#666]" style={{ fontSize: "0.75rem", fontWeight: 700 }}>TOP produits par CA</p>
              {d.topProducts.length === 0 ? <Empty /> : (
                <ul className="space-y-1.5">
                  {d.topProducts.map((p, i) => {
                    const max = d.topProducts[0]?.revenue || 1;
                    const pct = Math.round((p.revenue / max) * 100);
                    return (
                      <li key={`prod-${i}-${p.product ?? ""}`}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="truncate" style={{ fontSize: "0.78rem", fontWeight: 700 }}>{i + 1}. {p.product}</span>
                          <span className="shrink-0 text-[#666]" style={{ fontSize: "0.72rem" }}>{formatXOF(p.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                          <div className="h-full bg-[#0E1320]" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "blue" | "green" | "orange" | "red" | "gray" }) {
  const fg = tone === "blue" ? "#2A6BFF" : tone === "green" ? "#1E9E4A" : tone === "orange" ? "#FF7A00" : tone === "red" ? "#B42318" : "#0E1320";
  return (
    <div className="rounded-xl border border-black/5 bg-[#FAFAFC] p-3">
      <p className="text-[#666] truncate" style={{ fontSize: "0.7rem", fontWeight: 700 }}>{label}</p>
      <p className="mt-0.5" style={{ fontSize: "1.05rem", fontWeight: 800, color: fg }}>{value}</p>
      {sub && <p className="text-[#666] truncate" style={{ fontSize: "0.68rem" }}>{sub}</p>}
    </div>
  );
}

export function AgentPerformanceWidget() {
  const { session } = useAdminAuth();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [exporting, setExporting] = useState<string | null>(null);
  const perfQ = useAdminData(useCallback((t: string) => api.adminAgentsPerformance(t, days), [days]));
  const fmtSec = (s: number | null) => s == null ? "—" : s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}min` : `${(s / 3600).toFixed(1)}h`;
  async function downloadEnrollments(matricule?: string) {
    if (!session?.token) return;
    setExporting(matricule || "__all__");
    try {
      const blob = await api.adminDownloadEnrollmentsCsv(session.token, matricule ? { matricule } : {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ippoo-filleuls-${matricule || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Export téléchargé");
    } catch (err) {
      toast.error("Export impossible", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setExporting(null); }
  }
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p style={{ fontSize: "0.88rem", fontWeight: 800 }}>Performance par conseiller</p>
        <div className="flex items-center gap-2">
        <button
          onClick={() => downloadEnrollments()}
          disabled={exporting === "__all__"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/5 hover:bg-black/10 disabled:opacity-50"
          style={{ fontSize: "0.72rem", fontWeight: 700 }}
        >
          <Download className="w-3 h-3" /> Filleuls CSV
        </button>
        <button
          onClick={async () => {
            if (!session?.token) return;
            setExporting("__perf__");
            try {
              const blob = await api.adminDownloadAgentsPerfCsv(session.token, days);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ippoo-perf-agents-${days}j.csv`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 5000);
              toast.success("Export perf téléchargé");
            } catch (err) {
              toast.error("Export impossible", { description: err instanceof Error ? err.message : "Erreur" });
            } finally { setExporting(null); }
          }}
          disabled={exporting === "__perf__"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/5 hover:bg-black/10 disabled:opacity-50"
          style={{ fontSize: "0.72rem", fontWeight: 700 }}
        >
          <Download className="w-3 h-3" /> Perf CSV
        </button>
        <div className="inline-flex rounded-lg bg-black/5 p-0.5">
          {([7, 30, 90] as const).map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-2.5 py-1 rounded-md ${days === d ? "bg-white shadow-sm" : ""}`} style={{ fontSize: "0.72rem", fontWeight: 700 }}>
              {d}j
            </button>
          ))}
        </div>
        </div>
      </div>
      {perfQ.loading && !perfQ.data ? <Empty /> : perfQ.error ? <p className="text-red-600" style={{ fontSize: "0.78rem" }}>{perfQ.error}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: "0.78rem" }}>
            <thead className="text-[#666]" style={{ fontSize: "0.7rem" }}>
              <tr className="text-left border-b border-black/10">
                <th className="py-2 pr-2">Matricule</th>
                <th className="py-2 pr-2">Conseiller</th>
                <th className="py-2 pr-2 text-right">Sinistres décidés</th>
                <th className="py-2 pr-2 text-right">Contrats souscrits</th>
                <th className="py-2 pr-2 text-right">KYC validés</th>
                <th className="py-2 pr-2 text-right">Encaissé</th>
                <th className="py-2 pr-2 text-right">Réponses</th>
                <th className="py-2 pr-2 text-right">Tps réponse</th>
                <th className="py-2 pr-2 text-right" title="% de réponses envoyées en moins d'1 h">SLA &lt;1h</th>
                <th className="py-2 pr-2 text-right">Filleuls</th>
              </tr>
            </thead>
            <tbody>
              {(perfQ.data?.agents ?? []).map((a) => (
                <tr key={a.matricule} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="py-1.5 pr-2 font-mono" style={{ fontSize: "0.72rem" }}>{a.matricule}</td>
                  <td className="py-1.5 pr-2 truncate max-w-[180px]">
                    {a.name || a.email || "—"}
                    {a.messages.sent === 0 && (a.enrollments?.total ?? 0) > 0 && (
                      <span
                        className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md align-middle"
                        style={{ fontSize: "0.62rem", fontWeight: 800, background: "#FEE4E2", color: "#B42318" }}
                        title={`Aucun message envoyé sur ${days}j alors que ce conseiller a ${a.enrollments?.total ?? 0} filleul(s).`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 text-right">{a.claims.decided} <span className="text-[#666]" style={{ fontSize: "0.68rem" }}>(✓{a.claims.validated} ✗{a.claims.rejected})</span></td>
                  <td className="py-1.5 pr-2 text-right">{a.contracts.subscribed}</td>
                  <td className="py-1.5 pr-2 text-right">{a.kyc.validated}/{a.kyc.decided}</td>
                  <td className="py-1.5 pr-2 text-right">{formatXOF(a.payments.amount)}</td>
                  <td className="py-1.5 pr-2 text-right">{a.messages.sent}</td>
                  <td className="py-1.5 pr-2 text-right">{fmtSec(a.messages.avgResponseSec)}</td>
                  <td className="py-1.5 pr-2 text-right" style={{ color: (a.messages as any).slaUnder1hPct == null ? "#666" : (a.messages as any).slaUnder1hPct >= 80 ? "#0F7A47" : (a.messages as any).slaUnder1hPct >= 50 ? "#B85400" : "#B42318", fontWeight: 800 }}>
                    {(a.messages as any).slaUnder1hPct == null ? "—" : `${(a.messages as any).slaUnder1hPct}%`}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    <button
                      onClick={() => downloadEnrollments(a.matricule)}
                      disabled={exporting === a.matricule}
                      className="inline-flex items-center gap-1 hover:underline disabled:opacity-50"
                      style={{ fontSize: "0.78rem", fontWeight: 700 }}
                      title="Exporter les filleuls de ce conseiller (CSV)"
                    >
                      {a.enrollments?.window ?? 0} <span className="text-[#666]" style={{ fontSize: "0.68rem" }}>/ {a.enrollments?.total ?? 0}</span>
                      <Download className="w-3 h-3 opacity-60" />
                    </button>
                  </td>
                </tr>
              ))}
              {(perfQ.data?.agents ?? []).length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center text-[#666]" style={{ fontSize: "0.78rem" }}>Aucun conseiller enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: "blue" | "orange" | "green" }) {
  const bg = tone === "blue" ? "#DDE7FF" : tone === "orange" ? "#FFE8D6" : "#D6F5DC";
  const fg = tone === "blue" ? "#2A6BFF" : tone === "orange" ? "#FF7A00" : "#1E9E4A";
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color: fg }} />
      </div>
      <div className="min-w-0">
        <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>{label}</p>
        <p className="truncate" style={{ fontSize: "1.1rem", fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({ label, tone, onClick, disabled }: { label: string; tone: "green" | "red" | "blue" | "gray"; onClick: () => void; disabled?: boolean }) {
  const bg = tone === "green" ? "#1E9E4A" : tone === "red" ? "#FF3B57" : tone === "blue" ? "#2A6BFF" : "#0E1320";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg, fontSize: "0.8rem", fontWeight: 700 }}
    >
      {label}
    </button>
  );
}

// =========================================================================
// MEDIA UPLOAD — bouton réutilisable pour téléverser une image dans le bucket
// public media. Évite à l'admin d'avoir à héberger ses bannières/logos ailleurs
// puis copier-coller une URL — il sélectionne le fichier, on l'upload, on
// remonte l'URL publique au parent. Réutilisable pour Promos, Partners, etc.
// =========================================================================

function MediaUploadButton({ folder, onUploaded, accept = "image/*", label = "Téléverser" }: {
  folder: string;
  onUploaded: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const { session } = useAdminAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function handle(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session) return;
    setBusy(true);
    try {
      const r = await api.adminUploadMedia(session.token, file, folder);
      onUploaded(r.url);
      toast.success("Image téléversée");
    } catch (err) {
      toast.error("Échec téléversement", { description: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handle} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 disabled:opacity-50"
        style={{ fontSize: "0.72rem", fontWeight: 700 }}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
        {busy ? "Téléversement..." : label}
      </button>
    </>
  );
}

// =========================================================================
// PROMOS — éditeur du carrousel d'annonces
// =========================================================================

export function PromosTab() {
  const { session } = useAdminAuth();
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    api.promos().then((r) => {
      const persisted = r.promos ?? [];
      if (persisted.length > 0) {
        setItems(persisted);
      } else {
        // Pré-remplit l'éditeur avec les annonces par défaut affichées publiquement,
        // afin qu'elles soient immédiatement éditables (titre, CTA, image, etc.).
        setItems(defaultPromoSlides.map((s) => ({
          id: s.id,
          image: s.image,
          alt: s.alt,
          to: s.to ?? "",
          title: "",
          description: "",
          ctaLabel: "",
          theme: "dark",
          active: true,
        })));
      }
    }).finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, []);

  function update(i: number, patch: Partial<Promo>) {
    setItems((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function add() {
    setItems((arr) => [...arr, { id: `promo_${Date.now()}`, image: "", alt: "Annonce IPPOO", to: "", title: "", description: "", ctaLabel: "", theme: "dark", active: true }]);
  }
  function remove(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setItems((arr) => {
      const next = arr.slice();
      const j = i + dir;
      if (j < 0 || j >= next.length) return arr;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  async function save() {
    if (!session?.token) return;
    setSaving(true);
    try {
      const r = await api.adminUpdatePromos(session.token, items);
      setItems(r.promos);
      toast.success("Carrousel enregistré");
    } catch (err) {
      const details = (err as any)?.details as { index: number; field: string; message: string }[] | undefined;
      if (Array.isArray(details) && details.length > 0) {
        toast.error("Validation échouée", {
          description: details.slice(0, 5).map((e) => `#${e.index + 1} ${e.field}: ${e.message}`).join("\n"),
        });
      } else {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center justify-between gap-2">
        <div>
          <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Annonces du carrousel</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Affichées sur l'accueil public et le tableau de bord client.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: "#FF3B57", fontSize: "0.8rem", fontWeight: 800 }}>
            <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {loading && <RowSkeleton />}
      {!loading && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-[#666]">
          Aucune annonce. Cliquez sur « Ajouter » pour créer votre première bannière.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl border border-black/5 p-4 space-y-3">
            <PromoPreview slide={p} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Image</label>
                <MediaUploadButton folder="promos" onUploaded={(url) => update(i, { image: url })} />
              </div>
              <input type="url" value={p.image} onChange={(e) => update(i, { image: e.target.value })} placeholder="Téléversez un fichier ou collez une URL" className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Titre (optionnel, max 120)</label>
              <input type="text" value={p.title ?? ""} maxLength={120} onChange={(e) => update(i, { title: e.target.value })} placeholder="Protégez votre santé dès 500 FCFA" className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Description (optionnel, max 280)</label>
              <textarea value={p.description ?? ""} maxLength={280} rows={2} onChange={(e) => update(i, { description: e.target.value })} placeholder="Couverture maladie immédiate, sans questionnaire médical." className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57] resize-none" style={{ fontSize: "0.82rem" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Texte alternatif</label>
                <input type="text" value={p.alt} onChange={(e) => update(i, { alt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Lien cible (optionnel)</label>
                <input type="text" value={p.to ?? ""} onChange={(e) => update(i, { to: e.target.value })} placeholder="/produits/sante-maladie" className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
              </div>
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Libellé bouton CTA (optionnel, max 40)</label>
              <input type="text" value={p.ctaLabel ?? ""} maxLength={40} onChange={(e) => update(i, { ctaLabel: e.target.value })} placeholder="Souscrire maintenant" className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
              {p.ctaLabel && !p.to && (
                <p className="mt-1 text-amber-700" style={{ fontSize: "0.7rem" }}>Renseignez un lien cible pour activer le CTA.</p>
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="inline-flex items-center gap-2" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                <input type="checkbox" checked={p.active !== false} onChange={(e) => update(i, { active: e.target.checked })} />
                Active
              </label>
              <label className="inline-flex items-center gap-2" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#666" }}>
                Thème
                <select value={p.theme ?? "dark"} onChange={(e) => update(i, { theme: e.target.value === "light" ? "light" : "dark" })} className="px-2 py-1 rounded-lg border border-black/10 bg-white" style={{ fontSize: "0.75rem" }}>
                  <option value="dark">Sombre (image claire)</option>
                  <option value="light">Clair (image sombre)</option>
                </select>
              </label>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 rounded-lg bg-black/5 disabled:opacity-30" style={{ fontSize: "0.78rem" }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="px-2 py-1 rounded-lg bg-black/5 disabled:opacity-30" style={{ fontSize: "0.78rem" }}>↓</button>
                <button onClick={() => remove(i)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// TARIFS — édition & diffusion des prix des formules + fiches de renseignement
// Diffusé sur toute la plateforme (pages produits, souscription, devis, PDF).
// =========================================================================

export function TarifsTab() {
  const { session } = useAdminAuth();
  const [rows, setRows] = useState<PricingDraftRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    api.pricing()
      .then((r) => setRows(buildPricingDraft(r.pricing ?? {})))
      .catch(() => setRows(buildPricingDraft({})))
      .finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, []);

  function patchRow(id: string, patch: Partial<PricingDraftRow>) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function patchFormule(id: string, i: number, patch: Partial<PricingDraftRow["formules"][number]>) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, formules: r.formules.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) } : r)));
  }
  function addFormule(id: string) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, formules: [...r.formules, { nom: "Nouvelle formule", cotisation: "15 500 FCFA / mois", description: "" }] } : r)));
  }
  function removeFormule(id: string, i: number) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, formules: r.formules.filter((_, idx) => idx !== i) } : r)));
  }
  function patchGarantie(id: string, i: number, patch: Partial<PricingDraftRow["garanties"][number]>) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, garanties: r.garanties.map((g, idx) => (idx === i ? { ...g, ...patch } : g)) } : r)));
  }
  function addGarantie(id: string) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, garanties: [...r.garanties, { risque: "", priseEnCharge: "", plafond: "", franchise: "" }] } : r)));
  }
  function removeGarantie(id: string, i: number) {
    setRows((arr) => arr.map((r) => (r.id === id ? { ...r, garanties: r.garanties.filter((_, idx) => idx !== i) } : r)));
  }

  // --- Offres : ajout / suppression (offres ajoutées uniquement) ---
  function addOffer() {
    const slug = `offre_${Date.now().toString(36)}`;
    const row = blankOfferRow(slug);
    setRows((arr) => [...arr, row]);
    setOpenId(slug);
  }
  function removeOffer(id: string) {
    setRows((arr) => arr.filter((r) => r.id !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  }

  // --- Import / Export JSON du catalogue + tarifs ---
  function exportJson() {
    const map = draftToPricingMap(rows);
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-tarifs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON téléchargé");
  }
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== "object") throw new Error("Format invalide");
        setRows(buildPricingDraft(parsed));
        toast.success("Import chargé — cliquez sur « Diffuser » pour appliquer");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  }

  async function diffuser() {
    if (!session?.token) return;
    setSaving(true);
    try {
      const map = draftToPricingMap(rows);
      const r = await api.adminUpdatePricing(session.token, map);
      setPricingCache(r.pricing);
      setRows(buildPricingDraft(r.pricing));
      toast.success("Tarifs diffusés sur toute la plateforme");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de diffusion");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Offres, tarifs & fiches de renseignement</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Éditez les offres (nom, catégorie, image, prix, formules, garanties), masquez-les ou créez-en de nouvelles. La diffusion met à jour le site public, la souscription, les devis et les PDF.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5 cursor-pointer" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <UploadCloud className="w-4 h-4" /> Importer
            <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          </label>
          <button onClick={exportJson} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={addOffer} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Nouvelle offre
          </button>
          <button onClick={diffuser} disabled={saving || loading} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: "#FF3B57", fontSize: "0.82rem", fontWeight: 800 }}>
            <Send className="w-4 h-4" /> {saving ? "Diffusion..." : "Diffuser"}
          </button>
        </div>
      </div>

      {loading && <RowSkeleton />}

      <div className="space-y-3">
        {rows.map((r) => {
          const open = openId === r.id;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : r.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-black/[0.02]"
              >
                <div className="min-w-0">
                  <p className="truncate inline-flex items-center gap-2" style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                    {r.name}
                    {r.added && <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "0.6rem", fontWeight: 800, background: "#DDE7FF", color: "#2A6BFF" }}>NOUVELLE</span>}
                    {r.hidden && <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "0.6rem", fontWeight: 800, background: "#FFE2E7", color: "#C0263A" }}>MASQUÉE</span>}
                  </p>
                  <p className="text-[#666]" style={{ fontSize: "0.74rem" }}>
                    {r.category === "assurance" ? "Micro-assurance" : "Assistance"} · {r.formules.length} formule(s) · {formatXOF(r.premium)} / {r.frequency}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-5 border-t border-black/5 pt-4">
                  {/* Offre (identité du produit) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p style={{ fontSize: "0.8rem", fontWeight: 800 }}>Offre</p>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                          <input type="checkbox" checked={r.hidden} onChange={(e) => patchRow(r.id, { hidden: e.target.checked })} />
                          Masquer
                        </label>
                        {r.added && (
                          <button onClick={() => removeOffer(r.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700" style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer l'offre
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Nom de l'offre</label>
                        <input value={r.name} onChange={(e) => patchRow(r.id, { name: e.target.value })} className={inputCls} style={{ fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Nom court</label>
                        <input value={r.shortName} onChange={(e) => patchRow(r.id, { shortName: e.target.value })} className={inputCls} style={{ fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Catégorie</label>
                        <select value={r.category} onChange={(e) => patchRow(r.id, { category: e.target.value as PricingDraftRow["category"] })} className={inputCls} style={{ fontSize: "0.82rem" }}>
                          <option value="assurance">Micro-assurance</option>
                          <option value="assistance">Assistance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Icône</label>
                        <select value={r.icon} onChange={(e) => patchRow(r.id, { icon: e.target.value })} className={inputCls} style={{ fontSize: "0.82rem" }}>
                          {PRODUCT_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Couleur accent</label>
                        <input value={r.color} onChange={(e) => patchRow(r.id, { color: e.target.value })} placeholder="#2A6BFF" className={inputCls} style={{ fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Couleur douce (fond)</label>
                        <input value={r.soft} onChange={(e) => patchRow(r.id, { soft: e.target.value })} placeholder="#DDE7FF" className={inputCls} style={{ fontSize: "0.82rem" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Image (URL)</label>
                        <MediaUploadButton folder="offres" onUploaded={(url) => patchRow(r.id, { image: url })} />
                      </div>
                      <input value={r.image} onChange={(e) => patchRow(r.id, { image: e.target.value })} placeholder="Téléversez ou collez une URL" className={inputCls} style={{ fontSize: "0.82rem" }} />
                    </div>
                    <div>
                      <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Description courte</label>
                      <textarea value={r.desc} rows={2} onChange={(e) => patchRow(r.id, { desc: e.target.value })} className={`${inputCls} resize-none`} style={{ fontSize: "0.82rem" }} />
                    </div>
                    <div>
                      <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Points clés (séparés par une virgule)</label>
                      <input value={r.perks.join(", ")} onChange={(e) => patchRow(r.id, { perks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Vol & casse, Assistance 24/7, …" className={inputCls} style={{ fontSize: "0.82rem" }} />
                    </div>
                  </div>

                  {/* Tarif de référence */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Cotisation de référence (FCFA)</label>
                      <input type="number" min={0} value={r.premium} onChange={(e) => patchRow(r.id, { premium: Number(e.target.value) || 0 })} className={inputCls} style={{ fontSize: "0.82rem" }} />
                    </div>
                    <div>
                      <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Périodicité</label>
                      <input type="text" value={r.frequency} onChange={(e) => patchRow(r.id, { frequency: e.target.value })} placeholder="mensuel" className={inputCls} style={{ fontSize: "0.82rem" }} />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block mb-1" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666" }}>Délai de carence</label>
                      <input type="text" value={r.delaiCarence} onChange={(e) => patchRow(r.id, { delaiCarence: e.target.value })} className={inputCls} style={{ fontSize: "0.82rem" }} />
                    </div>
                  </div>

                  {/* Formules */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontSize: "0.8rem", fontWeight: 800 }}>Formules & tarifs</p>
                      <button onClick={() => addFormule(r.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        <Plus className="w-3.5 h-3.5" /> Formule
                      </button>
                    </div>
                    <div className="space-y-2">
                      {r.formules.map((f, i) => (
                        <div key={i} className="rounded-xl border border-black/10 p-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input value={f.nom} onChange={(e) => patchFormule(r.id, i, { nom: e.target.value })} placeholder="Nom de la formule" className={inputCls} style={{ fontSize: "0.82rem" }} />
                            <input value={f.cotisation} onChange={(e) => patchFormule(r.id, i, { cotisation: e.target.value })} placeholder="15 500 FCFA / mois" className={inputCls} style={{ fontSize: "0.82rem" }} />
                          </div>
                          <textarea value={f.description} rows={2} onChange={(e) => patchFormule(r.id, i, { description: e.target.value })} placeholder="Description de la formule" className={`${inputCls} resize-none`} style={{ fontSize: "0.82rem" }} />
                          <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                              <input type="checkbox" checked={!!f.highlight} onChange={(e) => patchFormule(r.id, i, { highlight: e.target.checked })} />
                              Mise en avant
                            </label>
                            <button onClick={() => removeFormule(r.id, i)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700" style={{ fontSize: "0.74rem", fontWeight: 700 }}>
                              <Trash2 className="w-3.5 h-3.5" /> Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                      {r.formules.length === 0 && <p className="text-[#999]" style={{ fontSize: "0.76rem" }}>Aucune formule.</p>}
                    </div>
                  </div>

                  {/* Fiche de renseignement — garanties */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontSize: "0.8rem", fontWeight: 800 }}>Fiche de renseignement — tableau des garanties</p>
                      <button onClick={() => addGarantie(r.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        <Plus className="w-3.5 h-3.5" /> Ligne
                      </button>
                    </div>
                    <div className="space-y-2">
                      {r.garanties.map((g, i) => (
                        <div key={i} className="rounded-xl border border-black/10 p-3 grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2 items-center">
                          <input value={g.risque} onChange={(e) => patchGarantie(r.id, i, { risque: e.target.value })} placeholder="Risque couvert" className={inputCls} style={{ fontSize: "0.8rem" }} />
                          <input value={g.priseEnCharge} onChange={(e) => patchGarantie(r.id, i, { priseEnCharge: e.target.value })} placeholder="Prise en charge" className={inputCls} style={{ fontSize: "0.8rem" }} />
                          <input value={g.plafond} onChange={(e) => patchGarantie(r.id, i, { plafond: e.target.value })} placeholder="Plafond" className={inputCls} style={{ fontSize: "0.8rem" }} />
                          <input value={g.franchise} onChange={(e) => patchGarantie(r.id, i, { franchise: e.target.value })} placeholder="Franchise" className={inputCls} style={{ fontSize: "0.8rem" }} />
                          <button onClick={() => removeGarantie(r.id, i)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-700 shrink-0" aria-label="Retirer la ligne">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {r.garanties.length === 0 && <p className="text-[#999]" style={{ fontSize: "0.76rem" }}>Aucune garantie.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// PARTNERS — éditeur du réseau santé
// =========================================================================

export function PartnersTab() {
  const { session } = useAdminAuth();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    api.partners().then((r) => setItems(r.partners ?? [])).finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, []);

  function update(i: number, patch: Partial<Partner>) {
    setItems((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function add() {
    setItems((arr) => [...arr, { id: `pt_${Date.now()}`, name: "", kind: "clinique", address: "", city: "", phone: "", lat: 0, lng: 0, hours: "24/7" }]);
  }
  function remove(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }
  async function save() {
    if (!session?.token) return;
    setSaving(true);
    try {
      const r = await api.adminUpdatePartners(session.token, items);
      setItems(r.partners);
      toast.success("Partenaires enregistrés");
    } catch (err) {
      const details = (err as any)?.details as { index: number; field: string; message: string }[] | undefined;
      if (Array.isArray(details) && details.length > 0) {
        toast.error("Validation échouée", {
          description: details.slice(0, 5).map((e) => `#${e.index + 1} ${e.field}: ${e.message}`).join("\n"),
        });
      } else {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center justify-between gap-2">
        <div>
          <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Réseau partenaires santé</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Cliniques, pharmacies, hôpitaux affichés aux membres dans l'onglet Partenaires.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: "#FF3B57", fontSize: "0.8rem", fontWeight: 800 }}>
            <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {loading && <RowSkeleton />}
      {!loading && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-[#666]">
          Aucun partenaire. Cliquez sur « Ajouter » pour créer le premier établissement.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl border border-black/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>{p.name || "Nouveau partenaire"}</p>
              <button onClick={() => remove(i)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AdminInput label="Nom" value={p.name} onChange={(v) => update(i, { name: v })} />
              <div>
                <label className="block mb-1" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666" }}>Type</label>
                <select value={p.kind} onChange={(e) => update(i, { kind: e.target.value as Partner["kind"] })} className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }}>
                  <option value="clinique">Clinique</option>
                  <option value="pharmacie">Pharmacie</option>
                  <option value="hopital">Hôpital</option>
                </select>
              </div>
              <AdminInput label="Adresse" value={p.address} onChange={(v) => update(i, { address: v })} />
              <AdminInput label="Ville" value={p.city} onChange={(v) => update(i, { city: v })} />
              <AdminInput label="Téléphone" value={p.phone} onChange={(v) => update(i, { phone: v })} />
              <AdminInput label="Horaires" value={p.hours} onChange={(v) => update(i, { hours: v })} />
              <AdminInput label="Latitude" value={String(p.lat)} onChange={(v) => update(i, { lat: Number(v) || 0 })} />
              <AdminInput label="Longitude" value={String(p.lng)} onChange={(v) => update(i, { lng: Number(v) || 0 })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block mb-1" style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666" }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]" style={{ fontSize: "0.82rem" }} />
    </div>
  );
}

// =========================================================================
// SITE — CMS du contenu public
// =========================================================================

const SITE_FIELDS: { key: keyof SiteContent; label: string; type: "text" | "textarea"; hint?: string }[] = [
  { key: "brandName", label: "Nom de la marque", type: "text" },
  { key: "tagline", label: "Slogan", type: "text", hint: "Phrase courte affichée à côté du logo." },
  { key: "heroTitle", label: "Titre principal (page d'accueil)", type: "text" },
  { key: "heroSubtitle", label: "Sous-titre (page d'accueil)", type: "textarea" },
  { key: "aboutShort", label: "Présentation courte (À propos)", type: "textarea" },
  { key: "contactEmail", label: "E-mail de contact", type: "text" },
  { key: "contactPhone", label: "Téléphone de contact", type: "text" },
  { key: "contactAddress", label: "Adresse du siège", type: "text" },
  { key: "whatsapp", label: "Numéro WhatsApp", type: "text" },
  { key: "facebook", label: "Lien Facebook", type: "text", hint: "URL complète, ex. https://facebook.com/ippoo" },
  { key: "instagram", label: "Lien Instagram", type: "text" },
  { key: "linkedin", label: "Lien LinkedIn", type: "text" },
];

export function SiteTab() {
  const { session } = useAdminAuth();
  const [data, setData] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.site().then((r) => setData(r.site)).finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!session?.token || !data) return;
    setSaving(true);
    try {
      const r = await api.adminUpdateSite(session.token, data);
      setData(r.site);
      toast.success("Contenu du site enregistré");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return <RowSkeleton />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center justify-between gap-2">
        <div>
          <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Contenu du site public</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Les modifications sont immédiatement visibles sur l'accueil, la page À propos et le pied de page.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white disabled:opacity-60"
          style={{ background: "#FF3B57", fontSize: "0.8rem", fontWeight: 800 }}
        >
          <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-5 space-y-4">
        {SITE_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                value={data[f.key] ?? ""}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57] resize-y"
                style={{ fontSize: "0.85rem" }}
              />
            ) : (
              <input
                type="text"
                value={data[f.key] ?? ""}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#FF3B57]"
                style={{ fontSize: "0.85rem" }}
              />
            )}
            {f.hint && <p className="text-[#888] mt-1" style={{ fontSize: "0.72rem" }}>{f.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// AGENTS (CRUD)
// =========================================================================

type AgentRow = {
  id: string; email: string; name: string; phone: string;
  matricule: string | null; createdAt: string; lastSignInAt: string | null;
  banned: boolean; presence: "online" | "online_stale" | "paused" | "offline";
};

export function AgentsTab() {
  const { session } = useAdminAuth();
  const isSuper = session?.role === "superadmin";
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRow | null>(null);
  const agentsQ = useAdminData((t) => api.adminListAgents(t));
  const portfoliosQ = useAdminData((t) => api.adminPortfolios(t));
  const portfolioByMat = useMemo(() => {
    const m = new Map<string, { clients: number; payments: number; lastPaymentAt: string | null }>();
    for (const p of portfoliosQ.data?.portfolios ?? []) m.set(p.matricule, p);
    return m;
  }, [portfoliosQ.data]);

  const [sort, setSort] = useState<"name" | "clients" | "payments" | "lastActivity">("name");
  const agents = (agentsQ.data?.agents ?? []) as AgentRow[];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = !s ? agents : agents.filter((a) => (a.name + " " + a.email + " " + (a.matricule ?? "") + " " + a.phone).toLowerCase().includes(s));
    const stat = (a: AgentRow) => (a.matricule ? portfolioByMat.get(a.matricule) : undefined);
    return [...base].sort((a, b) => {
      if (sort === "clients") return (stat(b)?.clients ?? 0) - (stat(a)?.clients ?? 0);
      if (sort === "payments") return (stat(b)?.payments ?? 0) - (stat(a)?.payments ?? 0);
      if (sort === "lastActivity") return String(stat(b)?.lastPaymentAt ?? "").localeCompare(String(stat(a)?.lastPaymentAt ?? ""));
      return (a.name || a.email).localeCompare(b.name || b.email);
    });
  }, [agents, q, sort, portfolioByMat]);

  async function toggleBan(a: AgentRow) {
    if (!session?.token) return;
    setBusy(a.id);
    try {
      await api.adminUpdateAgent(session.token, a.id, { banned: !a.banned });
      toast.success(a.banned ? "Conseiller réactivé" : "Conseiller désactivé");
      await agentsQ.reload();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(null); }
  }
  async function doDelete() {
    if (!session?.token || !deleteTarget) return;
    setBusy(deleteTarget.id);
    try {
      await api.adminDeleteAgent(session.token, deleteTarget.id);
      toast.success("Conseiller supprimé");
      setDeleteTarget(null);
      await agentsQ.reload();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h1 className="t-title1">Conseillers</h1>
        {isSuper && (
          <button onClick={() => setCreateOpen(true)} className="px-3 py-2 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            + Nouveau conseiller
          </button>
        )}
      </div>

      <div className="mb-4"><AgentPerformanceWidget /></div>

      <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, e-mail, matricule, téléphone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-white"
            style={{ fontSize: "0.85rem" }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg border border-black/10 bg-white"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          <option value="name">Trier : Nom</option>
          <option value="clients">Trier : Clients</option>
          <option value="payments">Trier : Paiements</option>
          <option value="lastActivity">Trier : Activité</option>
        </select>
        <button onClick={() => { agentsQ.reload(); portfoliosQ.reload(); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
        {isSuper && (
          <button
            onClick={async () => {
              if (!session?.token) return;
              if (!window.confirm("Réassigner toutes les conversations non attribuées en round-robin parmi les conseillers en ligne ?")) return;
              try {
                const res = await api.adminRebalancePortfolios(session.token);
                toast.success(`Rebalance effectué : ${res.rebalanced} conversation(s) réparti(es) sur ${res.candidates} conseiller(s).`);
                await portfoliosQ.reload();
              } catch (err) {
                toast.error("Échec du rebalance", { description: err instanceof Error ? err.message : "" });
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1320] text-white"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            Rebalance
          </button>
        )}
      </div>

      {!isSuper && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-[#FFF5E5] text-[#8A5A00]" style={{ fontSize: "0.78rem" }}>
          Lecture seule — seul un superadmin peut créer, modifier ou supprimer un conseiller.
        </p>
      )}

      {agentsQ.loading && <RowSkeleton />}
      {agentsQ.error && <p className="text-red-600">{agentsQ.error}</p>}
      {!agentsQ.loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-[#666]">Aucun conseiller.</div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {filtered.map((a) => (
          <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>{a.name || "Sans nom"}</p>
                <span className={`px-2 py-0.5 rounded-full ${a.presence === "online" ? "bg-[#DBFBE7] text-[#0F7A47]" : a.presence === "paused" ? "bg-[#FFF5E5] text-[#8A5A00]" : "bg-black/5 text-[#666]"}`} style={{ fontSize: "0.68rem", fontWeight: 700 }}>
                  {a.presence === "online" ? "En ligne" : a.presence === "online_stale" ? "Inactif" : a.presence === "paused" ? "Pause" : "Hors ligne"}
                </span>
                {a.banned && <span className="px-2 py-0.5 rounded-full bg-[#FFDDE2] text-[#C0263A]" style={{ fontSize: "0.68rem", fontWeight: 700 }}>Désactivé</span>}
              </div>
              <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
                {a.email}{a.matricule ? ` · ${a.matricule}` : ""}{a.phone ? ` · ${a.phone}` : ""}
              </p>
              <p className="text-[#999] mt-0.5" style={{ fontSize: "0.7rem" }}>
                Créé le {formatDate(a.createdAt)}{a.lastSignInAt ? ` · Dernière connexion ${formatDate(a.lastSignInAt)}` : " · Jamais connecté"}
              </p>
              {a.matricule && portfolioByMat.has(a.matricule) && (
                <p className="mt-1.5 inline-flex flex-wrap items-center gap-1.5" style={{ fontSize: "0.7rem" }}>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#E7F1FF] text-[#1B4FB6]" style={{ fontWeight: 800 }}>
                    {portfolioByMat.get(a.matricule)!.clients} client(s)
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#F2F4F8] text-[#444]" style={{ fontWeight: 800 }}>
                    {portfolioByMat.get(a.matricule)!.payments} paiement(s)
                  </span>
                  {portfolioByMat.get(a.matricule)!.lastPaymentAt && (
                    <span className="text-[#999]" style={{ fontWeight: 600 }}>
                      Dernier : {formatDate(portfolioByMat.get(a.matricule)!.lastPaymentAt!)}
                    </span>
                  )}
                </p>
              )}
            </div>
            {isSuper && (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditTarget(a)} disabled={busy === a.id} className="px-3 py-1.5 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Modifier</button>
                <button onClick={() => toggleBan(a)} disabled={busy === a.id} className="px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ fontSize: "0.74rem", fontWeight: 700, background: a.banned ? "#DBFBE7" : "#FFF5E5", color: a.banned ? "#0F7A47" : "#8A5A00" }}>
                  {a.banned ? "Réactiver" : "Désactiver"}
                </button>
                <button onClick={() => setDeleteTarget(a)} disabled={busy === a.id} className="px-3 py-1.5 rounded-lg bg-[#FFDDE2] text-[#C0263A] disabled:opacity-50" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Supprimer</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AgentFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={async () => { setCreateOpen(false); await agentsQ.reload(); }}
      />
      <AgentFormModal
        open={!!editTarget}
        mode="edit"
        agent={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => { setEditTarget(null); await agentsQ.reload(); }}
      />
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le conseiller" description={deleteTarget?.email} size="sm">
        <div className="space-y-3">
          <p className="px-3 py-2 rounded-lg bg-[#FFDDE2] text-[#C0263A]" style={{ fontSize: "0.82rem" }}>
            ⚠️ Action irréversible. Le compte Supabase sera supprimé, le matricule libéré et la présence effacée. Les conversations assignées resteront orphelines.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-3 py-2 rounded-lg bg-black/5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
            <button onClick={doDelete} disabled={busy === deleteTarget?.id} className="px-3 py-2 rounded-lg bg-[#C0263A] text-white disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
              {busy === deleteTarget?.id ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AgentFormModal({
  open, mode, agent, onClose, onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  agent?: AgentRow | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { session } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(agent?.email ?? "");
    setName(agent?.name ?? "");
    setPhone(agent?.phone ?? "");
    setPassword("");
  }, [open, agent]);

  const canSubmit = mode === "create"
    ? (/^\S+@\S+\.\S+$/.test(email) && name.trim().length > 0 && password.length >= 8)
    : (name.trim().length > 0 && (password === "" || password.length >= 8));

  async function submit() {
    if (!session?.token || !canSubmit) return;
    setBusy(true);
    try {
      if (mode === "create") {
        await api.adminCreateAgent(session.token, { email: email.trim(), password, name: name.trim(), phone: phone.trim() });
        toast.success("Conseiller créé");
      } else if (agent) {
        const body: { name?: string; phone?: string; password?: string } = { name: name.trim(), phone: phone.trim() };
        if (password) body.password = password;
        await api.adminUpdateAgent(session.token, agent.id, body);
        toast.success("Conseiller mis à jour");
      }
      await onSaved();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? "Nouveau conseiller" : `Modifier ${agent?.name || agent?.email}`} size="sm">
      <div className="space-y-3">
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Email{mode === "create" ? " *" : ""}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={mode === "edit"}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white disabled:bg-black/5" style={{ fontSize: "0.85rem" }} />
        </label>
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Nom complet *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white" style={{ fontSize: "0.85rem" }} />
        </label>
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Téléphone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white" style={{ fontSize: "0.85rem" }} />
        </label>
        <label className="block">
          <span className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
            Mot de passe{mode === "create" ? " * (8 caractères min.)" : " (laisser vide pour ne pas changer)"}
          </span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white" style={{ fontSize: "0.85rem" }} />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg bg-black/5 disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Annuler</button>
          <button onClick={submit} disabled={!canSubmit || busy} className="px-3 py-2 rounded-lg bg-[#0E1320] text-white disabled:opacity-50" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
            {busy ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function KycTab() {
  const { session } = useAdminAuth();
  const dataQ = useAdminData((t) => api.adminKycList(t));
  const [tab, setTab] = useUrlState<"pending" | "decided">("tab", "pending", { scope: "kyc", allowed: ["pending", "decided"] as const });
  const [selected, setSelected] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useUrlState<string>("type", "", { scope: "kyc" });
  const [search, setSearch] = useUrlState<string>("q", "", { scope: "kyc" });

  const rawList: any[] = tab === "pending" ? (dataQ.data?.pending ?? []) : (dataQ.data?.decided ?? []);
  const allTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of [...(dataQ.data?.pending ?? []), ...(dataQ.data?.decided ?? [])]) {
      if (r?.type) set.add(String(r.type));
    }
    return [...set].sort();
  }, [dataQ.data]);
  const list = useMemo(() => {
    const ql = search.trim().toLowerCase();
    return rawList.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (!ql) return true;
      return [r.userName, r.userEmail, r.memberNumber, r.type, r.note].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(ql));
    });
  }, [rawList, typeFilter, search]);

  async function decide(decision: "valide" | "rejete") {
    if (!session?.token || !selected) return;
    setBusy(true);
    try {
      await api.adminKycDecide(session.token, selected.userId, selected.id, decision, note);
      toast.success(decision === "valide" ? "Demande validée" : "Demande rejetée");
      setSelected(null);
      setNote("");
      await dataQ.reload();
    } catch (err) {
      toast.error("Échec", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h1 className="t-title1">Vérifications d'identité (KYC)</h1>
        <button onClick={() => dataQ.reload()} className="px-3 py-1.5 rounded-lg bg-white border border-black/10" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          <RefreshCw className="inline w-3.5 h-3.5 mr-1" /> Recharger
        </button>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {(["pending", "decided"] as const).map((k) => (
          <button
            key={k}
            onClick={() => { setTab(k); setSelected(null); }}
            className={`px-3 py-1.5 rounded-lg border ${tab === k ? "bg-[#0E1320] text-white border-[#0E1320]" : "bg-white border-black/10"}`}
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            {k === "pending" ? `En attente (${dataQ.data?.pending?.length ?? 0})` : `Décidées (${dataQ.data?.decided?.length ?? 0})`}
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setSelected(null); }}
          className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
          style={{ fontSize: "0.78rem", fontWeight: 700 }}
        >
          <option value="">Tous types</option>
          {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
          placeholder="Rechercher (nom, email, n° membre…)"
          className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white flex-1 min-w-[200px]"
          style={{ fontSize: "0.78rem" }}
        />
        {(typeFilter || search) && (
          <button
            onClick={() => { setTypeFilter(""); setSearch(""); }}
            className="px-2.5 py-1.5 rounded-lg bg-black/5 hover:bg-black/10"
            style={{ fontSize: "0.72rem", fontWeight: 700 }}
          >
            Reset
          </button>
        )}
        <span className="text-[#666]" style={{ fontSize: "0.72rem" }}>{list.length}/{rawList.length} affichées</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {dataQ.loading && <RowSkeleton />}
          {!dataQ.loading && list.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-[#666] border border-black/5">Aucune demande.</div>
          )}
          {list.map((req: any) => (
            <button
              key={`${req.userId}-${req.id}`}
              onClick={() => { setSelected(req); setNote(req.note ?? ""); }}
              className={`w-full text-left bg-white rounded-2xl p-4 border ${selected?.id === req.id ? "border-[#FF3B57]" : "border-black/5"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="truncate" style={{ fontSize: "0.92rem", fontWeight: 800 }}>{req.userName || req.userEmail || "Client"}</p>
                <span className="px-2 py-0.5 rounded-full" style={{
                  fontSize: "0.66rem", fontWeight: 800,
                  background: req.status === "valide" ? "#DBFBE7" : req.status === "rejete" ? "#FFDDE2" : "#FFF5E5",
                  color: req.status === "valide" ? "#0F7A47" : req.status === "rejete" ? "#C0263A" : "#8A5A00",
                }}>{req.status}</span>
              </div>
              <p className="text-[#666]" style={{ fontSize: "0.74rem" }}>
                {req.type} · {formatDate(req.createdAt)} · {(req.docs ?? []).length} pièce(s)
              </p>
              {req.decidedBy && <p className="text-[#888] mt-1" style={{ fontSize: "0.7rem" }}>Décidé par {req.decidedBy}</p>}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5 sticky top-4 self-start">
          {!selected ? (
            <p className="text-[#666] text-center py-10" style={{ fontSize: "0.85rem" }}>Sélectionnez une demande pour voir les détails.</p>
          ) : (
            <>
              <div className="mb-3">
                <p style={{ fontSize: "1rem", fontWeight: 900 }}>{selected.userName || selected.userEmail}</p>
                <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>{selected.userEmail} · {selected.memberNumber}</p>
              </div>
              <div className="mb-4">
                <p className="text-[#888] mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 800 }}>CHAMPS DÉCLARÉS</p>
                <ul className="space-y-1">
                  {Object.entries(selected.fields ?? {}).map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-2" style={{ fontSize: "0.82rem" }}>
                      <span className="text-[#666]">{k}</span><span style={{ fontWeight: 700 }}>{String(v) || "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <p className="text-[#888] mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 800 }}>PIÈCES JOINTES</p>
                <div className="flex flex-wrap gap-2">
                  {(selected.docs ?? []).map((d: any, i: number) => (
                    d?.url ? (
                      <a key={i} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-black/10 hover:border-[#FF3B57]" style={{ fontSize: "0.74rem" }}>
                        📎 {d.name}
                      </a>
                    ) : (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F5F6FA] text-[#666]" style={{ fontSize: "0.74rem" }}>📎 {d.name}</span>
                    )
                  ))}
                  {(!selected.docs || selected.docs.length === 0) && <span className="text-[#888]" style={{ fontSize: "0.78rem" }}>Aucun fichier.</span>}
                </div>
              </div>
              {selected.status === "pending" ? (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (raison de rejet, complément...)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-black/10 mb-3"
                    style={{ fontSize: "0.84rem" }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => decide("valide")} disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-[#16B26A] text-white disabled:opacity-50" style={{ fontSize: "0.82rem", fontWeight: 800 }}>Valider</button>
                    <button onClick={() => decide("rejete")} disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-[#C0263A] text-white disabled:opacity-50" style={{ fontSize: "0.82rem", fontWeight: 800 }}>Rejeter</button>
                  </div>
                </>
              ) : (
                <div className="px-3 py-3 rounded-lg bg-[#F5F6FA]" style={{ fontSize: "0.82rem" }}>
                  <p><span style={{ fontWeight: 800 }}>Décision :</span> {selected.status}</p>
                  {selected.decidedBy && <p className="text-[#666]">par {selected.decidedBy} · {formatDate(selected.decidedAt)}</p>}
                  {selected.note && <p className="mt-2">« {selected.note} »</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
