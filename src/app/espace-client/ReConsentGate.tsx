import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";
import { CONSENT_VERSION, CONSENT_TYPES, CONSENT_LABELS, type ConsentType } from "../lib/consents";
import { Link } from "react-router";

// #14 — Modal de re-consentement. Au montage, vérifie que l'utilisateur a
// au moins une entrée `granted: true` pour chaque type avec
// `version === CONSENT_VERSION`. Sinon, affiche un modal bloquant tant que
// l'utilisateur n'a pas re-coché et envoyé. Le modal s'affiche au-dessus de
// tout le reste sans bloquer le RouterProvider (les routes restent navigables
// mais l'overlay couvre l'écran). Vérifie une seule fois par session.

type ConsentRow = { type: string; version: string; granted: boolean; at: string };

const STORAGE_KEY = `ippoo:reconsent:checked:${CONSENT_VERSION}`;

export function ReConsentGate() {
  const { session } = useAuth();
  const [needs, setNeeds] = useState<ConsentType[] | null>(null);
  const [checks, setChecks] = useState<Record<ConsentType, boolean>>({
    cgu: false, confidentialite: false, traitement: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    try { if (sessionStorage.getItem(STORAGE_KEY) === "1") return; } catch { /* noop */ }
    let cancelled = false;
    api.consents(token).then((r) => {
      if (cancelled) return;
      const rows = (r.consents ?? []) as ConsentRow[];
      const missing: ConsentType[] = [];
      for (const t of CONSENT_TYPES) {
        const ok = rows.some((c) => c.type === t && c.version === CONSENT_VERSION && c.granted);
        if (!ok) missing.push(t);
      }
      if (missing.length === 0) {
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
      } else {
        setNeeds(missing);
      }
    }).catch(() => { /* non bloquant */ });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  if (!needs || needs.length === 0) return null;

  const allChecked = needs.every((t) => checks[t]);

  async function submit() {
    const token = session?.access_token;
    if (!token || !allChecked) return;
    setSubmitting(true);
    try {
      await api.recordConsents(token, needs.map((t) => ({ type: t, version: CONSENT_VERSION, granted: true })));
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
      setNeeds(null);
    } catch (err) {
      console.error("recordConsents failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,15,20,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 8 }}>Mise à jour de nos conditions</h2>
        <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: 16 }}>
          Nous avons mis à jour nos textes (version <b>{CONSENT_VERSION}</b>). Merci de confirmer votre accord pour continuer à utiliser votre espace IPPOO.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {needs.map((t) => (
            <label key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.88rem" }}>
              <input
                type="checkbox"
                checked={checks[t]}
                onChange={() => setChecks((p) => ({ ...p, [t]: !p[t] }))}
                style={{ marginTop: 3 }}
              />
              <span>
                J'accepte les <b>{CONSENT_LABELS[t]}</b>{" "}
                {t === "cgu" && <Link to="/conditions-generales" target="_blank" style={{ color: "#FF3B57" }}>(lire)</Link>}
                {t === "confidentialite" && <Link to="/confidentialite" target="_blank" style={{ color: "#FF3B57" }}>(lire)</Link>}
              </span>
            </label>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!allChecked || submitting}
          style={{
            marginTop: 18, width: "100%", padding: "12px 16px",
            borderRadius: 12, background: allChecked ? "#FF3B57" : "#ccc",
            color: "#fff", fontWeight: 800, border: "none",
            cursor: allChecked ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Enregistrement…" : "Confirmer mon accord"}
        </button>
      </div>
    </div>
  );
}
