import { useEffect, useRef, useState } from "react";
import { X, QrCode, Camera, Loader2, AlertTriangle } from "lucide-react";
import { getSupabase } from "../supabaseClient";
import { api } from "../api";

export function QrLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const supportsDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    if (!supportsDetector) {
      setError("La détection QR native n'est pas disponible. Collez le token ci-dessous.");
      return;
    }
    setError(null);
    setStatus("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // @ts-ignore - BarcodeDetector is not in standard lib types
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || streamRef.current === null) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const raw = codes[0].rawValue as string;
            stopCamera();
            await handleToken(raw);
            return;
          }
        } catch {}
        if (streamRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (err) {
      stopCamera();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Impossible d'accéder à la caméra");
    }
  }

  async function handleToken(raw: string) {
    setStatus("verifying");
    setError(null);
    try {
      const { email, tokenHash } = await api.qrLogin(raw.trim());
      const supabase = getSupabase();
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email, token_hash: tokenHash, type: "magiclink" as any,
      });
      if (otpErr) throw new Error(otpErr.message);
      onSuccess();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "QR invalide");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#FF3B57]" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900 }}>Connexion par QR</h2>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-1.5 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "verifying" ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF3B57]" />
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Vérification du QR membre…</p>
          </div>
        ) : (
          <>
            <p className="text-[#666] mb-4" style={{ fontSize: "0.85rem" }}>
              Affichez votre QR membre (onglet Profil) et scannez-le, ou collez le token ci-dessous.
            </p>

            <div className="aspect-square w-full bg-black/90 rounded-2xl overflow-hidden mb-3 relative">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: status === "scanning" ? "block" : "none" }}
              />
              {status !== "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Camera className="w-10 h-10" />
                </div>
              )}
            </div>

            {status !== "scanning" ? (
              <button
                onClick={startCamera}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white mb-3"
                style={{ background: "#FF3B57", fontWeight: 800, fontSize: "0.9rem" }}
              >
                <Camera className="w-4 h-4" /> Démarrer la caméra
              </button>
            ) : (
              <button
                onClick={() => { stopCamera(); setStatus("idle"); }}
                className="w-full px-5 py-3 rounded-xl border-2 border-black/10 mb-3"
                style={{ fontWeight: 700, fontSize: "0.9rem" }}
              >
                Arrêter la caméra
              </button>
            )}

            <details className="mb-2">
              <summary className="cursor-pointer text-[#666]" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                Saisir le token QR manuellement
              </summary>
              <div className="mt-3 flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="Token signé…"
                  className="flex-1 px-3 py-2.5 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]"
                  style={{ fontSize: "0.8rem", fontFamily: "ui-monospace, monospace" }}
                />
                <button
                  onClick={() => manual.trim() && handleToken(manual.trim())}
                  className="px-4 py-2.5 rounded-xl text-white"
                  style={{ background: "#FF3B57", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  Valider
                </button>
              </div>
            </details>

            {error && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2" style={{ fontSize: "0.82rem" }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
