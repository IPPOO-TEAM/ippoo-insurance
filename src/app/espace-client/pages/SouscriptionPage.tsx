import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Info, Clock } from "lucide-react";
import { useAuth } from "../AuthContext";
import { formatXOF } from "../hooks";
import { api } from "../api";
import { toast } from "sonner";
import { type CatalogProduct, type Category } from "../../data/productCatalog";
import { usePricing } from "../../data/pricing";
import { BENEFIT_QUALIFYING_MONTHS } from "../../lib/eligibility";
import { ProductDetailsModal } from "../components/ProductDetailsModal";

const CATEGORIES: { value: "tous" | Category; label: string }[] = [
  { value: "tous", label: "Toutes" },
  { value: "assurance", label: "Assurances" },
  { value: "assistance", label: "Assistance" },
];

export function SouscriptionPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [cat, setCat] = useState<"tous" | Category>("tous");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const { catalog } = usePricing();
  const detailsProduct = useMemo(() => catalog.find((p) => p.id === detailsId) ?? null, [catalog, detailsId]);
  const visible = useMemo(() => (cat === "tous" ? catalog : catalog.filter((p) => p.category === cat)), [catalog, cat]);

  async function subscribe(p: CatalogProduct) {
    if (!session?.access_token) return;
    setBusy(p.id);
    try {
      await api.subscribe(session.access_token, { product: p.name, premium: p.premium, frequency: p.frequency });
      setDone(p.name);
      toast.success(`${p.name} activé`, {
        description: `${formatXOF(p.premium)} / ${p.frequency}`,
        action: { label: "Voir le contrat", onClick: () => navigate("/espace-client/contrats") },
      });
      setTimeout(() => navigate("/espace-client/contrats"), 1200);
    } catch (err) {
      console.error("Subscribe failed:", err);
      toast.error("Souscription impossible", { description: err instanceof Error ? err.message : "" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-5">
        <h1 className="t-title1">Souscrire à une offre</h1>
      </header>

      <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: "#FFF7E6", border: "1px solid #FFE2B3" }}>
        <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#B85400" }} />
        <p style={{ fontSize: "0.82rem", color: "#5C3A00", lineHeight: 1.5 }}>
          <strong>Période de stage de {BENEFIT_QUALIFYING_MONTHS} mois.</strong> Après votre souscription, une cotisation régulière pendant un semestre est requise avant de pouvoir bénéficier de votre mutuelle (prise en charge des sinistres).
        </p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCat(c.value)}
            className="px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors"
            style={{
              background: cat === c.value ? "#0E1320" : "white",
              color: cat === c.value ? "white" : "#333",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {done && (
        <div className="mb-5 px-5 py-4 rounded-2xl bg-[#DBFBE7] border border-[#16B26A]/30 text-[#0F7A47] flex items-center gap-2" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
          <Check className="w-5 h-5" /> {done} activé. Redirection vers vos contrats...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
              <div className="relative h-36 w-full overflow-hidden -mb-px">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-center bg-cover"
                  style={{ backgroundImage: "url(" + p.image + ")" }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.55) 70%, #ffffff 100%)" }}
                />
                <div className="absolute inset-0 p-4 flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: p.soft }}>
                    <Icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full uppercase bg-white/85 backdrop-blur-sm"
                    style={{ color: "#666", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em" }}
                  >
                    {p.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
              <h3 style={{ fontSize: "1.05rem", fontWeight: 900, lineHeight: 1.2 }}>{p.name}</h3>
              <p className="text-[#666] mt-1 mb-4" style={{ fontSize: "0.85rem" }}>{p.desc}</p>
              <div className="mb-4">
                <span style={{ fontSize: "1.5rem", fontWeight: 900, color: p.color }}>{formatXOF(p.premium)}</span>
                <span className="text-[#666]" style={{ fontSize: "0.8rem" }}> / {p.frequency}</span>
              </div>
              <ul className="space-y-1.5 mb-5">
                {p.perks.map((k) => (
                  <li key={k} className="flex items-center gap-2 text-[#333]" style={{ fontSize: "0.85rem" }}>
                    <Check className="w-4 h-4" style={{ color: p.color }} /> {k}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => setDetailsId(p.id)}
                  className="w-full px-5 py-2.5 rounded-xl border border-black/10 bg-white text-[#0E1320] hover:bg-[#F5F6FA] inline-flex items-center justify-center gap-2"
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  <Info className="w-4 h-4" /> Voir les détails
                </button>
                <button
                  onClick={() => subscribe(p)}
                  disabled={busy === p.id}
                  className="w-full px-5 py-3 rounded-xl text-white disabled:opacity-60"
                  style={{ background: p.color, fontSize: "0.9rem", fontWeight: 800 }}
                >
                  {busy === p.id ? "Activation..." : "Souscrire"}
                </button>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {detailsProduct && (
        <ProductDetailsModal
          product={detailsProduct}
          onClose={() => setDetailsId(null)}
          onSubscribe={() => { const p = detailsProduct; setDetailsId(null); subscribe(p); }}
          busy={busy === detailsProduct.id}
        />
      )}
    </div>
  );
}
