import { useEffect, useState } from "react";
import { BellRing, RefreshCw } from "lucide-react";
import { api } from "../api";
import { useAdminAuth } from "../AdminLayout";

// Historique borné des derniers cycles de rappels automatiques. Permet aux
// admins de vérifier que le cron tourne effectivement et de suivre le
// volume email/SMS (coûts Termii/Resend).

type Row = {
  at: string;
  triggeredBy: string;
  scanned: number;
  sent: number;
  fanout: { push: number; email: number; sms: number; opted_out_type: number };
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} j`;
}

export function RemindersHistoryWidget() {
  const { session } = useAdminAuth();
  const token = session?.token ?? "";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.adminRemindersHistory(token);
      setRows(res.history as Row[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const last = rows[0];
  const totals = rows.slice(0, 24).reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      push: acc.push + r.fanout.push,
      email: acc.email + r.fanout.email,
      sms: acc.sms + r.fanout.sms,
    }),
    { sent: 0, push: 0, email: 0, sms: 0 },
  );

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface-card, #fff)", border: "1px solid var(--line-hairline)" }}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,176,32,0.14)", color: "#8A5A00" }}
          >
            <BellRing className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Rappels automatiques
            </h3>
            <p className="text-[#666]" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
              {last
                ? `Dernier run il y a ${timeAgo(last.at)} · ${last.sent} envoyés`
                : "Aucun cycle enregistré"}
            </p>
          </div>
        </div>
        <button
          onClick={reload}
          className="p-2 rounded-xl"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-app)" }}
          aria-label="Recharger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>
      {error && (
        <div className="px-4 py-2 text-red-700 bg-red-50" style={{ fontSize: "0.8rem" }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-black/5" style={{ background: "rgba(0,0,0,0.015)" }}>
        {[
          { label: "Envoyés (24 derniers)", value: totals.sent, color: "var(--ippoo-text)" },
          { label: "Push", value: totals.push, color: "#0F7A47" },
          { label: "Email", value: totals.email, color: "#0E1320" },
          { label: "SMS", value: totals.sms, color: "#B42318" },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[#666]" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em" }}>
              {s.label.toUpperCase()}
            </p>
            <p className="mt-0.5" style={{ fontSize: "0.92rem", fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-[#666]" style={{ fontSize: "0.85rem" }}>
          Lancez un cycle ou attendez le cron pour peupler l'historique.
        </div>
      ) : (
        <ul className="divide-y divide-black/5 max-h-56 overflow-auto">
          {rows.slice(0, 20).map((r) => (
            <li key={r.at} className="px-4 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  {new Date(r.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  <span className="ml-2 text-[#666]" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                    · {r.triggeredBy}
                  </span>
                </p>
                <p className="text-[#666]" style={{ fontSize: "0.7rem" }}>
                  {r.scanned} comptes scannés · {r.fanout.opted_out_type} opt-out
                </p>
              </div>
              <div className="text-right shrink-0">
                <p style={{ fontSize: "0.82rem", fontWeight: 800 }}>{r.sent}</p>
                <p className="text-[#666]" style={{ fontSize: "0.66rem" }}>
                  P{r.fanout.push} · E{r.fanout.email} · S{r.fanout.sms}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
