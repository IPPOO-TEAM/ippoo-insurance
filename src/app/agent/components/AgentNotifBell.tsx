import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { agentApi } from "../api";
import { getSupabase } from "../../espace-client/supabaseClient";

export function AgentNotifBell({ token, matricule }: { token: string; matricule: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Awaited<ReturnType<typeof agentApi.listNotifs>>["notifs"]>([]);
  const navigate = useNavigate();

  async function reload() {
    if (!token) return;
    try {
      const res = await agentApi.listNotifs(token);
      setItems(res.notifs);
      setUnread(res.unread);
    } catch { /* silencieux */ }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  // Realtime : on s'abonne au canal personnel pour bip immédiat.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    if (!matricule) return;
    const sb = getSupabase();
    if (!sb) return;
    const ch = sb.channel(`agent:notifs:${matricule}`)
      .on("broadcast", { event: "notif:new" }, () => reloadRef.current())
      .subscribe();
    const id = setInterval(() => reloadRef.current(), 60_000);
    return () => { clearInterval(id); sb.removeChannel(ch); };
  }, [matricule]);

  async function clickItem(n: typeof items[number]) {
    if (!n.read) {
      try { await agentApi.markNotifRead(token, n.id); } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.url) navigate(n.url);
    reload();
  }
  async function markAll() {
    try { await agentApi.markAllNotifsRead(token); reload(); } catch { /* ignore */ }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
        style={{ color: "var(--ippoo-text-muted)", background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
        title="Notifications"
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
            style={{
              minWidth: 16, height: 16, padding: "0 4px",
              background: "var(--accent-primary)", color: "white",
              fontSize: "0.6rem", fontWeight: 900,
              boxShadow: "0 0 0 2px var(--surface-card)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6"
          style={{ background: "rgba(14,19,32,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden mt-12"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--line-hairline)" }}>
              <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Notifications</p>
              {items.length > 0 && (
                <button
                  onClick={markAll}
                  style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--accent-primary)" }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center" style={{ fontSize: "0.85rem", color: "var(--ippoo-text-muted)" }}>
                  Aucune notification.
                </p>
              ) : items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => clickItem(n)}
                  className="w-full text-left px-4 py-3 active:scale-[0.99] transition"
                  style={{
                    borderBottom: "1px solid var(--line-hairline)",
                    background: n.read ? "transparent" : "rgba(255,59,87,0.04)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 shrink-0 rounded-full"
                      style={{
                        width: 6, height: 6,
                        background: n.read ? "transparent" : "var(--accent-primary)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: "0.88rem", fontWeight: n.read ? 600 : 800 }}>{n.title}</p>
                      {n.body && (
                        <p className="truncate" style={{ fontSize: "0.76rem", color: "var(--ippoo-text-muted)" }}>{n.body}</p>
                      )}
                      <p style={{ fontSize: "0.68rem", color: "var(--ippoo-text-muted)", marginTop: 2 }}>
                        {new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
