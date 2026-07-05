import { useEffect, useState } from "react";
import { Circle, Users, RefreshCw } from "lucide-react";
import { api } from "../api";
import { useAdminAuth } from "../AdminLayout";

// Petit dashboard live "qui est en ligne" côté admin. Lit
// /admin/agents/presence et auto-refresh toutes les 30s. Statut effectif
// calculé côté serveur (online_stale = présence >90s sans heartbeat).

type Row = {
  userId: string;
  matricule: string | null;
  email: string;
  name: string;
  effective: "online" | "online_stale" | "paused" | "offline";
  ageSec: number | null;
};

function statusColor(s: Row["effective"]) {
  switch (s) {
    case "online": return { fg: "#0F7A47", bg: "rgba(22,178,106,0.12)", label: "En ligne" };
    case "online_stale": return { fg: "#8A5A00", bg: "rgba(255,176,32,0.14)", label: "Inactif" };
    case "paused": return { fg: "#666", bg: "rgba(0,0,0,0.06)", label: "En pause" };
    default: return { fg: "#666", bg: "rgba(0,0,0,0.06)", label: "Hors ligne" };
  }
}

function ageLabel(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  return `${Math.round(sec / 3600)} h`;
}

export function AgentsPresenceWidget() {
  const { session } = useAdminAuth();
  const token = session?.token ?? "";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.adminAgentsPresence(token);
      setRows(res.agents as Row[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    const id = setInterval(reload, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onlineCount = rows.filter((r) => r.effective === "online").length;

  return (
    <section
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "var(--surface-card, #fff)", border: "1px solid var(--line-hairline)" }}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)" }}
          >
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Conseillers connectés
            </h3>
            <p className="text-[#666]" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
              {onlineCount} en ligne · {rows.length} suivis
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
      {rows.length === 0 && !loading ? (
        <div className="p-6 text-center text-[#666]" style={{ fontSize: "0.85rem" }}>
          Aucun conseiller n'a encore publié sa présence.
        </div>
      ) : (
        <ul className="divide-y divide-black/5 max-h-72 overflow-auto">
          {rows.map((r) => {
            const c = statusColor(r.effective);
            return (
              <li key={r.userId} className="px-4 py-2.5 flex items-center gap-3">
                <Circle className="w-2.5 h-2.5 shrink-0" fill={c.fg} stroke="none" />
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: "0.86rem", fontWeight: 800 }}>
                    {r.name || r.email || "—"}
                    {r.matricule && (
                      <span className="ml-1.5 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                        · {r.matricule}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[#666]" style={{ fontSize: "0.72rem" }}>
                    {r.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: "0.68rem", fontWeight: 800, color: c.fg, background: c.bg }}
                  >
                    {c.label}
                  </span>
                  <p className="text-[#666] mt-0.5" style={{ fontSize: "0.66rem" }}>
                    {ageLabel(r.ageSec)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
