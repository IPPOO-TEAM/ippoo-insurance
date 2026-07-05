// #9 — Reporter d'erreur frontend.
// Capture window.onerror, unhandledrejection et les crashes ErrorBoundary,
// envoie POST /client-error (best-effort, jamais bloquant). Throttle local
// pour ne pas spammer si une exception se répète en boucle.
import { apiFetch } from "./supabaseClient";

const RELEASE = "2026-05-30";
const seen = new Map<string, number>();
const MAX_PER_MIN = 5;
let installed = false;

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = seen.get(key) ?? 0;
  if (now - last < 60_000 / MAX_PER_MIN) return false;
  seen.set(key, now);
  if (seen.size > 50) {
    const cutoff = now - 5 * 60_000;
    for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
  }
  return true;
}

export function reportError(err: unknown, context: Record<string, unknown> = {}): void {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? "") : "";
    const key = `${message}|${stack.slice(0, 100)}`;
    if (!shouldReport(key)) return;
    const userId = (() => {
      try { return localStorage.getItem("ippoo:lastUserId") ?? null; } catch { return null; }
    })();
    apiFetch("/client-error", {
      method: "POST",
      body: {
        message,
        stack,
        url: typeof location !== "undefined" ? location.href : "",
        release: RELEASE,
        userId,
        context,
      },
    }).catch(() => { /* on n'a pas le droit de re-throw ici */ });
  } catch { /* noop */ }
}

export function setupErrorReporter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => {
    reportError(ev.error ?? ev.message, { kind: "window.error", filename: ev.filename, lineno: ev.lineno });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    reportError(ev.reason, { kind: "unhandledrejection" });
  });
}
