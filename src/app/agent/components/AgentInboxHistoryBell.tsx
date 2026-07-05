import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { Inbox, MessageCircle, FileWarning, ShieldCheck, X } from "lucide-react";
import {
  clearInboxHistory,
  getInboxHistory,
  subscribeInboxHistory,
  type InboxEvent,
} from "./inboxHistory";

function useInboxHistory(): InboxEvent[] {
  return useSyncExternalStore(subscribeInboxHistory, getInboxHistory, getInboxHistory);
}

function relTime(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const META: Record<InboxEvent["kind"], { Icon: typeof MessageCircle; bg: string; color: string }> = {
  message: { Icon: MessageCircle, bg: "rgba(255,59,87,0.12)", color: "var(--accent-primary)" },
  claim: { Icon: FileWarning, bg: "#FFE6CC", color: "#B85400" },
  kyc: { Icon: ShieldCheck, bg: "#D4F4E2", color: "#0F7A47" },
};

export function AgentInboxHistoryBell() {
  const navigate = useNavigate();
  const history = useInboxHistory();
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(history.length);

  useEffect(() => {
    if (open) setSeenCount(history.length);
  }, [open, history.length]);

  const unread = Math.max(0, history.length - seenCount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center active:scale-95 transition"
        style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
        aria-label="Historique inbox"
        title="Derniers événements inbox"
      >
        <Inbox className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
            style={{
              background: "var(--accent-primary)",
              color: "white",
              fontSize: "0.6rem",
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(14,19,32,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm h-full overflow-y-auto flex flex-col"
            style={{ background: "var(--surface-card)", boxShadow: "-10px 0 30px rgba(14,19,32,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--line-hairline)" }}>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 900 }}>Inbox récente</p>
                <p style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
                  10 derniers événements de cette session
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center active:scale-95"
                style={{ border: "1px solid var(--line-hairline)" }}
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 px-3 py-3">
              {history.length === 0 ? (
                <p className="text-center py-12" style={{ fontSize: "0.85rem", color: "var(--ippoo-text-muted)" }}>
                  Aucun événement reçu depuis l'ouverture de la console.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((ev) => {
                    const meta = META[ev.kind];
                    const Icon = meta.Icon;
                    return (
                      <li key={ev.id}>
                        <button
                          onClick={() => { setOpen(false); navigate(ev.url); }}
                          className="w-full text-left rounded-2xl p-3 active:scale-[0.99] transition flex items-start gap-3"
                          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
                        >
                          <span
                            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate" style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--ippoo-text)" }}>{ev.title}</span>
                              <span className="shrink-0" style={{ fontSize: "0.66rem", color: "var(--ippoo-text-muted)" }}>{relTime(ev.at)}</span>
                            </span>
                            <span className="block truncate mt-0.5" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
                              {ev.body}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {history.length > 0 && (
              <footer className="px-4 py-3 border-t" style={{ borderColor: "var(--line-hairline)" }}>
                <button
                  onClick={() => { clearInboxHistory(); setSeenCount(0); }}
                  className="w-full px-3 py-2 rounded-xl active:scale-95"
                  style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.8rem", fontWeight: 800 }}
                >
                  Effacer l'historique
                </button>
              </footer>
            )}
          </div>
        </div>
      )}
    </>
  );
}
