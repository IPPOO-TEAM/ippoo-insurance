import { useCallback, useEffect, useState } from "react";

// URL query-string persisted state. Reads from `?key=…` on mount, writes back
// without scrolling, and stays in sync if the user navigates back/forward.
// Keys are namespaced by an optional `scope` prefix so multiple admin tabs
// can coexist without colliding.
export function useUrlState<T extends string>(
  key: string,
  initial: T,
  opts: { scope?: string; allowed?: readonly T[] } = {},
): [T, (next: T) => void] {
  const fullKey = opts.scope ? `${opts.scope}.${key}` : key;
  const read = useCallback((): T => {
    if (typeof window === "undefined") return initial;
    const v = new URLSearchParams(window.location.search).get(fullKey);
    if (v == null) return initial;
    if (opts.allowed && !opts.allowed.includes(v as T)) return initial;
    return v as T;
  }, [fullKey, initial, opts.allowed]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const onPop = () => setValue(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [read]);

  const update = useCallback((next: T) => {
    setValue(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === initial || next === "" || next == null) url.searchParams.delete(fullKey);
    else url.searchParams.set(fullKey, String(next));
    window.history.replaceState(null, "", url.toString());
  }, [fullKey, initial]);

  return [value, update];
}
