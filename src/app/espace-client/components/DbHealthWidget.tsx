import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Database, RefreshCw } from "lucide-react";
import { useAdminAuth } from "../AdminLayout";
import { api } from "../api";

// Widget admin "Santé DB" — appelle /admin/db-health et affiche, pour chaque
// table attendue : existence, comptage de lignes, publication Realtime, et
// l'URL Supabase utilisée (vérification visuelle qu'on est sur l'instance
// IPPOO et nulle part ailleurs).
export function DbHealthWidget() {
  const { session } = useAdminAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.adminDbHealth>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!session?.token) return;
    setLoading(true); setErr(null);
    try { setData(await api.adminDbHealth(session.token)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [session?.token]);

  const okInstance = !!data?.instance && data.instance.includes("ippoo-aptdc.com");

  return (
    <section className="rounded-2xl overflow-hidden mb-4 bg-white" style={{ border: "1px solid var(--line-hairline)" }}>
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/5">
        <div className="min-w-0 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0E1320]" />
          <div className="min-w-0">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800 }}>Santé de la base de données</h3>
            <p className="text-[#666] truncate" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
              {data
                ? <>{data.summary.total - data.summary.missing}/{data.summary.total} tables · {data.summary.totalRows.toLocaleString("fr-FR")} lignes · Realtime manquants : {data.summary.realtimeMissing}</>
                : "Chargement…"}
            </p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-xl" style={{ border: "1px solid var(--line-hairline)" }} aria-label="Recharger">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {data && (
        <div
          className="px-4 py-2 flex items-center gap-2 text-[0.78rem]"
          style={{ background: okInstance ? "rgba(22,178,106,0.08)" : "rgba(217,45,32,0.08)" }}
        >
          {okInstance ? <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7A47]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />}
          <span style={{ color: okInstance ? "#0F7A47" : "#B42318", fontWeight: 700 }}>
            Instance : {data.instance ?? "?"}
          </span>
          {!okInstance && <span className="text-[#B42318]">⚠ pas l'instance IPPOO</span>}
        </div>
      )}

      {err && <div className="px-4 py-2 text-red-700 bg-red-50" style={{ fontSize: "0.8rem" }}>{err}</div>}

      {data && (
        <ul className="divide-y divide-black/5" style={{ fontSize: "0.82rem" }}>
          {data.tables.map((t) => {
            const ok = t.exists && t.realtimeOk;
            return (
              <li key={t.table} className="px-4 py-2 flex items-center gap-3">
                {ok ? <CheckCircle2 className="w-4 h-4 text-[#0F7A47] shrink-0" /> : <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p style={{ fontWeight: 700 }}>{t.table}</p>
                  {!t.exists && <p className="text-[#B42318]" style={{ fontSize: "0.72rem" }}>Table manquante {t.error ? `· ${t.error}` : ""}</p>}
                  {t.exists && t.realtimeExpected && !t.realtimeOk && (
                    <p className="text-[#B85400]" style={{ fontSize: "0.72rem" }}>Realtime non publié</p>
                  )}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-white" style={{ background: ok ? "#16B26A" : "#C0263A", fontSize: "0.7rem", fontWeight: 800 }}>
                  {t.exists ? `${(t.rows ?? 0).toLocaleString("fr-FR")} lignes` : "absente"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
