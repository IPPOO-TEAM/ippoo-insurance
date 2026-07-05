import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Send, MessageCircle, Headphones, Check, CheckCheck, Paperclip, FileText, Download, Loader2, Reply, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useApiData, formatDate } from "../hooks";
import { api } from "../api";
import { getSupabase } from "../supabaseClient";
import { subscribeUserTable } from "../realtime";
import { toast } from "sonner";

export function MessageriePage() {
  const { session, user } = useAuth();
  const q = useApiData((t) => api.messages(t));
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string; body: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [advisorOnline, setAdvisorOnline] = useState(false);
  const [sla, setSla] = useState<{ online: number; etaLabel: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [q.data?.messages.length, typing]);

  // SLA public (C7) : refresh à l'ouverture et toutes les 60s. Affiché juste
  // sous le header de la messagerie pour fixer l'attente du client.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.slaPublic().then((r) => {
        if (!cancelled) setSla({ online: r.online, etaLabel: r.etaLabel });
      }).catch(() => { /* non bloquant */ });
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  // Mark advisor messages as read on open and whenever new ones arrive while
  // the tab is visible. This triggers a `message:read` broadcast to admin.
  useEffect(() => {
    if (!session?.access_token) return;
    const hasUnreadAdvisor = (q.data?.messages ?? []).some((m) => m.from === "conseiller" && !m.read);
    if (!hasUnreadAdvisor) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    api.markMessagesRead(session.access_token).then(() => q.reload()).catch(() => {});
  }, [q.data?.messages, session?.access_token]);

  // Realtime — recharge à chaque INSERT/UPDATE/DELETE sur les messages de
  // l'utilisateur (filtré côté serveur via user_id = auth.uid()).
  useEffect(() => {
    if (!user?.id) return;
    return subscribeUserTable("messages", user.id, () => q.reload());
  }, [user?.id, q]);

  useEffect(() => {
    if (!user?.id) return;
    const sb = getSupabase();
    const channel = sb.channel(`chat:${user.id}`, {
      config: { presence: { key: user.id }, broadcast: { self: false } },
    });
    channel.on("broadcast", { event: "message:new" }, () => {
      q.reload();
    });
    channel.on("broadcast", { event: "message:read" }, () => {
      q.reload();
    });
    channel.on("broadcast", { event: "message:update" }, () => {
      q.reload();
    });
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload?.from && payload.from !== "conseiller") return;
      setTyping(!!payload?.typing);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (payload?.typing) {
        typingTimerRef.current = window.setTimeout(() => setTyping(false), 3500);
      }
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, Array<{ role?: string }>>;
      const hasAdvisor = Object.values(state).some((arr) => arr.some((p) => p.role === "conseiller"));
      setAdvisorOnline(hasAdvisor);
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ role: "client", joinedAt: new Date().toISOString() });
      }
    });
    channelRef.current = channel;
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      sb.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id]);

  // Throttle outbound typing pings to once per ~2s.
  const lastTypingSentRef = useRef(0);
  function emitTyping() {
    if (!channelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { from: "user", typing: true } });
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session?.access_token) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 10 Mo)"); return; }
    setSending(true);
    try {
      await api.sendMessageAttachment(session.access_token, file, text.trim() || undefined);
      setText("");
      await q.reload();
    } catch (err) {
      toast.error("Envoi impossible", { description: err instanceof Error ? err.message : "Erreur" });
    } finally { setSending(false); }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !session?.access_token || sending) return;
    setSending(true);
    const replyId = replyTo?.id;
    const editing = editingId;
    setText("");
    setReplyTo(null);
    setEditingId(null);
    try {
      if (editing) {
        await api.editMessage(session.access_token, editing, content);
      } else {
        await api.sendMessage(session.access_token, content, replyId);
      }
      await q.reload();
    } catch (err) {
      console.error("Send message failed:", err);
      toast.error("Envoi impossible");
    } finally {
      setSending(false);
    }
  }

  const messages = q.data?.messages ?? [];
  const msgById = new Map(messages.map((m) => [m.id, m]));

  async function deleteMine(id: string) {
    if (!session?.access_token) return;
    if (!window.confirm("Supprimer ce message ?")) return;
    try { await api.deleteMessage(session.access_token, id); await q.reload(); }
    catch (err) { toast.error("Suppression impossible", { description: err instanceof Error ? err.message : "Erreur" }); }
  }
  function startEdit(m: typeof messages[number]) {
    setEditingId(m.id); setReplyTo(null); setText(m.body);
  }
  function cancelEdit() { setEditingId(null); setText(""); }

  const shell = (
    <div
      className="ippoo-messagerie-shell fixed left-0 right-0 flex flex-col bg-white z-20"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 64px)",
        bottom: "calc(var(--nav-bottom-h, 0px) + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`
        @media (min-width: 1024px) {
          .ippoo-messagerie-shell { top: calc(env(safe-area-inset-top, 0px) + 76px) !important; bottom: 0 !important; }
        }
      `}</style>
        <div className="px-5 py-4 border-b border-black/5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A6BFF] to-[#8A4BFF] flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Conseiller IPPOO</p>
            <p className="flex items-center gap-1" style={{ fontSize: "0.75rem", fontWeight: 700, color: advisorOnline ? "#16B26A" : "#888" }}>
              <span className={`inline-block w-2 h-2 rounded-full ${advisorOnline ? "bg-[#16B26A] animate-pulse" : "bg-[#888]"}`} />
              {typing ? "écrit..." : advisorOnline ? "En ligne" : "Hors ligne"}
            </p>
          </div>
          {sla && (
            <div className="text-right shrink-0" title={`${sla.online} conseiller(s) en ligne`}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#666", letterSpacing: "0.02em" }}>DÉLAI</p>
              <p style={{ fontSize: "0.78rem", fontWeight: 800, color: sla.online > 0 ? "#0F7A47" : "#8A5A00" }}>
                {sla.etaLabel.replace(/^Réponse sous /, "≤ ")}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 bg-[#F9FAFC]">
          {q.loading && <p className="text-[#666]">Chargement...</p>}
          {!q.loading && messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-[#2A6BFF]" />
              <p className="text-[#666]">Aucun message. Lancez la conversation !</p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.from === "user";
            const deleted = !!m.deletedAt;
            const quoted = m.replyToId ? msgById.get(m.replyToId) : undefined;
            const canEdit = mine && !deleted && (Date.now() - new Date(m.createdAt).getTime() < 5 * 60 * 1000);
            const canDelete = mine && !deleted;
            return (
              <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  <div
                    className="px-4 py-3 rounded-2xl"
                    style={{
                      background: deleted ? "#EEE" : mine ? "linear-gradient(90deg,#FF3B57,#FF7A00)" : "white",
                      color: deleted ? "#888" : mine ? "white" : "#111",
                      borderBottomRightRadius: mine ? "0.4rem" : undefined,
                      borderBottomLeftRadius: mine ? undefined : "0.4rem",
                      fontSize: "0.9rem",
                      boxShadow: mine || deleted ? undefined : "0 1px 2px rgba(0,0,0,0.04)",
                      fontStyle: deleted ? "italic" : undefined,
                    }}
                  >
                    {quoted && !deleted && (
                      <div
                        className="mb-2 px-2 py-1 rounded-lg border-l-2"
                        style={{
                          borderColor: mine ? "rgba(255,255,255,0.7)" : "#FF3B57",
                          background: mine ? "rgba(255,255,255,0.15)" : "#F5F6FA",
                          fontSize: "0.72rem",
                        }}
                      >
                        <p style={{ fontWeight: 800 }}>{quoted.from === "user" ? quoted.author : "Service client"}</p>
                        <p className="line-clamp-2 opacity-90">{quoted.body || (quoted.attachment ? "📎 Pièce jointe" : "")}</p>
                      </div>
                    )}
                    {deleted
                      ? <span>Message supprimé</span>
                      : <>
                          {m.attachment && <AttachmentView att={m.attachment} mine={mine} token={session?.access_token} />}
                          {m.body && <div className={m.attachment ? "mt-2" : ""}>{m.body}</div>}
                        </>}
                  </div>
                  <p className={`mt-1 text-[#888] flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`} style={{ fontSize: "0.7rem" }}>
                    <span>{mine ? m.author : "Service client"} · {formatDate(m.createdAt)}{m.editedAt && !deleted ? " · modifié" : ""}</span>
                    {mine && !deleted && (m.read
                      ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "#2A6BFF" }} aria-label="Lu" />
                      : <Check className="w-3.5 h-3.5" aria-label="Envoyé" />)}
                    {!deleted && (
                      <button onClick={() => setReplyTo({ id: m.id, author: mine ? m.author : "Service client", body: m.body || (m.attachment ? "📎 Pièce jointe" : "") })}
                        className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#0E1320]" title="Répondre" aria-label="Répondre">
                        <Reply className="w-3 h-3" />
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => startEdit(m)} className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#0E1320]" title="Modifier" aria-label="Modifier">
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMine(m.id)} className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-[#C0263A]" title="Supprimer" aria-label="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-white shadow-sm flex items-center gap-1.5" style={{ borderBottomLeftRadius: "0.4rem" }}>
                <span className="w-2 h-2 rounded-full bg-[#888] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#888] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#888] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {(replyTo || editingId) && (
          <div className="px-4 py-2 border-t border-black/5 bg-[#F9FAFC] flex items-center gap-2">
            <div className="flex-1 min-w-0 border-l-2 border-[#FF3B57] pl-2">
              <p className="text-[#666] truncate" style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                {editingId ? "Modification du message" : `Réponse à ${replyTo?.author}`}
              </p>
              {replyTo && <p className="text-[#888] truncate" style={{ fontSize: "0.72rem" }}>{replyTo.body}</p>}
            </div>
            <button type="button" onClick={() => { setReplyTo(null); if (editingId) cancelEdit(); }} className="p-1 text-[#666] hover:text-[#0E1320]" aria-label="Annuler">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={onSend} className="shrink-0 p-4 border-t border-black/5 flex items-center gap-2 bg-white">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,audio/*,video/mp4,video/webm,text/plain"
            onChange={onPickFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="p-3 rounded-xl border-2 border-black/10 text-[#666] hover:text-[#0E1320] hover:border-black/20 disabled:opacity-50"
            aria-label="Joindre un fichier"
            title="Joindre un fichier (max 10 Mo)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); emitTyping(); }}
            placeholder="Écrivez votre message..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] resize-none overflow-y-auto leading-snug"
            style={{ fontSize: "0.9rem", maxHeight: "200px" }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="p-3 rounded-xl text-white disabled:opacity-50"
            style={{ background: "#FF3B57" }}
            aria-label="Envoyer"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
    </div>
  );

  return typeof document === "undefined" ? shell : createPortal(shell, document.body);
}

function formatSize(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function AttachmentView({
  att, mine, token, getUrl,
}: {
  att: { name: string; mime: string; size: number; path: string };
  mine: boolean;
  token?: string;
  getUrl?: (path: string) => Promise<string>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isImage = att.mime.startsWith("image/");
  const isAudio = att.mime.startsWith("audio/");
  const isVideo = att.mime.startsWith("video/");

  useEffect(() => {
    let alive = true;
    if (!isImage && !isAudio && !isVideo) return;
    (async () => {
      try {
        setLoading(true);
        const u = getUrl ? await getUrl(att.path) : token ? (await api.messageAttachmentUrl(token, att.path)).url : null;
        if (alive) setUrl(u);
      } catch { /* ignore */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [att.path, token, isImage, isAudio, isVideo]);

  async function download() {
    try {
      const u = getUrl ? await getUrl(att.path) : token ? (await api.messageAttachmentUrl(token, att.path)).url : null;
      if (u) window.open(u, "_blank", "noopener");
    } catch (err) {
      toast.error("Téléchargement impossible", { description: err instanceof Error ? err.message : "Erreur" });
    }
  }

  if (isImage) {
    return url ? (
      <button type="button" onClick={download} className="block">
        <img src={url} alt={att.name} className="rounded-xl max-w-[260px] max-h-[260px] object-cover" />
      </button>
    ) : (
      <div className="w-[180px] h-[120px] rounded-xl bg-black/10 flex items-center justify-center">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
      </div>
    );
  }
  if (isAudio && url) return <audio controls src={url} className="max-w-[260px]" />;
  if (isVideo && url) return <video controls src={url} className="rounded-xl max-w-[260px]" />;

  return (
    <button
      type="button"
      onClick={download}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{ background: mine ? "rgba(255,255,255,0.18)" : "#F5F6FA", color: mine ? "white" : "#0E1320" }}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-left min-w-0">
        <span className="block truncate max-w-[180px]" style={{ fontWeight: 700, fontSize: "0.82rem" }}>{att.name}</span>
        <span className="block opacity-70" style={{ fontSize: "0.7rem" }}>{formatSize(att.size)}</span>
      </span>
      <Download className="w-4 h-4 ml-1 opacity-80" />
    </button>
  );
}

export { AttachmentView };
