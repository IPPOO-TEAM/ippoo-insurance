import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RefreshCw, Plus, Trash2, CheckCircle2, Circle, Calendar, User as UserIcon } from "lucide-react";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi, type AgentTask } from "../api";

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
function fromDateInput(s: string): string | null {
  if (!s) return null;
  return new Date(s + "T09:00:00").toISOString();
}
function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function AgentTasksPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agentApi.listTasks(token);
      setTasks(res.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  async function add() {
    const title = draft.trim();
    if (!title || !token) return;
    setBusyId("__add__");
    try {
      const res = await agentApi.createTask(token, { title, dueAt: fromDateInput(draftDue) });
      setTasks((prev) => [res.task, ...prev]);
      setDraft(""); setDraftDue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusyId(null); }
  }
  async function toggle(t: AgentTask) {
    if (!token) return;
    setBusyId(t.id);
    try {
      const res = await agentApi.updateTask(token, t.id, { done: !t.done });
      setTasks((prev) => prev.map((x) => x.id === t.id ? res.task : x));
    } finally { setBusyId(null); }
  }
  async function remove(t: AgentTask) {
    if (!token) return;
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setBusyId(t.id);
    try {
      await agentApi.deleteTask(token, t.id);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
    } finally { setBusyId(null); }
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => filter === "all" ? true : filter === "done" ? t.done : !t.done);
  }, [tasks, filter]);

  const now = Date.now();
  const overdue = tasks.filter((t) => !t.done && t.dueAt && new Date(t.dueAt).getTime() < now).length;

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Mes tâches
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            {tasks.filter((t) => !t.done).length} à faire{overdue > 0 ? ` · ${overdue} en retard` : ""}
          </p>
        </div>
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
        className="rounded-2xl p-3 mb-3"
        style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }}
          placeholder="Nouvelle tâche (ex. Rappeler M. Kpondéhou)"
          className="w-full mb-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl flex-1" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--ippoo-text-muted)" }} />
            <input
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none"
              style={{ fontSize: "14px" }}
            />
          </label>
          <button
            onClick={add}
            disabled={!draft.trim() || busyId === "__add__"}
            className="px-3 py-2 rounded-xl disabled:opacity-50 inline-flex items-center gap-1"
            style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.82rem", fontWeight: 800, minHeight: 40 }}
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      <div
        className="inline-flex p-1 rounded-2xl mb-3"
        style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
      >
        {(["open", "done", "all"] as const).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl"
              style={{
                background: active ? "var(--ippoo-text)" : "transparent",
                color: active ? "var(--surface-card)" : "var(--ippoo-text-muted)",
                fontSize: "0.78rem", fontWeight: 800,
              }}
            >
              {f === "open" ? "À faire" : f === "done" ? "Terminées" : "Toutes"}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          className="p-8 text-center rounded-3xl"
          style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
        >
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--ippoo-text-muted)", opacity: 0.4 }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>
            {filter === "open" ? "Aucune tâche en cours." : filter === "done" ? "Rien de terminé." : "Aucune tâche."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const isOverdue = !t.done && t.dueAt && new Date(t.dueAt).getTime() < now;
            return (
              <li
                key={t.id}
                className="px-3 py-3 rounded-2xl flex items-start gap-3"
                style={{
                  background: "var(--surface-card)",
                  border: `1px solid ${isOverdue ? "rgba(180,35,24,0.30)" : "var(--line-hairline)"}`,
                  opacity: t.done ? 0.6 : 1,
                }}
              >
                <button
                  onClick={() => toggle(t)}
                  disabled={busyId === t.id}
                  aria-label={t.done ? "Rouvrir" : "Marquer comme terminée"}
                  className="shrink-0 mt-0.5"
                >
                  {t.done
                    ? <CheckCircle2 className="w-5 h-5" style={{ color: "#16B26A" }} />
                    : <Circle className="w-5 h-5" style={{ color: "var(--ippoo-text-muted)" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.92rem", fontWeight: 700, textDecoration: t.done ? "line-through" : "none" }}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {t.dueAt && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                        style={{
                          fontSize: "0.68rem", fontWeight: 800,
                          background: isOverdue ? "rgba(180,35,24,0.10)" : "rgba(14,19,32,0.06)",
                          color: isOverdue ? "#B42318" : "var(--ippoo-text-muted)",
                        }}
                      >
                        <Calendar className="w-3 h-3" /> {fmt(t.dueAt)}
                      </span>
                    )}
                    {t.userId && (
                      <Link
                        to={`/agent/clients/${t.userId}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                        style={{ fontSize: "0.68rem", fontWeight: 800, background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)" }}
                      >
                        <UserIcon className="w-3 h-3" /> Fiche client
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(t)}
                  disabled={busyId === t.id}
                  className="shrink-0 p-1.5 rounded-lg"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "#B42318" }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
