import { useEffect, useState } from "react";
import { Plus, Trash2, Save, MessageSquareText, RefreshCw } from "lucide-react";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi, type AgentTemplate } from "../api";
import { ListSkeleton } from "../components/ListStates";

export function AgentTemplatesPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [items, setItems] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await agentApi.listTemplates(token);
      setItems(res.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  async function create() {
    if (!token || !draftTitle.trim() || !draftBody.trim()) return;
    setBusy("__new");
    try {
      await agentApi.createTemplate(token, draftTitle.trim(), draftBody.trim());
      setDraftTitle(""); setDraftBody("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(null); }
  }
  async function update(t: AgentTemplate, patch: { title?: string; body?: string }) {
    if (!token) return;
    setBusy(t.id);
    try {
      await agentApi.updateTemplate(token, t.id, patch);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(null); }
  }
  async function remove(t: AgentTemplate) {
    if (!token) return;
    if (!window.confirm(`Supprimer le modèle « ${t.title} » ?`)) return;
    setBusy(t.id);
    try {
      await agentApi.deleteTemplate(token, t.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setBusy(null); }
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Modèles de réponse
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            Réponses prêtes à insérer dans l'Inbox
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

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>{error}</div>
      )}

      <div className="rounded-2xl p-3 mb-4" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
        <p className="mb-2" style={{ fontSize: "0.85rem", fontWeight: 800 }}>Nouveau modèle</p>
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Titre (ex. Bienvenue / Demande de RIB…)"
          className="w-full mb-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
        />
        <textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          placeholder="Corps du message…"
          rows={4}
          className="w-full mb-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
        />
        <button
          onClick={create}
          disabled={!draftTitle.trim() || !draftBody.trim() || busy === "__new"}
          className="w-full px-3 py-2.5 rounded-xl active:scale-[0.99] transition disabled:opacity-50"
          style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.85rem", fontWeight: 800 }}
        >
          <Plus className="w-4 h-4 inline mr-1" /> Créer le modèle
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : items.length === 0 ? (
        <div className="p-8 text-center rounded-3xl" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
          <MessageSquareText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--ippoo-text-muted)", opacity: 0.4 }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>
            Aucun modèle pour l'instant.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <TemplateRow key={t.id} t={t} busy={busy === t.id} onSave={(patch) => update(t, patch)} onDelete={() => remove(t)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TemplateRow({ t, busy, onSave, onDelete }: {
  t: AgentTemplate;
  busy: boolean;
  onSave: (patch: { title?: string; body?: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(t.title);
  const [body, setBody] = useState(t.body);
  const dirty = title !== t.title || body !== t.body;
  return (
    <li className="rounded-2xl p-3" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.9rem", fontWeight: 700 }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full mb-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.88rem" }}
      />
      <div className="flex items-center justify-between gap-2">
        <p style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>
          Modifié le {new Date(t.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl disabled:opacity-50"
            style={{ background: "rgba(180,35,24,0.10)", color: "#B42318", fontSize: "0.75rem", fontWeight: 800 }}
          >
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Supprimer
          </button>
          <button
            onClick={() => onSave({ title, body })}
            disabled={busy || !dirty}
            className="px-3 py-1.5 rounded-xl disabled:opacity-50"
            style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.75rem", fontWeight: 800 }}
          >
            <Save className="w-3.5 h-3.5 inline mr-1" /> Enregistrer
          </button>
        </div>
      </div>
    </li>
  );
}
