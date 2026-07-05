import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "../../espace-client/supabaseClient";
import { pushInboxEvent } from "./inboxHistory";

// Listener global pour les nouveaux événements arrivant dans la file
// conseillers (message client, sinistre, KYC). N'agit que si le conseiller
// est en ligne — en pause, on ne le dérange pas. Joue un ding court + toast
// cliquable vers la bonne page, et invalide la query React-Query liée pour
// refetch immédiat.
export function AgentInboxNotifier({ online }: { online: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!online) return;
    const sb = getSupabase();
    if (!sb) return;

    function ding() {
      try {
        const AC: typeof AudioContext | undefined =
          (window as any).AudioContext ?? (window as any).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.3);
      } catch { /* audio denied */ }
    }

    function dedupe(id: string) {
      if (seen.current.has(id)) return true;
      seen.current.add(id);
      if (seen.current.size > 300) {
        const arr = Array.from(seen.current).slice(-150);
        seen.current = new Set(arr);
      }
      return false;
    }

    const ch = sb.channel("agent:inbox")
      .on("broadcast", { event: "message:new" }, ({ payload }: any) => {
        const id = `m:${payload?.userId}:${payload?.at}`;
        if (dedupe(id)) return;
        ding();
        qc.invalidateQueries({ queryKey: ["agent", "conversations"] });
        const url = `/agent/inbox?uid=${payload?.userId}`;
        toast(`💬 ${payload?.userName || "Client"}`, {
          description: payload?.preview || "Nouveau message",
          action: { label: "Ouvrir", onClick: () => navigate(url) },
        });
        pushInboxEvent({
          id,
          kind: "message",
          title: payload?.userName || "Client",
          body: payload?.preview || "Nouveau message",
          url,
          at: payload?.at || new Date().toISOString(),
        });
      })
      .on("broadcast", { event: "claim:new" }, ({ payload }: any) => {
        const id = `c:${payload?.claimId}`;
        if (dedupe(id)) return;
        ding();
        qc.invalidateQueries({ queryKey: ["agent", "claims"] });
        toast(`⚠️ Nouveau sinistre — ${payload?.claimType || ""}`, {
          description: payload?.userName || "Client",
          action: { label: "Voir", onClick: () => navigate("/agent/sinistres") },
        });
        pushInboxEvent({
          id,
          kind: "claim",
          title: `Sinistre — ${payload?.claimType || ""}`.trim(),
          body: payload?.userName || "Client",
          url: "/agent/sinistres",
          at: payload?.at || new Date().toISOString(),
        });
      })
      .on("broadcast", { event: "kyc:new" }, ({ payload }: any) => {
        const id = `k:${payload?.kycId}`;
        if (dedupe(id)) return;
        ding();
        qc.invalidateQueries({ queryKey: ["agent", "kyc"] });
        toast(`🪪 Nouvelle demande KYC`, {
          description: `${payload?.userName || "Client"} · ${payload?.kycType || ""}`,
          action: { label: "Voir", onClick: () => navigate("/agent/kyc") },
        });
        pushInboxEvent({
          id,
          kind: "kyc",
          title: "Nouvelle demande KYC",
          body: `${payload?.userName || "Client"} · ${payload?.kycType || ""}`,
          url: "/agent/kyc",
          at: payload?.at || new Date().toISOString(),
        });
      })
      .subscribe();

    return () => { sb.removeChannel(ch); };
  }, [online, navigate, qc]);

  return null;
}
