import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { API_BASE, SUPABASE_ANON_KEY } from "../supabaseClient";

// #16 — Widget admin santé secrets / intégrations. Lit /health (public) et
// affiche en clair quels secrets sont configurés ou manquants, pour éviter
// la chasse à l'env var sur Supabase quand un canal cesse de fonctionner.

type Health = {
  status: "ok" | "degraded";
  kv: boolean;
  integrations: Record<string, boolean>;
  serverTime: string;
  latencyMs: number;
  rev: string;
};

const LABELS: Record<string, { label: string; impact: string }> = {
  kkiapay: { label: "Kkiapay (paiement)", impact: "Aucun paiement réel possible" },
  kkiapaySandbox: { label: "Kkiapay sandbox", impact: "Mode test actif (à désactiver en prod)" },
  resend: { label: "Resend (email)", impact: "Aucun email transactionnel" },
  termii: { label: "Termii (SMS / OTP)", impact: "Aucun SMS ni OTP téléphone" },
  vapid: { label: "VAPID (push web)", impact: "Aucune notification push" },
  adminTotp: { label: "Admin TOTP 2FA", impact: "Comptes admin sans second facteur" },
  agentSignup: { label: "Code signup conseiller", impact: "Self-signup conseiller ouvert" },
};

const HEALTH_URL = `${API_BASE}/health`;

export function SystemHealthWidget() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(HEALTH_URL, {
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const entries = Object.entries(data?.integrations ?? {});
  const missing = entries.filter(([k, v]) => !v && k !== "kkiapaySandbox").length;

  return (
    <section className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--surface-card,#fff)", border: "1px solid var(--line-hairline)" }}>
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5">
        <div className="min-w-0">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800 }}>Santé système & intégrations</h3>
          <p className="text-[#666]" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
            {data ? (
              <>
                {data.status === "ok" ? "Opérationnel" : "Dégradé"} · KV {data.kv ? "OK" : "KO"} · {data.latencyMs}ms · rev {data.rev}
                {missing > 0 && <> · <span style={{ color: "#B42318" }}>{missing} secret(s) manquant(s)</span></>}
              </>
            ) : "Chargement…"}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl" style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-app)" }} aria-label="Recharger">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>
      {err && <div className="px-4 py-2 text-red-700 bg-red-50" style={{ fontSize: "0.8rem" }}>{err}</div>}
      <ul className="divide-y divide-black/5">
        {entries.map(([key, ok]) => {
          const meta = LABELS[key] ?? { label: key, impact: "" };
          return (
            <li key={key} className="px-4 py-2.5 flex items-center gap-3">
              {ok ? (
                <CheckCircle2 className="w-4 h-4 text-[#0F7A47] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "0.86rem", fontWeight: 700 }}>{meta.label}</p>
                {!ok && meta.impact && (
                  <p className="text-[#B42318]" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{meta.impact}</p>
                )}
              </div>
              <span
                className="px-2 py-0.5 rounded-full shrink-0"
                style={{
                  fontSize: "0.68rem", fontWeight: 800,
                  color: ok ? "#0F7A47" : "#B42318",
                  background: ok ? "rgba(22,178,106,0.12)" : "rgba(217,45,32,0.12)",
                }}
              >
                {ok ? "Configuré" : "Manquant"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
