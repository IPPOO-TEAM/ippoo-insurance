import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { FileText, AlertTriangle, CreditCard, ArrowRight, ShieldCheck, Plus, MessageCircle, Users, Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw, Calendar } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useApiData, formatXOF, formatDate } from "../hooks";
import { api } from "../api";
import { PromoCarousel } from "../../components/PromoCarousel";
import { PageHeader, PageBody, Card } from "../AppShell";

export function DashboardPage() {
  const { user, session } = useAuth();
  const contractsQ = useApiData((t) => api.contracts(t));
  const checkedRef = useRef(false);
  useEffect(() => {
    if (checkedRef.current || !session?.access_token) return;
    checkedRef.current = true;
    api.checkRenewals(session.access_token).catch((err) => console.error("Renewal check failed", err));
  }, [session?.access_token]);
  const claimsQ = useApiData((t) => api.claims(t));
  const paymentsQ = useApiData((t) => api.payments(t));
  const beneficiariesQ = useApiData((t) => api.beneficiaries(t));

  const contracts = contractsQ.data?.contracts ?? [];
  const claims = claimsQ.data?.claims ?? [];
  const payments = paymentsQ.data?.payments ?? [];
  const beneficiaries = beneficiariesQ.data?.beneficiaries ?? [];

  const activeContracts = contracts.filter((c) => c.status === "active");
  const pendingClaims = claims.filter((c) => c.status === "en_cours");
  const totalPaid = payments.filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);
  const meQ = useApiData((t) => api.me(t));
  const profile = meQ.data?.profile;
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.name ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    "";
  const name = fullName;

  const chartData = buildChart(payments);
  const trend = computeTrend(chartData);
  const activity = buildActivity(contracts, claims, payments);

  return (
    <>
      <PageHeader
        title={`Bonjour, ${name.split(" ")[0] || ""}`}
        subtitle={
          activeContracts.length === 0
            ? "Aucun contrat actif pour le moment. Souscrivez à une couverture pour démarrer votre protection."
            : `Vos ${activeContracts.length} contrat${activeContracts.length > 1 ? "s" : ""} actif${activeContracts.length > 1 ? "s" : ""} protègent ${beneficiaries.length + 1} personne${beneficiaries.length ? "s" : ""}${profile?.city ? ` à ${profile.city}` : ""}.`
        }
        gradient
        trailing={
          <Link
            to="/espace-client/sinistres"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white text-[#0E1320]"
            style={{ fontSize: "0.78rem", fontWeight: 800 }}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Sinistre
          </Link>
        }
      />
      <PageBody>
        <Link
          to="/espace-client/souscription"
          className="flex items-center justify-between p-4 rounded-3xl text-white shadow-[0_14px_30px_-12px_rgba(255,59,87,0.5)] active:scale-[0.985] transition-transform"
          style={{ background: "#FF3B57" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p style={{ fontSize: "0.92rem", fontWeight: 900 }}>Souscrire en 2 minutes</p>
              <p className="text-white/85" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Devis instantané, 100% mobile</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <RenewalBanner contracts={contracts} />

        <PromoCarousel bare />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Contrats actifs" value={String(activeContracts.length)} color="#16B26A" soft="#DBFBE7" />
        <StatCard icon={AlertTriangle} label="Sinistres en cours" value={String(pendingClaims.length)} color="#FF7A00" soft="#FFE8D1" />
        <StatCard icon={CreditCard} label="Cotisations payées" value={formatXOF(totalPaid)} color="#2A6BFF" soft="#DDE7FF" />
        <StatCard icon={Users} label="Bénéficiaires" value={String(beneficiaries.length)} color="#FF4FAE" soft="#FFDCEE" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 900 }}>Cotisations sur 6 mois</h2>
              <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>Évolution de vos paiements confirmés.</p>
            </div>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: trend.bg, color: trend.color, fontSize: "0.7rem", fontWeight: 800 }}
            >
              <trend.icon className="w-3 h-3" /> {trend.label}
            </span>
          </div>
          <MiniBarChart data={chartData} />
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-black/5 shadow-sm">
          <h2 className="mb-4" style={{ fontSize: "1rem", fontWeight: 900 }}>Actions rapides</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickLink to="/espace-client/sinistres" icon={AlertTriangle} label="Sinistre" color="#FF7A00" soft="#FFE8D1" />
            <QuickLink to="/espace-client/cotisations" icon={CreditCard} label="Payer" color="#2A6BFF" soft="#DDE7FF" />
            <QuickLink to="/espace-client/beneficiaires" icon={Plus} label="Bénéficiaire" color="#FF4FAE" soft="#FFDCEE" />
            <QuickLink to="/espace-client/messagerie" icon={MessageCircle} label="Conseiller" color="#8A4BFF" soft="#EFE3FF" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Vos contrats actifs" link="/espace-client/contrats">
          {contractsQ.loading ? <Skeleton /> : activeContracts.length === 0 ? (
            <div className="rounded-xl bg-[#F5F6FA] p-4">
              <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Aucun contrat actif</p>
              <p className="text-[#666] mt-1" style={{ fontSize: "0.78rem" }}>
                Choisissez une couverture parmi nos 8 micro-assurances officielles à 15 500 FCFA / mois.
              </p>
              <Link
                to="/espace-client/souscription"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-xl text-white"
                style={{ background: "#FF3B57", fontSize: "0.78rem", fontWeight: 800 }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Souscrire maintenant
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeContracts.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F6FA]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#DBFBE7] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#16B26A]" />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>{c.product}</p>
                      <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>jusqu'au {formatDate(c.endDate)}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{formatXOF(c.premium)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Activité récente">
          {activity.length === 0 ? (
            <div className="rounded-xl bg-[#FFF6F0] border border-[#FF7A00]/15 p-4">
              <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0E1320" }}>Pas encore d'activité</p>
              <p className="text-[#666] mt-1" style={{ fontSize: "0.78rem" }}>
                Souscrivez à une couverture pour commencer à protéger vos proches.
              </p>
              <Link
                to="/espace-client/souscription"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-xl text-white"
                style={{ background: "#FF3B57", fontSize: "0.78rem", fontWeight: 800 }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Découvrir les couvertures
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.soft }}>
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>{a.title}</p>
                    <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>{formatDate(a.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
      </PageBody>
    </>
  );
}

function buildChart(payments: { amount: number; status: string; createdAt: string }[]) {
  const now = new Date();
  const buckets: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key: ym, label: d.toLocaleDateString("fr-FR", { month: "short" }), amount: 0 });
  }
  payments.filter((p) => p.status === "confirme").forEach((p) => {
    const d = new Date(p.createdAt);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff <= 5) buckets[5 - diff].amount += p.amount;
  });
  return buckets;
}

