import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { cacheConfig, qk } from "./queryClient";

type CacheKind = keyof typeof cacheConfig;

// Resources that change rarely → longer cache.
const LONG_LIVED = new Set([
  "me", "contracts", "beneficiaries", "documents", "settings", "billing", "referral",
]);

export function useAuthedQuery<T>(
  key: QueryKey,
  fn: (token: string) => Promise<T>,
  opts: { kind?: CacheKind; enabled?: boolean } = {},
) {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const cfg = cacheConfig[opts.kind ?? "live"];
  return useQuery<T>({
    queryKey: key,
    queryFn: () => fn(token!),
    enabled: !!token && (opts.enabled ?? true),
    staleTime: cfg.staleTime,
    gcTime: cfg.gcTime,
  });
}

/**
 * Backwards-compatible adapter: derives a stable cache key from the fetcher's
 * source by matching `api.<name>`. Vite preserves member-expression names
 * through minification, so this works in dev and in prod.
 *
 * For any new code, prefer `useAuthedQuery(qk.X, api.X)`.
 */
export function useApiData<T>(
  fetcher: (token: string) => Promise<T>,
  opts: { enabled?: boolean } = {},
) {
  const src = fetcher.toString();
  const key = useMemo<QueryKey>(() => {
    const m = src.match(/api\.(\w+)/);
    if (m) return (qk as Record<string, QueryKey>)[m[1]] ?? [m[1]];
    // FNV-1a hash so distinct fetchers never collide.
    let h = 2166136261;
    for (let i = 0; i < src.length; i++) {
      h ^= src.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ["legacy", h.toString(36)];
  }, [src]);
  const name = Array.isArray(key) ? String(key[0]) : "";
  const kind: CacheKind = LONG_LIVED.has(name) ? "longLived" : "live";
  const q = useAuthedQuery<T>(key, fetcher, { kind, enabled: opts.enabled });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error ? (q.error instanceof Error ? q.error.message : String(q.error)) : null,
    reload: async () => { await q.refetch(); },
  };
}

export function useAuthedMutation<TInput, TOutput>(
  fn: (token: string, input: TInput) => Promise<TOutput>,
  options: { invalidate?: QueryKey[]; onSuccess?: (out: TOutput) => void } = {},
) {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation<TOutput, Error, TInput>({
    mutationFn: (input) => fn(session!.access_token, input),
    onSuccess: (out) => {
      options.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      options.onSuccess?.(out);
    },
  });
}

export function formatXOF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
