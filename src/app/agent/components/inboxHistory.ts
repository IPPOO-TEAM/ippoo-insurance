// In-memory inbox history (10 derniers événements arrivés sur agent:inbox).
// Module-level pour qu'AgentInboxNotifier (qui écrit) et AgentInboxHistoryBell
// (qui lit) partagent le même store sans Context.

export type InboxEvent = {
  id: string;
  kind: "message" | "claim" | "kyc";
  title: string;
  body: string;
  url: string;
  at: string;
};

const MAX = 10;
let items: InboxEvent[] = [];
const subscribers = new Set<() => void>();

export function pushInboxEvent(ev: InboxEvent) {
  if (items.some((x) => x.id === ev.id)) return;
  items = [ev, ...items].slice(0, MAX);
  subscribers.forEach((cb) => { try { cb(); } catch { /* noop */ } });
}

export function getInboxHistory(): InboxEvent[] {
  return items;
}

export function subscribeInboxHistory(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function clearInboxHistory() {
  items = [];
  subscribers.forEach((cb) => { try { cb(); } catch { /* noop */ } });
}
