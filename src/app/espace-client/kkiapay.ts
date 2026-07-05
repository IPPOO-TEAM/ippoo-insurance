// Lightweight KkiaPay widget loader. The widget script exposes a global
// `openKkiapayWidget` function on window once loaded.
//
// In sandbox: include sandbox=true in the call. In prod: use the live key.
// The server marks payments confirmed via the /payments/webhook route; the
// client only needs to observe success/failure to refresh its cache.

declare global {
  interface Window {
    openKkiapayWidget?: (opts: any) => void;
    addSuccessListener?: (cb: (resp: any) => void) => void;
    addFailedListener?: (cb: (resp: any) => void) => void;
    removeSuccessListener?: (cb: (resp: any) => void) => void;
    removeFailedListener?: (cb: (resp: any) => void) => void;
  }
}

const SCRIPT_URL = "https://cdn.kkiapay.me/k.js";
let loading: Promise<void> | null = null;

export function loadKkiapay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.openKkiapayWidget) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Impossible de charger KkiaPay"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export interface KkiapayParams {
  amount: number;
  publicKey: string;
  sandbox: boolean;
  phone?: string;
  email?: string;
  name?: string;
  paymentId: string;
  userId: string;
}

export async function openKkiapay(params: KkiapayParams): Promise<{ ok: true; transactionId: string } | { ok: false; reason: string }> {
  await loadKkiapay();
  return new Promise((resolve) => {
    if (!window.openKkiapayWidget) {
      resolve({ ok: false, reason: "Widget indisponible" });
      return;
    }
    const onSuccess = (resp: any) => {
      window.removeSuccessListener?.(onSuccess);
      window.removeFailedListener?.(onFailed);
      resolve({ ok: true, transactionId: resp?.transactionId ?? "" });
    };
    const onFailed = (resp: any) => {
      window.removeSuccessListener?.(onSuccess);
      window.removeFailedListener?.(onFailed);
      resolve({ ok: false, reason: resp?.message ?? "Paiement échoué" });
    };
    window.addSuccessListener?.(onSuccess);
    window.addFailedListener?.(onFailed);
    window.openKkiapayWidget({
      amount: params.amount,
      key: params.publicKey,
      sandbox: params.sandbox,
      phone: params.phone,
      email: params.email,
      name: params.name,
      position: "center",
      theme: "#FF3B57",
      data: JSON.stringify({ paymentId: params.paymentId, userId: params.userId }),
    });
  });
}
