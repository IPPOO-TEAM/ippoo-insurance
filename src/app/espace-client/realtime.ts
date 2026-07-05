// =====================================================================
// Lecture Realtime côté client (Option A).
//
// Les écritures passent TOUJOURS par le serveur (Edge Function,
// service_role). Ce helper permet au client de s'abonner en lecture aux
// tables temps réel protégées par RLS (auth.uid() = user_id) — par ex.
// notifications, messages, claims, contracts, payments.
//
// Prérequis : la table doit être dans la publication `supabase_realtime`
// et avoir une policy SELECT pour `authenticated` (voir migration 0001).
// =====================================================================
import { getSupabase } from "./supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChangeHandler = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, any> | null;
  old: Record<string, any> | null;
}) => void;

/**
 * S'abonne aux changements d'une table filtrés sur l'utilisateur courant.
 * Retourne une fonction de désabonnement (à appeler dans le cleanup d'effet).
 *
 * @param table  Nom de la table (ex. "notifications")
 * @param userId UUID de l'utilisateur (auth.uid()) pour filtrer côté serveur
 * @param onChange Callback à chaque INSERT/UPDATE/DELETE
 */
export function subscribeUserTable(
  table: string,
  userId: string,
  onChange: ChangeHandler,
): () => void {
  if (!userId) return () => {};
  const supabase = getSupabase();
  const channel: RealtimeChannel = supabase
    .channel(`rt:${table}:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      (payload: any) => {
        onChange({
          eventType: payload.eventType,
          new: payload.new ?? null,
          old: payload.old ?? null,
        });
      },
    )
    .subscribe();

  return () => {
    try { supabase.removeChannel(channel); } catch { /* ignore */ }
  };
}

/**
 * S'abonne à une table de configuration publique (pricing, promos,
 * partners, site_config) — pas de filtre utilisateur.
 */
export function subscribePublicTable(table: string, onChange: ChangeHandler): () => void {
  const supabase = getSupabase();
  const channel: RealtimeChannel = supabase
    .channel(`rt:public:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload: any) => {
        onChange({
          eventType: payload.eventType,
          new: payload.new ?? null,
          old: payload.old ?? null,
        });
      },
    )
    .subscribe();

  return () => {
    try { supabase.removeChannel(channel); } catch { /* ignore */ }
  };
}
