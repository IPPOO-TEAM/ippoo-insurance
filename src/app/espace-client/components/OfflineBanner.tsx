import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getQueue, isOnline, replay, startOfflineQueueLoop, subscribe, type QueuedAction } from "../offlineQueue";
import { getCookieConsent } from "../../components/CookieConsent";

export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(isOnline());
  const [queue, setQueue] = useState<QueuedAction[]>(getQueue());
  const [syncing, setSyncing] = useState(false);
  const [consentResolved, setConsentResolved] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startOfflineQueueLoop();
    setConsentResolved(getCookieConsent() !== null);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onConsent = () => setConsentResolved(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("ippoo:consent", onConsent as EventListener);
    const unsub = subscribe(setQueue);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("ippoo:consent", onConsent as EventListener);
      unsub();
    };
  }, []);

  if (!consentResolved) return null;
  if (online && queue.length === 0) return null;

  async function sync() {
    setSyncing(true);
    try { await replay(); } finally { setSyncing(false); }
  }

  return (
    <div
      className="fixed bottom-[calc(var(--nav-bottom-h)+env(safe-area-inset-bottom,0px)+12px)] left-3 right-3 z-40 mx-auto max-w-md rounded-xl shadow-lg border"
      style={{
        background: online ? "#FFF7E6" : "#FEE4E2",
        borderColor: online ? "#F0B100" : "#FDA29B",
        color: online ? "#7C4A00" : "#7A271A",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="px-3 py-2 flex items-center gap-2">
        <CloudOff className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          {online
            ? `${queue.length} action${queue.length > 1 ? "s" : ""} en attente de synchro`
            : `Hors-ligne · ${queue.length} action${queue.length > 1 ? "s" : ""} en file`}
        </div>
        {queue.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1 rounded-md hover:bg-white/50"
            aria-label={open ? "Masquer le détail" : "Voir le détail"}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        {online && queue.length > 0 && (
          <button
            onClick={sync}
            disabled={syncing}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 hover:bg-white disabled:opacity-50"
            style={{ fontSize: "0.72rem", fontWeight: 700 }}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} /> Sync
          </button>
        )}
      </div>
      {open && queue.length > 0 && (
        <ul className="border-t px-3 py-2 max-h-40 overflow-auto space-y-1" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {queue.slice(0, 12).map((q, i) => {
            const label = (q as any).label ?? (q as any).path ?? "Action";
            const at = (q as any).queuedAt ?? (q as any).createdAt;
            const ago = at ? Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 1000)) : null;
            return (
              <li key={(q as any).id ?? i} className="flex items-center gap-2" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "currentColor", opacity: 0.6 }} />
                <span className="flex-1 truncate">{String(label)}</span>
                {ago != null && (
                  <span className="shrink-0" style={{ opacity: 0.7 }}>
                    {ago < 60 ? `${ago}s` : ago < 3600 ? `${Math.round(ago / 60)} min` : `${Math.round(ago / 3600)} h`}
                  </span>
                )}
              </li>
            );
          })}
          {queue.length > 12 && (
            <li style={{ fontSize: "0.7rem", opacity: 0.7 }}>… et {queue.length - 12} de plus</li>
          )}
        </ul>
      )}
    </div>
  );
}
