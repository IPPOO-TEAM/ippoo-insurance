import { useEffect, useState } from "react";
import { Fingerprint, Trash2, Check, Loader2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export function BiometricSection() {
  const { session } = useAuth();
  const [devices, setDevices] = useState<{ id: string; createdAt: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const supported = typeof window !== "undefined"
    && typeof window.PublicKeyCredential !== "undefined";

  async function load() {
    if (!session?.access_token) return;
    try {
      const s = await api.webauthnStatus(session.access_token);
      setDevices(s.devices);
    } catch (err) {
      console.error("webauthn status failed:", err);
    }
  }
  useEffect(() => { load(); }, [session?.access_token]);

  async function enroll() {
    if (!session?.access_token) return;
    setBusy(true);
    setMsg(null);
    try {
      const options = await api.webauthnRegisterOptions(session.access_token);
      const response = await startRegistration({ optionsJSON: options });
      await api.webauthnRegisterVerify(session.access_token, response);
      setMsg({ type: "ok", text: "Empreinte biométrique enregistrée." });
      await load();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Erreur";
      setMsg({ type: "err", text: detail });
    } finally {
      setBusy(false);
    }
  }

  async function remove(credId: string) {
    if (!session?.access_token) return;
    try {
      await api.webauthnRemove(session.access_token, credId);
      await load();
    } catch (err) {
      console.error("webauthn remove failed:", err);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#EBF7FF] flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-[#2A6BFF]" />
        </div>
        <div className="flex-1">
          <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Connexion biométrique</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Empreinte digitale ou reconnaissance faciale via passkey.
          </p>
        </div>
      </div>

      {!supported && (
        <p className="text-[#666]" style={{ fontSize: "0.85rem" }}>
          Votre appareil ne prend pas en charge l'authentification biométrique.
        </p>
      )}

      {supported && (
        <>
          {devices.length > 0 ? (
            <ul className="divide-y divide-black/5 mb-4">
              {devices.map((d) => (
                <li key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Empreinte enregistrée</p>
                    <p className="text-[#666]" style={{ fontSize: "0.72rem" }}>
                      Depuis le {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(d.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    style={{ fontSize: "0.78rem", fontWeight: 700 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#666] mb-4" style={{ fontSize: "0.85rem" }}>
              Aucune empreinte enregistrée. Activez la connexion biométrique pour vous authentifier sans mot de passe.
            </p>
          )}

          <button
            onClick={enroll}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
            style={{ background: "#FF3B57", fontWeight: 800, fontSize: "0.85rem" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            {busy ? "Enregistrement..." : "Ajouter une empreinte"}
          </button>

          {msg && (
            <div
              className={`mt-3 px-4 py-2.5 rounded-xl inline-flex items-center gap-2 ${
                msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700 border border-red-200"
              }`}
              style={{ fontSize: "0.82rem" }}
            >
              {msg.type === "ok" && <Check className="w-4 h-4" />}
              {msg.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}
