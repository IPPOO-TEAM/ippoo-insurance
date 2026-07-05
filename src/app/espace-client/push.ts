// Web Push subscription helpers.
//
// Requires VAPID public key — set VAPID_PUBLIC env on the server and expose
// via /push/vapid-public. The server stores the subscription per user and
// can dispatch push events (renewals, claim updates, messages).
import { api } from "./api";

function urlBase64ToUint8(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function pushSupported(): Promise<boolean> {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export async function pushStatus(): Promise<"unsupported" | "denied" | "granted" | "default"> {
  if (!(await pushSupported())) return "unsupported";
  return Notification.permission as any;
}

export async function isSubscribed(): Promise<boolean> {
  if (!(await pushSupported())) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(token: string): Promise<PushSubscription | null> {
  if (!(await pushSupported())) throw new Error("Notifications non supportées sur cet appareil");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permission refusée");
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await api.pushSync(token, existing.toJSON());
    return existing;
  }
  const { publicKey } = await api.pushVapid();
  if (!publicKey) throw new Error("Push non configuré côté serveur");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8(publicKey),
  });
  await api.pushSync(token, sub.toJSON());
  return sub;
}

export async function unsubscribeFromPush(token: string): Promise<void> {
  if (!(await pushSupported())) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
    await api.pushRemove(token, sub.endpoint);
  }
}
