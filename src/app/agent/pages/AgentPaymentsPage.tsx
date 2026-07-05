import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search, Wallet, Download } from "lucide-react";
import { toCsv, downloadCsv } from "../csv";
import { useAuth } from "../../espace-client/AuthContext";
import { getSupabase } from "../../espace-client/supabaseClient";
import { agentApi } from "../api";
import { PaymentCalendar } from "../../espace-client/components/PaymentCalendar";
import { formatXOF } from "../../espace-client/hooks";
import { ListSkeleton } from "../components/ListStates";
import { statusLabel } from "../../espace-client/labels";

type Row = Awaited<ReturnType<typeof agentApi.payments>>["payments"][number];
const PAGE_SIZE = 100;

export function AgentPaymentsPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "confirme" | "en_attente" | "echec">("all");
  const [mine, setMine] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [portfolio, setPortfolio] = useState<{ in: number; out: number } | null>(null);
  const [livePulse, setLivePulse] = useState(false);

  async function reload() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agentApi.payments(token, { limit: PAGE_SIZE, mine });
      setItems(res.payments);
      setNextBefore(res.nextBefore);
      setTotal(res.total);
      setPortfolio(res.portfolio ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }
  async function loadMore() {
    if (!token || !nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await agentApi.payments(token, { limit: PAGE_SIZE, before: nextBefore, mine });
      setItems((prev) => [...prev, ...res.payments]);
      setNextBefore(res.nextBefore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoadingMore(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token, mine]);

  // Realtime : un webhook KKiaPay (ou tout autre provider) qui confirme un
  // paiement émet `payments:dirty` sur le canal global. On debounce 1.5 s pour
  // absorber les rafales (plusieurs paiements confirmés en série).
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    let pulseT: any = null;
    const onDirty = () => {
      setLivePulse(true);
      if (pulseT) clearTimeout(pulseT);
      pulseT = setTimeout(() => setLivePulse(false), 2000);
      if (t) clearTimeout(t);
      t = setTimeout(() => reloadRef.current(), 1500);
    };
    const ch = sb.channel(`payments:live`)
      .on("broadcast", { event: "payments:dirty" }, onDirty)
      .subscribe();
    // Un transfert de portefeuille change `portfolio.in/out` même sans paiement
    // nouveau : on rafraîchit aussi sur assignments:dirty.
    const ch2 = sb.channel(`assignments:live`)
      .on("broadcast", { event: "assignments:dirty" }, onDirty)
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      if (pulseT) clearTimeout(pulseT);
      sb.removeChannel(ch);
      sb.removeChannel(ch2);
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!s) return true;
      return (`${p.userName} ${p.userEmail} ${p.method} ${p.id}`).toLowerCase().includes(s);
    });
  }, [items, q, status]);

  const confirmed = filtered.filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate flex items-center gap-2" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Paiements
            <span
              aria-label={livePulse ? "Mise à jour en direct" : "En attente"}
              className={livePulse ? "animate-pulse" : ""}
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: livePulse ? "#16B26A" : "rgba(0,0,0,0.2)",
                transition: "background 200ms",
              }}
            />
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            {portfolio
              ? `${portfolio.in} dans mon portefeuille · ${portfolio.out} hors portefeuille`
              : "Suivi quotidien des prélèvements clients"}
          </p>
        </div>
        <button
          onClick={() => {
            const csv = toCsv(
              filtered.map((p) => ({
                id: p.id,
                createdAt: p.createdAt,
                userName: p.userName,
                userEmail: p.userEmail,
                memberNumber: (p as any).memberNumber ?? "",
                amount: p.amount,
                currency: p.currency ?? "XOF",
                method: p.method,
                status: p.status,
                contractId: p.contractId ?? "",
                inPortfolio: (p as any).inPortfolio ? "oui" : "non",
              })),
              [
                { key: "createdAt", label: "Date" },
                { key: "id", label: "ID paiement" },
                { key: "userName", label: "Client" },
                { key: "userEmail", label: "Email" },
                { key: "memberNumber", label: "N° membre" },
                { key: "amount", label: "Montant" },
                { key: "currency", label: "Devise" },
                { key: "method", label: "Méthode" },
                { key: "status", label: "Statut" },
                { key: "contractId", label: "Contrat" },
                { key: "inPortfolio", label: "Portefeuille" },
              ],
            );
            const stamp = new Date().toISOString().slice(0, 10);
            downloadCsv(`IPPOO_paiements_${stamp}.csv`, csv);
          }}
          disabled={filtered.length === 0}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Exporter CSV"
          title="Exporter en CSV"
        >
          <Download className="w-[18px] h-[18px]" />
        </button>
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
        className="sticky z-10 -mx-4 px-4 pb-3 pt-1 mb-3 flex items-center gap-2"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 60px)",
          background: "color-mix(in srgb, var(--surface-app) 92%, transparent)",
          backdropFilter: "saturate(160%) blur(12px)",
          WebkitBackdropFilter: "saturate(160%) blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 px-3 rounded-2xl flex-1 min-w-0" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", minHeight: 44 }}>
          <Search className="w-[18px] h-[18px]" style={{ color: "var(--ippoo-text-muted)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 bg-transparent focus:outline-none"
            style={{ fontSize: "16px" }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="px-3 rounded-2xl shrink-0"
          style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", fontSize: "14px", fontWeight: 700, minHeight: 44 }}
        >
          <option value="all">Tous</option>
          <option value="confirme">Confirmés</option>
          <option value="en_attente">En attente</option>
          <option value="echec">Échecs</option>
        </select>
        <button
          onClick={() => setMine((m) => !m)}
          className="px-3 rounded-2xl shrink-0 active:scale-95 transition"
          style={{
            background: mine ? "var(--ippoo-text)" : "var(--surface-card)",
            color: mine ? "var(--surface-card)" : "var(--ippoo-text)",
            border: "1px solid var(--line-hairline)",
            fontSize: "13px",
            fontWeight: 800,
            minHeight: 44,
          }}
          aria-pressed={mine}
          title="Filtrer sur les clients de mon portefeuille"
        >
          {mine
            ? `Portefeuille ✓${portfolio ? ` (${portfolio.in})` : ""}`
            : `Portefeuille${portfolio ? ` (${portfolio.in}/${portfolio.in + portfolio.out})` : ""}`}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <PaymentCalendar
            payments={filtered as any}
            title="Calendrier des prélèvements"
            subtitle={`${filtered.length}/${total} transaction(s) · ${formatXOF(confirmed)} confirmés`}
            showUser
          />

          <section className="mt-3">
            <header className="flex items-center gap-2 mb-2 px-1">
              <Wallet className="w-4 h-4" style={{ color: "var(--ippoo-text-muted)" }} />
              <p style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ippoo-text-muted)" }}>
                Transactions
              </p>
            </header>
            {filtered.length === 0 ? (
              <div
                className="p-8 text-center rounded-3xl"
                style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
              >
                <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--ippoo-text-muted)", opacity: 0.4 }} />
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>
                  Aucun paiement à afficher.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((p) => (
                  <li
                    key={p.id}
                    className="px-4 py-3 rounded-2xl flex items-center justify-between gap-3 active:scale-[0.99] transition"
                    style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate flex items-center gap-1.5" style={{ fontSize: "0.92rem", fontWeight: 800 }}>
                        <span className="truncate">{p.userName || p.userEmail || "—"}</span>
                        {(p as any).inPortfolio && (
                          <span
                            className="shrink-0 px-1.5 py-0.5 rounded-full"
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              background: "rgba(22,178,106,0.12)",
                              color: "#0F7A47",
                              letterSpacing: "0.03em",
                            }}
                            title="Client de mon portefeuille"
                          >
                            MIEN
                          </span>
                        )}
                      </p>
                      <p className="truncate" style={{ fontSize: "0.75rem", color: "var(--ippoo-text-muted)" }}>
                        {p.method} · {new Date(p.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>{formatXOF(p.amount)}</p>
                      <span
                        className="inline-block mt-0.5 px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: "0.66rem",
                          fontWeight: 800,
                          color: p.status === "confirme" ? "#0F7A47" : p.status === "en_attente" ? "#8A5A00" : "#B42318",
                          background:
                            p.status === "confirme"
                              ? "rgba(22,178,106,0.12)"
                              : p.status === "en_attente"
                              ? "rgba(255,176,32,0.14)"
                              : "rgba(180,35,24,0.10)",
                        }}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {nextBefore && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full rounded-2xl active:scale-[0.98] transition"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--line-hairline)",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    opacity: loadingMore ? 0.6 : 1,
                    minHeight: 48,
                  }}
                >
                  {loadingMore ? "Chargement…" : `Charger plus (${items.length}/${total})`}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
