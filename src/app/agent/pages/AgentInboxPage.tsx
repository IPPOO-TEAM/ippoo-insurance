import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { Search, Send, CheckCircle2, Clock, UserCheck, MessageCircle, IdCard, BookText, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../espace-client/AuthContext";
import { getSupabase } from "../../espace-client/supabaseClient";
import { agentApi, type AgentConversation, type AgentMessage, type AgentTemplate } from "../api";
import { ListSkeleton, EmptyState, EmptyInboxArt } from "../components/ListStates";
import { UserAvatar } from "../../espace-client/components/UserAvatar";

type Status = "" | "ouvert" | "en_cours" | "resolu";

const STATUS_LABELS: Record<Exclude<Status, "">, { label: string; color: string; bg: string }> = {
  ouvert: { label: "Ouvert", color: "#C0263A", bg: "#FFE2E7" },
  en_cours: { label: "En cours", color: "#B85400", bg: "#FFE6CC" },
  resolu: { label: "Résolu", color: "#0F7A47", bg: "#D4F4E2" },
};

function relativeTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function AgentInboxPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const { me } = useOutletContext<{ me: { id: string; username: string } | null; online: boolean }>();
  const navigate = useNavigate();

  const [convos, setConvos] = useState<AgentConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("");
  const [mineOnly, setMineOnly] = useState(false);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [thread, setThread] = useState<AgentMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplManageOpen, setTplManageOpen] = useState(false);
  const [tplTitle, setTplTitle] = useState("");
  const [tplBody, setTplBody] = useState("");

  const replyRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // A7 — Canal chat:<uid> du client sélectionné. Sert à émettre "typing" et
  // "read" pour que la messagerie côté client affiche le feedback temps réel
  // ("conseiller écrit…", coche lue).
  const userChanRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null>(null);
  const typingSentAtRef = useRef<number>(0);

  async function loadTemplates() {
    if (!token) return;
    try {
      const res = await agentApi.listTemplates(token);
      setTemplates(res.templates ?? []);
    } catch (err) {
      console.error("listTemplates failed:", err);
    }
  }

  function insertTemplate(t: AgentTemplate) {
    setReply((prev) => (prev ? `${prev.replace(/\s+$/, "")}\n${t.body}` : t.body));
    setTplOpen(false);
    requestAnimationFrame(() => replyRef.current?.focus());
  }

  async function createTemplate() {
    if (!token) return;
    const title = tplTitle.trim();
    const body = tplBody.trim();
    if (!title || !body) { toast.warning("Titre et contenu requis."); return; }
    try {
      const res = await agentApi.createTemplate(token, title, body);
      setTemplates((prev) => [res.template, ...prev]);
      setTplTitle(""); setTplBody("");
      toast.success("Template ajouté.");
    } catch (err) {
      toast.error(`Erreur : ${err}`);
    }
  }

  async function removeTemplate(id: string) {
    if (!token) return;
    if (!confirm("Supprimer ce template ?")) return;
    try {
      await agentApi.deleteTemplate(token, id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error(`Erreur : ${err}`);
    }
  }

  async function loadConvos() {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await agentApi.conversations(token, { q, status, mine: mineOnly });
      setConvos(res.conversations);
    } catch (err) {
      console.error("agentApi.conversations failed:", err);
    } finally {
      setLoadingList(false);
    }
  }

  async function openThread(uid: string) {
    if (!token) return;
    setSelectedUid(uid);
    setLoadingThread(true);
    setReply("");
    try {
      const res = await agentApi.conversation(token, uid);
      setThread(res.messages);
      // Refresh list to clear unread badge.
      loadConvos();
    } catch (err) {
      console.error("agentApi.conversation failed:", err);
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedUid) return;
    const content = reply.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await agentApi.reply(token, selectedUid, content);
      setThread((prev) => [...prev, res.message]);
      setReply("");
      loadConvos();
    } catch (err) {
      console.error("agentApi.reply failed:", err);
      alert("Envoi impossible — réessayez.");
    } finally {
      setSending(false);
    }
  }

  async function claim() {
    if (!token || !selectedUid) return;
    try {
      await agentApi.updateMeta(token, selectedUid, { claim: true });
      loadConvos();
    } catch (err) { console.error("claim failed:", err); }
  }

  async function changeStatus(next: "ouvert" | "en_cours" | "resolu") {
    if (!token || !selectedUid) return;
    try {
      await agentApi.updateMeta(token, selectedUid, { status: next });
      loadConvos();
    } catch (err) { console.error("status change failed:", err); }
  }

  // Initial load + reload on filter change.
  useEffect(() => { loadConvos(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, q, status, mineOnly]);

  useEffect(() => { loadTemplates(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Realtime: subscribe to admin:chat — same topic admins listen to, so we
  // pick up new client messages instantly + any reply by another agent.
  useEffect(() => {
    if (!token) return;
    const sb = getSupabase();
    // Single subscription on the shared `admin:chat` topic — that's where the
    // server broadcasts every new client message + meta change (admin and
    // agent consoles consume the same stream).
    const channel = sb.channel("admin:chat", { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "message:new" }, ({ payload }: any) => {
      loadConvos();
      if (payload?.userId && payload.userId === selectedUid) {
        setThread((prev) => prev.some((m) => m.id === payload.message?.id) ? prev : [...prev, payload.message]);
      }
    });
    channel.on("broadcast", { event: "meta:update" }, () => loadConvos());
    channel.subscribe();
    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedUid]);

  // A7 — Ouvrir un canal dédié chat:<selectedUid> quand on sélectionne une
  // conversation, et le fermer quand on change/déselectionne. On y émet
  // "typing" et "read"; côté client la MessageriePage écoute déjà ces events.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !selectedUid) {
      userChanRef.current = null;
      return;
    }
    const ch = sb.channel(`chat:${selectedUid}`, { config: { broadcast: { self: false } } });
    ch.subscribe();
    userChanRef.current = ch;
    // Marquer comme lu dès l'ouverture du fil.
    ch.send({ type: "broadcast", event: "read", payload: { from: "conseiller", at: new Date().toISOString() } }).catch(() => { /* noop */ });
    return () => {
      userChanRef.current = null;
      sb.removeChannel(ch);
    };
  }, [selectedUid]);

  // Auto-scroll thread to bottom on new messages.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, selectedUid]);

  const selectedConvo = useMemo(() => convos.find((c) => c.userId === selectedUid) ?? null, [convos, selectedUid]);
  const isMine = selectedConvo?.assignee && me?.username && selectedConvo.assignee === me.username;

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Messages
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            Conversations en temps réel
          </p>
        </div>
        <button
          onClick={loadConvos}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Rafraîchir"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loadingList ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div
        className="sticky z-10 -mx-4 px-4 pt-1 pb-3 mb-3"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 60px)",
          background: "color-mix(in srgb, var(--surface-app) 92%, transparent)",
          backdropFilter: "saturate(160%) blur(12px)",
          WebkitBackdropFilter: "saturate(160%) blur(12px)",
        }}
      >
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "var(--ippoo-text-muted)" }} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            className="w-full rounded-2xl pl-10 pr-3 focus:outline-none"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--line-hairline)",
              color: "var(--ippoo-text)",
              fontSize: "16px",
              minHeight: 44,
            }}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {(["", "ouvert", "en_cours", "resolu"] as Status[]).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              className="shrink-0 px-3.5 rounded-full transition active:scale-95"
              style={{
                minHeight: 36,
                background: status === s ? "var(--accent-primary)" : "var(--surface-card)",
                color: status === s ? "white" : "var(--ippoo-text-muted)",
                border: `1px solid ${status === s ? "var(--accent-primary)" : "var(--line-hairline)"}`,
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              {s ? STATUS_LABELS[s].label : "Tous"}
            </button>
          ))}
          <button
            onClick={() => setMineOnly((v) => !v)}
            className="shrink-0 px-3.5 rounded-full transition active:scale-95"
            style={{
              minHeight: 36,
              background: mineOnly ? "var(--accent-primary)" : "var(--surface-card)",
              color: mineOnly ? "white" : "var(--ippoo-text-muted)",
              border: `1px solid ${mineOnly ? "var(--accent-primary)" : "var(--line-hairline)"}`,
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            Mes conv.
          </button>
        </div>
      </div>

      {loadingList && convos.length === 0 && <ListSkeleton rows={7} />}
      {!loadingList && convos.length === 0 && (
        <EmptyState
          art={<EmptyInboxArt />}
          title={q || status || mineOnly ? "Aucun résultat" : "Inbox vide"}
          hint={
            q || status || mineOnly
              ? "Essayez d'élargir vos filtres ou de retirer votre recherche."
              : "Les nouveaux messages clients apparaîtront ici en temps réel."
          }
        />
      )}

      <ul className="space-y-2">
        {convos.map((c) => {
          const st = STATUS_LABELS[c.status as keyof typeof STATUS_LABELS];
          return (
            <li key={c.userId}>
              <button
                onClick={() => openThread(c.userId)}
                className="w-full text-left rounded-2xl p-3 active:scale-[0.99] transition"
                style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar url={c.avatarUrl} name={c.userName} email={c.userEmail} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--ippoo-text)" }}>
                        {c.userName || c.userEmail || "Client"}
                      </p>
                      <span className="shrink-0" style={{ fontSize: "0.68rem", color: "var(--ippoo-text-muted)" }}>
                        {relativeTime(c.lastAt)}
                      </span>
                    </div>
                    <p className="truncate mt-0.5" style={{ fontSize: "0.82rem", color: "var(--ippoo-text-muted)" }}>
                      {c.lastFrom === "conseiller" ? "Vous : " : ""}{c.lastMessage || "—"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {st && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color, fontSize: "0.64rem", fontWeight: 800 }}
                        >
                          {st.label}
                        </span>
                      )}
                      {c.assignee && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>
                          · {c.assignee === me?.username ? "Moi" : c.assignee}
                        </span>
                      )}
                      {c.unread > 0 && (
                        <span
                          className="ml-auto px-2 min-w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-white"
                          style={{ background: "var(--accent-primary)", fontSize: "0.68rem", fontWeight: 800 }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Vue conversation : plein écran natif, recouvre la bottom bar.
          Header sticky avec bouton retour iOS-style, messages bulles
          asymétriques, composer fixe avec safe-area-inset-bottom. */}
      {selectedConvo && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--surface-app)" }}>
          <header
            className="shrink-0"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
              paddingBottom: 10,
              paddingLeft: "max(env(safe-area-inset-left, 0px), 12px)",
              paddingRight: "max(env(safe-area-inset-right, 0px), 12px)",
              background: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
              backdropFilter: "saturate(160%) blur(14px)",
              WebkitBackdropFilter: "saturate(160%) blur(14px)",
              borderBottom: "1px solid var(--line-hairline)",
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedUid(null)}
                className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ color: "var(--accent-primary)", fontSize: "1.2rem", fontWeight: 800 }}
                aria-label="Retour"
              >
                ‹
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--ippoo-text)" }}>
                  {selectedConvo.userName || selectedConvo.userEmail}
                </p>
                <p className="truncate" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)" }}>
                  {selectedConvo.memberNumber || selectedConvo.userEmail}
                </p>
              </div>
              <button
                onClick={() => navigate(`/agent/clients/${selectedConvo.userId}`)}
                className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ color: "var(--ippoo-text-muted)", background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
                title="Fiche client"
              >
                <IdCard className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {!isMine && (
                <button
                  onClick={claim}
                  className="shrink-0 px-3 rounded-full text-white inline-flex items-center gap-1.5 active:scale-95 transition"
                  style={{ background: "var(--accent-primary)", fontSize: "0.74rem", fontWeight: 800, minHeight: 32 }}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Prendre
                </button>
              )}
              {(["ouvert", "en_cours", "resolu"] as const).map((s) => {
                const st = STATUS_LABELS[s];
                const active = selectedConvo.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className="shrink-0 px-3 rounded-full inline-flex items-center gap-1 active:scale-95 transition"
                    style={{
                      background: active ? st.bg : "var(--surface-app)",
                      color: active ? st.color : "var(--ippoo-text-muted)",
                      border: `1px solid ${active ? st.bg : "var(--line-hairline)"}`,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      minHeight: 32,
                    }}
                  >
                    {s === "resolu" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {st.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5"
            style={{ background: "var(--surface-app)" }}
          >
            {loadingThread && (
              <div className="text-center py-6" style={{ color: "var(--ippoo-text-muted)", fontSize: "0.84rem" }}>
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" /> Chargement…
              </div>
            )}
            {!loadingThread && thread.length === 0 && (
              <p className="text-center py-8" style={{ color: "var(--ippoo-text-muted)", fontSize: "0.84rem" }}>
                Aucun message pour l'instant.
              </p>
            )}
            {thread.map((m) => {
              const mine = m.from === "conseiller";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[82%] rounded-3xl px-4 py-2.5"
                    style={{
                      background: mine ? "var(--accent-primary)" : "var(--surface-card)",
                      color: mine ? "#FFFFFF" : "var(--ippoo-text)",
                      border: mine ? "none" : "1px solid var(--line-hairline)",
                      borderBottomRightRadius: mine ? 6 : 24,
                      borderBottomLeftRadius: mine ? 24 : 6,
                      boxShadow: mine ? "0 2px 6px rgba(255,59,87,0.20)" : "none",
                    }}
                  >
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{m.body}</p>
                    <p
                      className="mt-1"
                      style={{
                        fontSize: "0.64rem",
                        color: mine ? "rgba(255,255,255,0.78)" : "var(--ippoo-text-muted)",
                      }}
                    >
                      {relativeTime(m.createdAt)}{m.read && mine ? " · lu" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </div>

          {/* Composer fixe en bas avec safe-area. Bottom sheet templates
              s'ouvre par-dessus quand l'utilisateur tape sur l'icône livre. */}
          <form
            onSubmit={sendReply}
            className="shrink-0 relative"
            style={{
              background: "var(--surface-card)",
              borderTop: "1px solid var(--line-hairline)",
              paddingTop: 10,
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
              paddingLeft: "max(env(safe-area-inset-left, 0px), 12px)",
              paddingRight: "max(env(safe-area-inset-right, 0px), 12px)",
            }}
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setTplOpen(true)}
                className="shrink-0 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text-muted)" }}
                title="Templates"
                aria-label="Templates"
              >
                <BookText className="w-[18px] h-[18px]" />
              </button>
              <textarea
                ref={replyRef}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  // A7 — throttle 2s entre deux pings typing.
                  const now = Date.now();
                  if (now - typingSentAtRef.current > 2000 && userChanRef.current) {
                    typingSentAtRef.current = now;
                    userChanRef.current.send({
                      type: "broadcast", event: "typing",
                      payload: { from: "conseiller", typing: true },
                    }).catch(() => { /* noop */ });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    sendReply(e as any);
                  }
                }}
                placeholder="Message…"
                rows={1}
                className="flex-1 resize-none rounded-3xl px-4 py-2.5 focus:outline-none"
                style={{
                  background: "var(--surface-app)",
                  border: "1px solid var(--line-hairline)",
                  color: "var(--ippoo-text)",
                  fontSize: "16px",
                  maxHeight: 140,
                  minHeight: 44,
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="shrink-0 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition"
                style={{ background: "var(--accent-primary)", boxShadow: "0 4px 12px rgba(255,59,87,0.30)" }}
                aria-label="Envoyer"
              >
                <Send className="w-[18px] h-[18px]" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom sheet templates */}
      {tplOpen && selectedConvo && (
        <div className="fixed inset-0 z-[60] flex items-end" style={{ background: "rgba(14,19,32,0.45)" }} onClick={() => setTplOpen(false)}>
          <div
            className="w-full mx-auto rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background: "var(--surface-card)",
              maxWidth: 672,
              maxHeight: "85vh",
              animation: "slideUpTpl 220ms cubic-bezier(0.2,0.8,0.2,1)",
              boxShadow: "0 -10px 30px rgba(14,19,32,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <span className="block rounded-full" style={{ width: 40, height: 4, background: "var(--line-hairline)" }} />
            </div>
            <div className="px-5 pb-2 flex items-center justify-between">
              <p style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.015em" }}>Templates</p>
              <button
                type="button"
                onClick={() => setTplManageOpen((v) => !v)}
                className="px-3 rounded-full active:scale-95 transition"
                style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800, minHeight: 36 }}
              >
                {tplManageOpen ? "Terminé" : "Gérer"}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
              <div className="px-4 pb-3 space-y-2">
                {templates.length === 0 ? (
                  <p className="p-6 text-center rounded-2xl" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text-muted)", fontSize: "0.85rem" }}>
                    Aucun template. Ajoutez vos formules récurrentes ci-dessous.
                  </p>
                ) : templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-2xl px-3 py-3" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
                    <button
                      type="button"
                      onClick={() => insertTemplate(t)}
                      className="flex-1 text-left min-w-0 active:scale-[0.99] transition"
                    >
                      <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--ippoo-text)" }}>{t.title}</p>
                      <p className="truncate" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>{t.body}</p>
                    </button>
                    {tplManageOpen && (
                      <button
                        type="button"
                        onClick={() => removeTemplate(t.id)}
                        className="shrink-0 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center active:scale-95 transition"
                        style={{ color: "#C0263A", background: "rgba(192,38,58,0.10)" }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {tplManageOpen && (
                <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid var(--line-hairline)", paddingTop: 12 }}>
                  <input
                    value={tplTitle}
                    onChange={(e) => setTplTitle(e.target.value)}
                    placeholder="Titre court (ex : Accusé de réception)"
                    className="w-full px-3 rounded-2xl focus:outline-none"
                    style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)", fontSize: "16px", minHeight: 44 }}
                  />
                  <textarea
                    value={tplBody}
                    onChange={(e) => setTplBody(e.target.value)}
                    rows={3}
                    placeholder="Contenu du template…"
                    className="w-full px-3 py-3 rounded-2xl focus:outline-none resize-none"
                    style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)", fontSize: "16px" }}
                  />
                  <button
                    type="button"
                    onClick={createTemplate}
                    className="w-full rounded-2xl text-white inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                    style={{ fontSize: "0.92rem", fontWeight: 800, background: "var(--accent-primary)", minHeight: 48, boxShadow: "0 4px 12px rgba(255,59,87,0.25)" }}
                  >
                    <Plus className="w-[18px] h-[18px]" /> Ajouter
                  </button>
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes slideUpTpl { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
