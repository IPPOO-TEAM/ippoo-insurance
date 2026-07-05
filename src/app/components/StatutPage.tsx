import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw, Server, Database, Mail, MessageSquare, CreditCard, Bell, ShieldCheck } from "lucide-react";
import { API_BASE, SUPABASE_ANON_KEY } from "../espace-client/supabaseClient";

// Page statut publique IPPOO — relit /health (KV probe + intégrations) toutes
// les 30 s pour montrer aux clients que la plateforme est opérationnelle. Sert
// aussi de référence externe pour le support et la communauté.

type Health = {
  status: "ok" | "degraded";
  kv: boolean;
  integrations: Record<string, boolean>;
  serverTime: string;
  latencyMs: number;
  rev: string;
};

const INTEGRATION_META: Record<string, { label: string; Icon: typeof Server; hint: string }> = {
  kkiapay: { label: "Paiement Kkiapay", Icon: CreditCard, hint: "Encaissement Mobile Money / Carte" },
  kkiapaySandbox: { label: "Mode Sandbox Kkiapay", Icon: CreditCard, hint: "Paiements en mode test" },
  resend: { label: "Email transactionnel", Icon: Mail, hint: "Notifications email aux clients" },
  termii: { label: "SMS transactionnel", Icon: MessageSquare, hint: "Notifications SMS aux clients" },
  vapid: { label: "Notifications push", Icon: Bell, hint: "Push web vers les navigateurs" },
  adminTotp: { label: "Auth admin 2FA", Icon: ShieldCheck, hint: "Second facteur des comptes admin" },
};

const HEALTH_URL = `${API_BASE}/health`;

export function StatutPage() {
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshAt, setRefreshAt] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(HEALTH_URL, { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as Health;
      setData(body);
      setRefreshAt(new Date());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, []);

  const globalOk = !err && data?.status === "ok" && data?.kv;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "var(--surface-app)", color: "var(--ippoo-text)" }}>
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.025em" }}>Statut de la plateforme</h1>
            <p className="mt-1" style={{ fontSize: "0.9rem", color: "var(--ippoo-text-muted)" }}>
              État en temps réel des services IPPOO Assurance.
            </p>
          </div>
          <button onClick={load} aria-label="Rafraîchir" className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition" style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="rounded-3xl p-6 mb-5" style={{ background: globalOk ? "linear-gradient(135deg,#D4F4E2,#A4E6BD)" : "linear-gradient(135deg,#FFE2E7,#FFB3C0)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.7)" }}>
              {globalOk ? <CheckCircle2 className="w-6 h-6" style={{ color: "#0F7A47" }} /> : <AlertTriangle className="w-6 h-6" style={{ color: "#C0263A" }} />}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: "1.05rem", fontWeight: 900, color: globalOk ? "#0F7A47" : "#C0263A" }}>
                {globalOk ? "Tous les systèmes sont opérationnels" : err ? "Service injoignable" : "Service dégradé"}
              </p>
              <p className="mt-0.5 truncate" style={{ fontSize: "0.78rem", color: globalOk ? "#0F7A47" : "#C0263A", opacity: 0.85 }}>
                {refreshAt ? `Dernier check : ${refreshAt.toLocaleTimeString("fr-FR")}` : "Connexion…"}
                {data ? ` · latence ${data.latencyMs} ms` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
          <Row icon={Server} label="API edge" hint="Serveur principal Hono / Supabase Edge" ok={!err} />
          <Row icon={Database} label="Base de données" hint="Stockage clé-valeur Postgres" ok={!err && !!data?.kv} />
          {data && Object.entries(data.integrations).map(([key, ok]) => {
            const meta = INTEGRATION_META[key] ?? { label: key, Icon: Server, hint: "Intégration externe" };
            return <Row key={key} icon={meta.Icon} label={meta.label} hint={meta.hint} ok={ok} />;
          })}
        </div>

        {data && (
          <p className="mt-4 text-center" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)" }}>
            Build {data.rev} · Heure serveur {new Date(data.serverTime).toLocaleString("fr-FR")}
          </p>
        )}
        {err && (
          <p className="mt-4 text-center" style={{ fontSize: "0.78rem", color: "#C0263A", fontWeight: 700 }}>
            Erreur : {err}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, hint, ok }: { icon: typeof Server; label: string; hint: string; ok: boolean }) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--line-hairline)" }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: ok ? "#D4F4E2" : "#FFE6CC", color: ok ? "#0F7A47" : "#B85400" }}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate" style={{ fontSize: "0.92rem", fontWeight: 800 }}>{label}</p>
        <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>{hint}</p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: ok ? "#D4F4E2" : "#FFE2E7", color: ok ? "#0F7A47" : "#C0263A", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em" }}>
        {ok ? "OK" : "KO"}
      </span>
    </div>
  );
}
