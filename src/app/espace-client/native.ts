// Native device API helpers — share, geolocation, vibration, BarcodeDetector.

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/** Whether Web Share API is available. */
export function canShare(data?: ShareData): boolean {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  if (data?.files && navigator.canShare && !navigator.canShare(data)) return false;
  return true;
}

/** Share via the native sheet; falls back to clipboard for the URL. */
export async function share(data: ShareData): Promise<{ shared: boolean; reason?: string }> {
  if (canShare(data)) {
    try {
      await (navigator as any).share(data);
      return { shared: true };
    } catch (err: any) {
      if (err?.name === "AbortError") return { shared: false, reason: "abort" };
      return { shared: false, reason: err?.message ?? "error" };
    }
  }
  if (data.url && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url);
      return { shared: true, reason: "clipboard" };
    } catch {}
  }
  return { shared: false, reason: "unsupported" };
}

/** Light haptic feedback (Android Chrome only; no-op elsewhere). */
export function hapticTap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as any).vibrate(10); } catch {}
  }
}
export function hapticSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as any).vibrate([12, 50, 12]); } catch {}
  }
}
export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as any).vibrate([40, 60, 40, 60, 40]); } catch {}
  }
}

/** Promise-based geolocation. */
export function getCurrentPosition(opts?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 60_000,
      ...opts,
    });
  });
}

/** Haversine distance in km between two coords. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Open a place in the device's native maps app. */
export function openInMaps(lat: number, lng: number, label?: string): void {
  const q = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const url = isIOS ? `maps:${q}` : `geo:${lat},${lng}?q=${q}`;
  window.location.href = url;
}

/** BarcodeDetector availability. */
export function hasBarcodeDetector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}
