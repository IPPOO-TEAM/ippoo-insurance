import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, Receipt, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../AuthContext";
import { useApiData } from "../hooks";
import { api, type Payment } from "../api";
import { Invoice } from "../components/Invoice";
import { subscribeUserTable } from "../realtime";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: "success" | "warn" | "info" | string;
  createdAt: string;
  read?: boolean;
  to?: string;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function groupKey(iso: string): "Aujourd'hui" | "Hier" | "Cette semaine" | "Plus tôt" {
  const d = new Date(iso);
  const now = new Date();
  const day = (a: Date) => `${a.getFullYear()}-${a.getMonth()}-${a.getDate()}`;
  if (day(d) === day(now)) return "Aujourd'hui";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (day(d) === day(y)) return "Hier";
  const week = new Date(now); week.setDate(now.getDate() - 7);
  if (d >= week) return "Cette semaine";
  return "Plus tôt";
}

function iconFor(type: Notif["type"]) {
  if (type === "success") return { Icon: CheckCircle2, tint: "#0F7A47" };
  if (type === "warn") return { Icon: AlertCircle, tint: "#B85400" };
  return { Icon: Info, tint: "#2A6BFF" };
}

export function NotificationsPage() {
  const { session } = useAuth();
  const q = useApiData((t) => api.notifications(t));
  const meQ = useApiData((t) => api.me(t));
  const paymentsQ = useApiData((t) => api.payments(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const [invoice, setInvoice] = useState<Payment | null>(null);

  // Realtime — recharge la liste à chaque INSERT/UPDATE/DELETE sur notre ligne
  // (filtré côté serveur via user_id = auth.uid()).
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    return subscribeUserTable("notifications", uid, () => q.reload());
  }, [session?.user?.id, q]);

  const lastConfirmed = useMemo(
    () => (paymentsQ.data?.payments ?? []).find((p) => p.status === "confirme") ?? null,
    [paymentsQ.data],
  );
  const invoiceContract = useMemo(
    () => (invoice?.contractId ? (contractsQ.data?.contracts ?? []).find((c) => c.id === invoice.contractId) ?? null : null),
    [invoice, contractsQ.data],
  );

  useEffect(() => {
    if (!session?.access_token || q.loading) return;
    const hasUnread = q.data?.notifications.some((n) => !n.read);
    if (hasUnread) {
      api.markNotificationsRead(session.access_token).then(() => q.reload()).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.loading]);

  const items: Notif[] = (q.data?.notifications ?? []) as Notif[];
  const groups = useMemo(() => {
    const order = ["Aujourd'hui", "Hier", "Cette semaine", "Plus tôt"] as const;
    const map = new Map<string, Notif[]>();
    for (const n of items) {
      const k = groupKey(n.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(n);
    }
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, items: map.get(k)! }));
  }, [items]);

  return (
    <div className="max-w-2xl mx-auto px-1">
      <header className="px-3 pt-2 pb-4">
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, letterSpacing: "-0.025em" }}>Notifications</h1>
      </header>

      {q.loading && (
        <ul className="bg-white rounded-3xl overflow-hidden divide-y divide-black/[0.06]">
          {[0, 1, 2].map((i) => (
            <li key={i} className="px-4 py-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-black/[0.05] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-black/[0.05] animate-pulse w-2/3" />
                <div className="h-3 rounded bg-black/[0.05] animate-pulse w-full" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!q.loading && items.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-black/[0.04] flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#0E1320]/40" strokeWidth={1.6} />
          </div>
          <p style={{ fontSize: "1.02rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Aucune notification</p>
          <p className="text-[#888] mt-1" style={{ fontSize: "0.85rem" }}>Vous êtes à jour.</p>
        </div>
      )}

      {!q.loading && groups.map((g) => (
        <section key={g.key} className="mb-5">
          <h2 className="px-3 mb-2 text-[#8a8a8a]" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {g.key}
          </h2>
          <ul className="bg-white rounded-3xl overflow-hidden">
            {g.items.map((n, i) => {
              const { Icon, tint } = iconFor(n.type);
              const isLast = i === g.items.length - 1;
              const showInvoice = /\bcotisation\b|\bpaiement\b|\bfacture\b/i.test(`${n.title} ${n.body}`) && lastConfirmed;
              return (
                <li
                  key={n.id}
                  className={`relative pl-4 pr-3 py-3.5 flex items-start gap-3 active:bg-black/[0.02] transition-colors ${
                    isLast ? "" : "after:absolute after:left-[60px] after:right-3 after:bottom-0 after:h-px after:bg-black/[0.06]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Icon className="w-[18px] h-[18px]" style={{ color: tint }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate" style={{ fontSize: "0.92rem", fontWeight: 700, letterSpacing: "-0.005em" }}>{n.title}</p>
                      <p className="text-[#9a9a9a] shrink-0" style={{ fontSize: "0.72rem", fontWeight: 500 }}>{relativeTime(n.createdAt)}</p>
                    </div>
                    <p className="text-[#3a3a3a] mt-0.5 leading-snug" style={{ fontSize: "0.84rem" }}>{n.body}</p>
                    {showInvoice && (
                      <button
                        onClick={() => setInvoice(lastConfirmed)}
                        className="mt-2 inline-flex items-center gap-1 text-[#2A6BFF] active:opacity-60"
                        style={{ fontSize: "0.8rem", fontWeight: 600 }}
                      >
                        <Receipt className="w-3.5 h-3.5" /> Voir la facture
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {n.to && (
                      <Link
                        to={n.to}
                        className="mt-2 inline-flex items-center gap-1 text-[#2A6BFF] active:opacity-60"
                        style={{ fontSize: "0.8rem", fontWeight: 600 }}
                      >
                        Détails <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {invoice && (
        <Invoice
          open={!!invoice}
          onClose={() => setInvoice(null)}
          payment={invoice}
          profile={meQ.data?.profile ?? null}
          contract={invoiceContract}
        />
      )}
    </div>
  );
}
