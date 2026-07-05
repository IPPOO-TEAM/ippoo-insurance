import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatXOF } from "../hooks";

// Calendrier mensuel de suivi des paiements / prélèvements journaliers.
// Partagé entre les 3 apps (client, conseiller, admin). N'embarque aucune
// donnée — reçoit la liste des paiements normalisée et calcule l'agrégation
// par jour côté client. Le clic sur un jour ouvre un panneau récapitulatif
// avec la liste des transactions du jour.

export type CalendarPayment = {
  id: string;
  amount: number;
  status: "confirme" | "en_attente" | "echec" | string;
  method?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  label?: string;
};

type Props = {
  payments: CalendarPayment[];
  title?: ReactNode;
  subtitle?: ReactNode;
  showUser?: boolean;
  initialDate?: Date;
};

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function ymdKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthCellOffset(year: number, month: number) {
  // Monday-first week
  const first = new Date(year, month, 1).getDay(); // 0 Sun..6 Sat
  return (first + 6) % 7;
}

export function PaymentCalendar({
  payments,
  title = "Calendrier des prélèvements",
  subtitle,
  showUser = false,
  initialDate,
}: Props) {
  const [cursor, setCursor] = useState<Date>(() => {
    const base = initialDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = startOfMonthCellOffset(year, month);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarPayment[]>();
    for (const p of payments) {
      const d = new Date(p.createdAt);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const key = ymdKey(d);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [payments, year, month]);

  const monthTotals = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let failed = 0;
    let count = 0;
    for (const list of byDay.values()) {
      for (const p of list) {
        count += 1;
        if (p.status === "confirme") confirmed += p.amount;
        else if (p.status === "en_attente") pending += p.amount;
        else if (p.status === "echec") failed += 1;
      }
    }
    return { confirmed, pending, failedCount: failed, count };
  }, [byDay]);

  const cells: Array<{ day: number | null; key: string | null }> = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ day: d, key: ymdKey(date) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });

  const todayKey = ymdKey(new Date());
  const selectedList = selectedKey ? byDay.get(selectedKey) ?? [] : [];
  const selectedConfirmed = selectedList.filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);

  return (
    <section
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "var(--surface-card, #fff)", border: "1px solid var(--line-hairline, rgba(0,0,0,0.06))" }}
    >
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-black/5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary, #FF3B57)" }}
          >
            <CalendarDays className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
              {title}
            </h3>
            <p className="text-[#666] truncate" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
              {subtitle ?? `${MONTHS_FR[month]} ${year} · ${monthTotals.count} transaction${monthTotals.count > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-black/5"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCursor(new Date()); setSelectedKey(todayKey); }}
            className="px-2.5 py-1 rounded-lg hover:bg-black/5"
            style={{ fontSize: "0.74rem", fontWeight: 700 }}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-black/5"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 px-4 sm:px-5 py-3 border-b border-black/5" style={{ background: "rgba(0,0,0,0.015)" }}>
        <div>
          <p className="text-[#666]" style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em" }}>CONFIRMÉS</p>
          <p className="mt-0.5" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F7A47" }}>{formatXOF(monthTotals.confirmed)}</p>
        </div>
        <div>
          <p className="text-[#666]" style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em" }}>EN ATTENTE</p>
          <p className="mt-0.5" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#8A5A00" }}>{formatXOF(monthTotals.pending)}</p>
        </div>
        <div>
          <p className="text-[#666]" style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em" }}>ÉCHECS</p>
          <p className="mt-0.5" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#B42318" }}>{monthTotals.failedCount}</p>
        </div>
      </div>

      <div className="px-2 sm:px-4 py-3">
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {WEEK_DAYS.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="text-center text-[#666]"
              style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em" }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell.day || !cell.key) return <div key={`empty-${idx}`} className="aspect-square" />;
            const list = byDay.get(cell.key) ?? [];
            const dayConfirmed = list.filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);
            const hasPending = list.some((p) => p.status === "en_attente");
            const hasFailed = list.some((p) => p.status === "echec");
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;
            const active = list.length > 0;

            return (
              <button
                key={cell.key}
                onClick={() => setSelectedKey(active ? cell.key : null)}
                disabled={!active}
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition relative"
                style={{
                  background: isSelected
                    ? "rgba(255,59,87,0.14)"
                    : active
                      ? "rgba(22,178,106,0.08)"
                      : "transparent",
                  border: isToday ? "1.5px solid var(--accent-primary, #FF3B57)" : "1px solid transparent",
                  color: active ? "var(--ippoo-text, #0E1320)" : "#999",
                  cursor: active ? "pointer" : "default",
                }}
                title={active ? `${list.length} paiement(s) · ${formatXOF(dayConfirmed)} confirmés` : ""}
              >
                <span style={{ fontSize: "0.78rem", fontWeight: active ? 800 : 500 }}>{cell.day}</span>
                {active && (
                  <span className="flex items-center gap-0.5">
                    {dayConfirmed > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16B26A" }} />
                    )}
                    {hasPending && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFB020" }} />
                    )}
                    {hasFailed && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E5484D" }} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedKey && (
        <div className="border-t border-black/5 px-4 sm:px-5 py-3" style={{ background: "rgba(0,0,0,0.015)" }}>
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="min-w-0">
              <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                {new Date(selectedKey).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-[#666]" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
                {selectedList.length} transaction{selectedList.length > 1 ? "s" : ""} · {formatXOF(selectedConfirmed)} confirmés
              </p>
            </div>
            <button
              onClick={() => setSelectedKey(null)}
              className="px-2 py-1 rounded-lg hover:bg-black/5 text-[#666]"
              style={{ fontSize: "0.72rem", fontWeight: 700 }}
            >
              Fermer
            </button>
          </div>
          <ul className="space-y-1.5 max-h-56 overflow-auto">
            {selectedList.map((p) => {
              const Icon = p.status === "confirme" ? CheckCircle2 : p.status === "en_attente" ? Clock : XCircle;
              const color = p.status === "confirme" ? "#0F7A47" : p.status === "en_attente" ? "#8A5A00" : "#B42318";
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg"
                  style={{ background: "var(--surface-card, #fff)", border: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                      {formatXOF(p.amount)}
                      {p.method ? <span className="text-[#666]" style={{ fontWeight: 600 }}> · {p.method}</span> : null}
                    </p>
                    {showUser && (p.userName || p.userEmail) && (
                      <p className="truncate text-[#666]" style={{ fontSize: "0.72rem" }}>
                        {p.userName || p.userEmail}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded shrink-0"
                    style={{ fontSize: "0.66rem", fontWeight: 800, color, background: `${color}1A` }}
                  >
                    {new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
