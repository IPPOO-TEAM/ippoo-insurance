import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// INSTANCE UNIQUE : Supabase auto-hébergée IPPOO ASSURANCE
// Toute la data passe par https://insurancedatabase.ippoo-aptdc.com
// Aucune autre instance Supabase n'est utilisée.
// ============================================================
export const SUPABASE_URL = "https://insurancedatabase.ippoo-aptdc.com";
export const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MjM5MDg0MCwiZXhwIjo0OTM4MDY0NDQwLCJyb2xlIjoiYW5vbiJ9.t3t_OR7_WbH2wBNc5eh1UQ7LO17hrggQCzz3HsQ7B2g";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

export const API_BASE = `${SUPABASE_URL}/functions/v1/make-server-752d1a39`;

/** Try the call online; if offline or the request fails on network, push the
 * mutation to the local queue and resolve with the supplied optimistic value.
 * Use only for fire-and-forget mutations that are safe to retry later. */
export async function apiOrQueue<T>(
  path: string,
  opts: { method: "POST" | "PATCH" | "DELETE" | "PUT"; body?: unknown; token?: string | null; adminToken?: string | null; label: string; optimistic: T },
): Promise<{ data: T; queued: boolean }> {
  const { enqueue, isOnline } = await import("./offlineQueue");
  const queue = () => {
    enqueue({ method: opts.method, path, body: opts.body, token: opts.token, adminToken: opts.adminToken, label: opts.label });
    return { data: opts.optimistic, queued: true };
  };
  if (!isOnline()) return queue();
  try {
    const data = await apiFetch<T>(path, { method: opts.method, body: opts.body, token: opts.token, adminToken: opts.adminToken, silent: true });
    return { data, queued: false };
  } catch (err) {
    if (err instanceof Error && /Réseau KO/i.test(err.message)) return queue();
    throw err;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null; adminToken?: string | null; silent?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, token, adminToken, silent } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
  if (token) headers["X-User-Token"] = token;
  if (adminToken) headers["X-Admin-Token"] = adminToken;
  // Inject the agent 2FA challenge token automatically for all /agent/* calls
  // when the conseiller has completed the TOTP challenge in this tab.
  if (token && path.startsWith("/agent/")) {
    try {
      const t = sessionStorage.getItem("ippoo:agent:2fa:token:v1");
      if (t) headers["X-Agent-2FA-Token"] = t;
    } catch { /* private mode — ignore */ }
  }
  const url = `${API_BASE}${path}`;
  console.debug(`[apiFetch v2] ${method} ${url}`);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      mode: "cors",
      credentials: "omit",
    });
  } catch (networkErr) {
    const detail = networkErr instanceof Error ? networkErr.message : String(networkErr);
    const log = silent ? console.debug : console.warn;
    log(`[apiFetch v2] Network failure ${method} ${url}: ${detail}`);
    throw new Error(`[v2] Réseau KO sur ${method} ${path}: ${detail}`);
  }
  let text = "";
  try {
    text = await res.text();
  } catch (readErr) {
    const detail = readErr instanceof Error ? readErr.message : String(readErr);
    console.error(`Failed reading response body for ${method} ${API_BASE}${path}: ${detail}`);
    throw new Error(`Réponse illisible du serveur (${method} ${path}): ${detail}`);
  }
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const message = (data && data.error) || `HTTP ${res.status}`;
    if (res.status === 401 && token && /auth session missing|invalid-token|expired|missing-token/i.test(message)) {
      try { await getSupabase().auth.signOut(); } catch { /* ignore */ }
    } else if (!silent) {
      console.error(`API ${method} ${path} failed (${res.status}): ${message}`, data);
    }
    const err: Error & { status?: number; details?: unknown } = new Error(message);
    err.status = res.status;
    if (data && Array.isArray(data.errors)) err.details = data.errors;
    throw err;
  }
  return data as T;
}
