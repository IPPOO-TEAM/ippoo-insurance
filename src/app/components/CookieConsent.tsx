import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router";

const STORAGE_KEY = "ippoo:cookie-consent:v1";

export type ConsentChoice = "all" | "essential" | null;

export function getCookieConsent(): ConsentChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChoice(getCookieConsent());
  }, []);

  function record(value: Exclude<ConsentChoice, null>) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* quota */ }
    setChoice(value);
    window.dispatchEvent(new CustomEvent("ippoo:consent", { detail: value }));
  }

  if (!mounted || choice) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-[80] p-3 sm:p-4 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-2xl shadow-2xl border border-black/10 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FFE8D6] flex items-center justify-center shrink-0">
            <Cookie className="w-4.5 h-4.5" style={{ color: "#FF7A00" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "0.92rem", fontWeight: 800 }}>Vos données, votre choix</p>
            <p className="text-[#444] mt-1" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
              Nous utilisons des cookies <strong>essentiels</strong> au fonctionnement du site (session, sécurité) et, avec votre accord, des cookies de mesure d'audience pour améliorer l'expérience.{" "}
              <Link to="/confidentialite" className="underline text-[#FF3B57] hover:no-underline">En savoir plus</Link>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => record("all")}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#FF3B57] text-white hover:bg-[#e02f49]"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}
              >
                Tout accepter
              </button>
              <button
                onClick={() => record("essential")}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#0E1320] text-white hover:bg-black"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}
              >
                Tout refuser
              </button>
              <button
                onClick={() => record("essential")}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-black/15 hover:border-black/40"
                style={{ fontSize: "0.82rem", fontWeight: 700 }}
              >
                Essentiels uniquement
              </button>
              <Link
                to="/confidentialite"
                className="ml-auto inline-flex items-center px-2 py-2 rounded-xl text-[#666] hover:text-[#0E1320]"
                style={{ fontSize: "0.78rem", fontWeight: 700 }}
              >
                Personnaliser
              </Link>
            </div>
          </div>
          <button
            onClick={() => record("essential")}
            aria-label="Fermer (essentiels uniquement)"
            className="p-1 rounded-md hover:bg-black/5 shrink-0"
          >
            <X className="w-4 h-4 text-[#666]" />
          </button>
        </div>
      </div>
    </div>
  );
}
