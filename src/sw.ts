/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(new NetworkFirst({ cacheName: "ippoo-nav", networkTimeoutSeconds: 5 }), {
    denylist: [/^\/api\//, /^\/functions\//],
  }),
);

// Edge function calls (auth, admin, mutations, signed downloads) must always
// hit the network — caching them produced "Failed to fetch" on cold starts
// when the 5s NetworkFirst timeout fired before the cache could answer for
// non-GET / authenticated requests. The browser HTTP cache + React Query
// in-memory cache are sufficient for this layer.

// Exception: read-only contract/payment endpoints are cached with NetworkFirst
// so an offline user can still consult their last-known contracts (and download
// the attestation PDF, which is generated client-side from the cached payload).
registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    /\/functions\/v1\/make-server-752d1a39\/(contracts|payments|profile|notifications)(\/|\?|$)/.test(
      url.pathname,
    ),
  new NetworkFirst({
    cacheName: "ippoo-offline-readonly",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      {
        // Bind the cache entry to the bearer token so two users sharing a
        // device can't see each other's contracts/payments from the cache.
        cacheKeyWillBeUsed: async ({ request }) => {
          const auth = request.headers.get("Authorization") || "";
          const tail = auth.slice(-16);
          const u = new URL(request.url);
          u.searchParams.set("__u", tail);
          return u.toString();
        },
      },
    ],
  }),
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "IPPOO_CLEAR_OFFLINE_CACHE") {
    event.waitUntil(caches.delete("ippoo-offline-readonly"));
  }
});

registerRoute(
  ({ url }) => url.pathname.includes("/rest/v1/") || url.pathname.includes("/storage/v1/"),
  new NetworkFirst({
    cacheName: "ippoo-supabase",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "ippoo-img",
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "ippoo-fonts",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

self.addEventListener("push", (event: PushEvent) => {
  let data: PushPayload = {};
  try {
    data = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    try { data = { body: event.data?.text() ?? "" }; } catch { /* noop */ }
  }
  const title = data.title || "IPPOO";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url || "/espace-client" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string) || "/espace-client";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        const url = new URL(client.url);
        if (url.pathname.startsWith(targetUrl.split("?")[0])) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
