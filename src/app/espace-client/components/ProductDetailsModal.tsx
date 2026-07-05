import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Clock, Sparkles, User, Shield, Download } from "lucide-react";
import { usePricing } from "../../data/pricing";
import type { CatalogProduct } from "../../data/productCatalog";
import { formatXOF } from "../hooks";
import { downloadProductDetails } from "../productDetailsPdf";
import { toast } from "sonner";

export function ProductDetailsModal({
  product,
  onClose,
  onSubscribe,
  busy = false,
  ctaLabel,
}: {
  product: CatalogProduct;
  onClose: () => void;
  onSubscribe?: () => void;
  busy?: boolean;
  ctaLabel?: string;
}) {
  const { details } = usePricing();
  const data = details[product.id];
  useEffect(() => {
    if (!data) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [data]);
  if (!data) return null;
  if (typeof document === "undefined") return null;
  const Icon = product.icon;

  const node = (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(14,19,32,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-black/5 flex items-start gap-3 sticky top-0 bg-white z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: product.soft }}>
            <Icon className="w-6 h-6" style={{ color: product.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{product.name}</h2>
            <p className="text-[#666] mt-0.5" style={{ fontSize: "0.78rem" }}>
              {formatXOF(product.premium)} / {product.frequency}
            </p>
          </div>
          <button
            onClick={() => { downloadProductDetails(product); toast.success("Détails téléchargés"); }}
            className="h-9 px-3 rounded-full bg-[#F5F6FA] hover:bg-[#EAECF2] inline-flex items-center gap-1.5 text-[#0E1320]"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
            aria-label="Télécharger en PDF"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#F5F6FA] flex items-center justify-center text-[#666] hover:bg-[#EAECF2]" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          <Section icon={Shield} title="Garanties détaillées">
            <div className="rounded-2xl border border-black/5 overflow-hidden">
              {data.garanties.map((g, i) => (
                <div key={g.risque} className={`px-4 py-3 ${i > 0 ? "border-t border-black/5" : ""}`}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0E1320" }}>{g.risque}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Stat label="Prise en charge" value={g.priseEnCharge} accent={product.color} />
                    <Stat label="Plafond" value={g.plafond} />
                    <Stat label="Franchise" value={g.franchise} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Sparkles} title="Formules disponibles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.formules.map((f) => (
                <div
                  key={f.nom}
                  className="rounded-2xl p-3 border"
                  style={{
                    background: f.highlight ? product.soft : "#FAFBFD",
                    borderColor: f.highlight ? product.color : "rgba(0,0,0,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0E1320" }}>{f.nom}</p>
                    {f.highlight && (
                      <span className="px-2 py-0.5 rounded-full text-white" style={{ background: product.color, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em" }}>
                        POPULAIRE
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5" style={{ fontSize: "0.78rem", fontWeight: 700, color: product.color }}>{f.cotisation}</p>
                  <p className="text-[#555] mt-1" style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Clock} title="Délai de carence">
            <p className="rounded-2xl px-4 py-3 bg-[#F5F6FA] text-[#333]" style={{ fontSize: "0.85rem", lineHeight: 1.45 }}>
              {data.delaiCarence}
            </p>
          </Section>

          <Section icon={AlertTriangle} title="Ce qui n'est pas couvert">
            <ul className="rounded-2xl border border-black/5 overflow-hidden">
              {data.exclusions.map((e, i) => (
                <li key={e} className={`px-4 py-2.5 flex items-start gap-2 text-[#444] ${i > 0 ? "border-t border-black/5" : ""}`} style={{ fontSize: "0.83rem", lineHeight: 1.4 }}>
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#C0263A]" /> {e}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={User} title="Exemple concret">
            <div className="rounded-2xl p-4 border border-black/5" style={{ background: "linear-gradient(180deg, #FAFBFD 0%, #F5F6FA 100%)" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0E1320" }}>{data.exempleSinistre.profil}</p>
              <p className="text-[#555] mt-1.5" style={{ fontSize: "0.82rem", lineHeight: 1.45 }}>{data.exempleSinistre.histoire}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl p-2.5 bg-white border border-black/5">
                  <p className="text-[#888]" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Indemnisation</p>
                  <p className="mt-0.5" style={{ fontSize: "0.82rem", fontWeight: 700, color: product.color }}>{data.exempleSinistre.indemnisation}</p>
                </div>
                <div className="rounded-xl p-2.5 bg-white border border-black/5">
                  <p className="text-[#888]" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Délai</p>
                  <p className="mt-0.5" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0E1320" }}>{data.exempleSinistre.delai}</p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {onSubscribe && (
          <div className="px-5 sm:px-7 py-3 border-t border-black/5 bg-white">
            <button
              onClick={onSubscribe}
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl text-white disabled:opacity-60"
              style={{ background: product.color, fontSize: "0.9rem", fontWeight: 800 }}
            >
              {busy ? "Activation..." : (ctaLabel ?? `Souscrire à ${formatXOF(product.premium)} / ${product.frequency}`)}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: "0.78rem", fontWeight: 800, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl px-2.5 py-2 bg-[#F5F6FA]">
      <p className="text-[#888]" style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
      <p className="mt-0.5" style={{ fontSize: "0.78rem", fontWeight: 800, color: accent ?? "#0E1320", lineHeight: 1.2 }}>{value}</p>
    </div>
  );
}
