import { useEffect, useState } from "react";
import { Link } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Copy, Check, Loader2, AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { useApiData } from "../hooks";

export function MemberIdCard() {
  const { session } = useAuth();
  const profileQ = useApiData((t) => api.me(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const profile = profileQ.data?.profile as any;
  const contracts = (contractsQ.data?.contracts ?? []) as any[];
  const eligible = !!profile?.cardActive && contracts.some((c) => c.status === "active");
  const gateLoading = profileQ.loading || contractsQ.loading;

  const [data, setData] = useState<{ token: string; memberNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.access_token || !eligible) return;
    let cancelled = false;
    setError(null);
    api.qrToken(session.access_token)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur");
      });
    return () => { cancelled = true; };
  }, [session?.access_token, eligible]);

  async function copyNumber() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.memberNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (!eligible && !gateLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0F1F5] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#666]" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Carte membre verrouillée</p>
            <p className="text-[#555] mt-1" style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>
              Souscrivez à une assurance et activez votre carte (500 FCFA/mois) pour obtenir votre identifiant membre IPPOO.
            </p>
            <Link
              to="/espace-client/carte"
              className="mt-3 inline-flex items-center gap-1.5 text-[#FF3B57]"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              Activer ma carte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isGated = /403/.test(error) || /Carte membre non activée/i.test(error) || /Aucune souscription/i.test(error);
    if (isGated) {
      return (
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0F1F5] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#666]" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Carte membre verrouillée</p>
              <p className="text-[#555] mt-1" style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>
                Souscrivez à une assurance et activez votre carte (500 FCFA/mois) pour obtenir votre identifiant membre IPPOO.
              </p>
              <Link
                to="/espace-client/carte"
                className="mt-3 inline-flex items-center gap-1.5 text-[#FF3B57]"
                style={{ fontSize: "0.85rem", fontWeight: 700 }}
              >
                Activer ma carte <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl p-5 border border-red-200 flex items-center gap-3 text-red-700">
        <AlertTriangle className="w-5 h-5" />
        <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3B57] to-[#FF7A00] text-white flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Identifiant membre IPPOO</p>
          <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
            Unique et immuable. Scannez le QR pour vous connecter.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <div className="bg-white p-2 rounded-xl border border-black/10 shrink-0">
          {data ? (
            <QRCodeSVG value={data.token} size={168} level="M" bgColor="#ffffff" fgColor="#0E1320" />
          ) : (
            <div className="w-[168px] h-[168px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF3B57]" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full">
          <p className="text-[#666] mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.14em", fontWeight: 700 }}>
            N° MEMBRE
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 px-3 py-2.5 rounded-xl bg-[#F5F6FA]" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.14em", fontFamily: "ui-monospace, monospace" }}>
              {data?.memberNumber ?? " "}
            </code>
            <button
              onClick={copyNumber}
              disabled={!data}
              className="px-3 py-2.5 rounded-xl text-white inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: "#FF3B57", fontWeight: 700, fontSize: "0.82rem" }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="text-[#666]" style={{ fontSize: "0.78rem", lineHeight: 1.55 }}>
            Ce numéro vous est attribué à vie et ne peut être modifié. Le QR est signé cryptographiquement (HMAC-SHA256) il prouve votre identité lors d'une connexion par scan.
          </p>
        </div>
      </div>
    </div>
  );
}
