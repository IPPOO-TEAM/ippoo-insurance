import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { getSupabase } from "./supabaseClient";
import { qk } from "./queryClient";
import { appToast } from "./toast";

// Short two-tone "ding" generated on the fly via WebAudio so we don't have to
// ship an audio asset. Autoplay restrictions: browsers allow audio once the
// user has interacted with the page at least once — which is always true by
// the time a notification arrives in the app shell.
let audioCtx: AudioContext | null = null;
function playDing() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const tones = [
      { f: 880, t: 0,    d: 0.18 },
      { f: 1320, t: 0.12, d: 0.22 },
    ];
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = tone.f;
      gain.gain.setValueAtTime(0, now + tone.t);
      gain.gain.linearRampToValueAtTime(1, now + tone.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + tone.d);
      osc.connect(gain).connect(master);
      osc.start(now + tone.t);
      osc.stop(now + tone.t + tone.d + 0.02);
    }
  } catch {
    /* audio blocked — non fatal */
  }
}

function buzz() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([60, 40, 120]);
    }
  } catch {
    /* vibration not supported — non fatal */
  }
}

type Notif = {
  id: string;
  title: string;
  body: string;
  type?: "info" | "success" | "warn" | string;
  to?: string;
  createdAt?: string;
};

// Subscribes once per authenticated session to the user's private
// `notifications:<uid>` realtime topic. Any new notification produced by the
// server (subscription confirmed, claim status update, payment, broadcast,
// renewal alert…) lands here within ~200 ms and is surfaced as a push-style
// toast — and as a native browser notification when the tab is hidden and
// permission was granted.
export function NotificationsRealtime() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const sb = getSupabase();
    const topic = `notifications:${user.id}`;
    const channel = sb.channel(topic, { config: { broadcast: { self: false } } });

    channel.on("broadcast", { event: "notif:new" }, ({ payload }) => {
      const n = payload as Notif | undefined;
      if (!n?.id || seenRef.current.has(n.id)) return;
      seenRef.current.add(n.id);
      // Keep dedupe set bounded.
      if (seenRef.current.size > 200) {
        const arr = Array.from(seenRef.current);
        seenRef.current = new Set(arr.slice(arr.length - 100));
      }

      // Refresh notification list + badge counts everywhere.
      qc.invalidateQueries({ queryKey: qk.notifications });

      // Route-aware refresh: events poussés par agents/admin (réassignation
      // sinistre, décision KYC, confirmation paiement…) doivent invalider la
      // query métier correspondante pour que la page affichée se mette à jour
      // sans refresh manuel.
      const to = n.to ?? "";
      if (to.includes("/sinistres") || /sinistre|claim/i.test(`${n.title} ${n.body}`)) {
        qc.invalidateQueries({ queryKey: qk.claims });
      }
      if (to.includes("/kyc") || /kyc|pièce.*identit/i.test(`${n.title} ${n.body}`)) {
        qc.invalidateQueries({ queryKey: qk.documents });
        qc.invalidateQueries({ queryKey: qk.me });
      }
      if (to.includes("/cotisations") || /paiement|cotisation|payment/i.test(`${n.title} ${n.body}`)) {
        qc.invalidateQueries({ queryKey: qk.payments });
        qc.invalidateQueries({ queryKey: qk.contracts });
        qc.invalidateQueries({ queryKey: qk.billing });
      }
      if (to.includes("/messagerie")) {
        qc.invalidateQueries({ queryKey: qk.messages });
      }

      // Audio + haptic — mimics a native push.
      playDing();
      buzz();

      // Push-style in-app toast.
      const opts = {
        description: n.body,
        duration: 7000,
        ...(n.to ? { action: { label: "Ouvrir", to: n.to } } : {}),
      };
      const kind = n.type === "success" ? "success" : n.type === "warn" ? "warning" : "info";
      (appToast as any)[kind](n.title, opts);

      // Native push when the tab is in the background.
      try {
        if (
          typeof document !== "undefined" &&
          document.hidden &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const native = new Notification(n.title, {
            body: n.body,
            tag: n.id,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            vibrate: [60, 40, 120],
            silent: false,
          } as NotificationOptions);
          native.onclick = () => {
            window.focus();
            if (n.to) navigate(n.to);
            else navigate("/espace-client/notifications");
            native.close();
          };
        }
      } catch {
        /* notifications API can throw in private mode — non fatal */
      }
    });

    channel.subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [user?.id, qc, navigate]);

  return null;
}
