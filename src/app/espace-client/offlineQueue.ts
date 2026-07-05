// Minimal offline-action queue.
// Stores serializable API requests in localStorage. Replays on `online` event
// and on a periodic tick. Callers opt-in via `apiOrQueue()` in supabaseClient.

import { API_BASE } from "./supabaseClient";
import { publicAnonKey } from "../../../utils/supabase/info";

export type QueuedAction = {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  token?: string | null;
  adminToken?: string | null;
  label: string;
  at: string;
  attempts: number;
};

const STORAGE_KEY = "ippoo:offline:queue:v1";
const MAX_ATTEMPTS = 5;
const TICK_MS = 30_000;

type Listener = (q: QueuedAction[]) => void;
const listeners = new Set<Listener>();
let tickHandle: number | null = null;
let replaying = false;

function read(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedAction[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore quota */ }
  for (const l of listeners) l(items);
}

export function getQueue(): QueuedAction[] {
  return read();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(read());
  return () => { listeners.delete(fn); };
}

export function enqueue(action: Omit<QueuedAction, "id" | "at" | "attempts">): QueuedAction {
  const item: QueuedAction = {
    ...action,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    attempts: 0,
  };
  const next = [...read(), item];
  write(next);
  return item;
}

async function executeOne(item: QueuedAction): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (item.token) headers["X-User-Token"] = item.token;
  if (item.adminToken) headers["X-Admin-Token"] = item.adminToken;
  const res = await fetch(`${API_BASE}${item.path}`, {
    method: item.method,
    headers,
    body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
    mode: "cors",
    credentials: "omit",
  });
  if (!res.ok && res.status >= 500) {
    // Server hiccup — keep in queue to retry.
    throw new Error(`HTTP ${res.status}`);
  }
  // 4xx: action will never succeed (auth, validation). Drop silently.
}

export async function replay(): Promise<{ done: number; failed: number; remaining: number }> {
  if (replaying) return { done: 0, failed: 0, remaining: read().length };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { done: 0, failed: 0, remaining: read().length };
  replaying = true;
  let done = 0, failed = 0;
  try {
    const items = read();
    const keep: QueuedAction[] = [];
    for (const item of items) {
      try {
        await executeOne(item);
        done++;
      } catch {
        const next = { ...item, attempts: item.attempts + 1 };
        if (next.attempts < MAX_ATTEMPTS) keep.push(next);
        else failed++;
      }
    }
    write(keep);
    return { done, failed, remaining: keep.length };
  } finally {
    replaying = false;
  }
}

export function startOfflineQueueLoop() {
  if (typeof window === "undefined") return;
  if (tickHandle != null) return;
  const trigger = () => { void replay(); };
  window.addEventListener("online", trigger);
  tickHandle = window.setInterval(trigger, TICK_MS);
  void replay();
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