function computeTrend(data: { amount: number }[]) {
  const last = data[data.length - 1]?.amount ?? 0;
  const prev = data[data.length - 2]?.amount ?? 0;
  if (last === 0 && prev === 0) return { label: "Aucune donnée", icon: Minus, color: "#666", bg: "#F0F1F5" };
  if (last > prev) return { label: "En hausse", icon: TrendingUp, color: "#0F7A47", bg: "#DBFBE7" };
  if (last < prev) return { label: "En baisse", icon: TrendingDown, color: "#B85400", bg: "#FFE8D1" };
  return { label: "Stable", icon: Minus, color: "#2A6BFF", bg: "#DDE7FF" };
}

function buildActivity(contracts: any[], claims: any[], payments: any[]) {
  const items = [
    ...contracts.map((c) => ({ id: `c-${c.id}`, title: `Contrat ${c.product}`, date: c.startDate, icon: ShieldCheck, color: "#16B26A", soft: "#DBFBE7" })),
    ...claims.map((c) => ({ id: `s-${c.id}`, title: `Sinistre: ${c.type}`, date: c.createdAt, icon: AlertTriangle, color: "#FF7A00", soft: "#FFE8D1" })),
    ...payments.map((p) => ({ id: `p-${p.id}`, title: `Paiement ${formatXOF(p.amount)}`, date: p.createdAt, icon: CreditCard, color: "#2A6BFF", soft: "#DDE7FF" })),
  ];
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function MiniBarChart({ data }: { data: { key: string; label: string; amount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-3 sm:gap-5 h-60 pt-4 px-1">
      {data.map((d) => {
        const h = max > 0 ? Math.max(4, (d.amount / max) * 180) : 4;
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-full relative" style={{ height: 200 }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full rounded-t-lg transition-all" style={{ height: `${h}px`, background: "linear-gradient(180deg,#FF3B57,#FF7A00)" }} title={formatXOF(d.amount)} />
            </div>
            <p className="text-[#666] text-center truncate w-full" style={{ fontSize: "0.7rem", fontWeight: 700 }}>{d.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, soft }: { icon: any; label: string; value: string; color: string; soft: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: soft }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-[#666] truncate" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 700 }}>{label.toUpperCase()}</p>
          <p className="truncate" style={{ fontSize: "1.15rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, color, soft }: { to: string; icon: any; label: string; color: string; soft: string }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:scale-[1.02] transition-transform" style={{ background: soft }}>
      <Icon className="w-5 h-5" style={{ color }} />
      <span style={{ fontSize: "0.8rem", fontWeight: 800, color }}>{label}</span>
    </Link>
  );
}

function Panel({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: "1rem", fontWeight: 900 }}>{title}</h2>
        {link && (
          <Link to={link} className="text-[#FF3B57] inline-flex items-center gap-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return <div className="space-y-2"><div className="h-12 bg-[#F0F1F5] rounded-xl animate-pulse" /><div className="h-12 bg-[#F0F1F5] rounded-xl animate-pulse" /></div>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    en_cours: { bg: "#FFE8D1", color: "#B85400", label: "En cours" },
    valide: { bg: "#DDE7FF", color: "#2A6BFF", label: "Validé" },
    regle: { bg: "#DBFBE7", color: "#0F7A47", label: "Réglé" },
    rejete: { bg: "#FFDDE2", color: "#C0263A", label: "Rejeté" },
    confirme: { bg: "#DBFBE7", color: "#0F7A47", label: "Confirmé" },
    en_attente: { bg: "#FFE8D1", color: "#B85400", label: "En attente" },
    echec: { bg: "#FFDDE2", color: "#C0263A", label: "Échec" },
    active: { bg: "#DBFBE7", color: "#0F7A47", label: "Actif" },
    expired: { bg: "#F0F1F5", color: "#666", label: "Expiré" },
    pending: { bg: "#FFE8D1", color: "#B85400", label: "En attente" },
  };
  const s = map[status] ?? { bg: "#F0F1F5", color: "#666", label: status };
  return (
    <span className="px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em" }}>
      {s.label}
    </span>
  );
}

function RenewalBanner({ contracts }: { contracts: any[] }) {
  const expiring = contracts
    .filter((c) => c.status === "active" && c.endDate)
    .map((c) => ({ ...c, _days: Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) }))
    .filter((c) => c._days <= 30 && c._days >= 0)
    .sort((a, b) => a._days - b._days);
  if (expiring.length === 0) return null;
  const first = expiring[0];
  const urgent = first._days <= 7;
  return (
    <Link
      to="/espace-client/contrats"
      className="flex items-center justify-between gap-3 p-4 rounded-3xl border active:scale-[0.985] transition-transform"
      style={{
        background: urgent ? "#FFF1F4" : "#FFF7E6",
        borderColor: urgent ? "rgba(255,59,87,0.25)" : "rgba(255,122,0,0.25)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: urgent ? "#FF3B57" : "#FF7A00", color: "#fff" }}
        >
          <RefreshCw className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: "0.92rem", fontWeight: 900 }}>
            {expiring.length === 1
              ? `${first.product} arrive à échéance`
              : `${expiring.length} contrats à renouveler bientôt`}
          </p>
          <p className="text-[#555] flex items-center gap-1 mt-0.5" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
            <Calendar className="w-3 h-3" />
            {first._days === 0
              ? "Échéance aujourd'hui"
              : first._days === 1
              ? "Échéance demain"
              : `Échéance dans ${first._days} jours`}
            {" · "}
            {formatDate(first.endDate)}
          </p>
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl shrink-0"
        style={{ background: urgent ? "#FF3B57" : "#FF7A00", color: "#fff", fontSize: "0.76rem", fontWeight: 800 }}
      >
        Renouveler <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}
