import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Calculator, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

type Frequency = "mensuel" | "trimestriel" | "annuel";
type Family = "solo" | "couple" | "famille";

const COVERAGE_MIN = 100_000;
const COVERAGE_MAX = 5_000_000;
const COVERAGE_STEP = 100_000;

const FREQ_FACTOR: Record<Frequency, number> = { mensuel: 1 / 12, trimestriel: 1 / 4, annuel: 1 };
const FREQ_LABEL: Record<Frequency, string> = { mensuel: "/ mois", trimestriel: "/ trimestre", annuel: "/ an" };
const FAMILY_FACTOR: Record<Family, number> = { solo: 1, couple: 1.7, famille: 2.3 };
const FAMILY_LABEL: Record<Family, string> = { solo: "Moi seul·e", couple: "En couple", famille: "Famille (≤ 5)" };

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
}

export function HomeSimulator() {
  const [age, setAge] = useState(32);
  const [coverage, setCoverage] = useState(1_000_000);
  const [family, setFamily] = useState<Family>("solo");
  const [frequency, setFrequency] = useState<Frequency>("mensuel");

  const result = useMemo(() => {
    // Tarif unique IPPOO : 500 FCFA par jour sur 31 jours, quelle que soit la formule.
    const monthly = 500 * 31;
    const annual = monthly * 12;
    const periodic = frequency === "mensuel" ? monthly : frequency === "trimestriel" ? monthly * 3 : annual;
    return { annual, periodic };
  }, [age, coverage, family, frequency]);

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE2E7] text-[#C0263A] mb-4" style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em" }}>
            <Sparkles className="w-3.5 h-3.5" /> SIMULATEUR EXPRESS
          </div>
          <h2 style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Combien coûte ma protection ?
          </h2>
          <p className="mt-3 text-[#666] max-w-2xl mx-auto" style={{ fontSize: "1rem", lineHeight: 1.55 }}>
            Estimez en quelques secondes votre cotisation IPPOO. Indicatif, ajusté avec un conseiller.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8 space-y-6">
            <Row label="Votre âge" value={`${age} ans`}>
              <input type="range" min={18} max={75} value={age} onChange={(e) => setAge(+e.target.value)} className="ippoo-range w-full" />
            </Row>
            <Row label="Capital assuré" value={formatXOF(coverage)}>
              <input type="range" min={COVERAGE_MIN} max={COVERAGE_MAX} step={COVERAGE_STEP} value={coverage} onChange={(e) => setCoverage(+e.target.value)} className="ippoo-range w-full" />
            </Row>
            <Row label="Composition">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FAMILY_LABEL) as Family[]).map((f) => (
                  <SegBtn key={f} active={family === f} onClick={() => setFamily(f)}>{FAMILY_LABEL[f]}</SegBtn>
                ))}
              </div>
            </Row>
            <Row label="Fréquence de paiement">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FREQ_LABEL) as Frequency[]).map((f) => (
                  <SegBtn key={f} active={frequency === f} onClick={() => setFrequency(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</SegBtn>
                ))}
              </div>
            </Row>
          </div>

          <div className="lg:col-span-2 rounded-3xl p-8 text-white flex flex-col justify-between" style={{ background: "linear-gradient(150deg,#0E1320 0%,#1A2540 60%,#2A6BFF 100%)" }}>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15" style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.16em" }}>
                <ShieldCheck className="w-3 h-3" /> ESTIMATION
              </div>
              <p className="mt-5" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Votre cotisation</p>
              <p className="mt-1" style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatXOF(result.periodic)}
              </p>
              <p className="mt-1 text-white/70" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{FREQ_LABEL[frequency]}</p>
              <div className="mt-5 pt-5 border-t border-white/15 grid grid-cols-2 gap-3">
                <Stat label="Annuel" value={formatXOF(result.annual)} />
                <Stat label="Couverture" value={formatXOF(coverage)} />
              </div>
            </div>
            <div className="mt-7 space-y-2">
              <Link
                to="/devis"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-[#0E1320] hover:scale-[1.02] transition-transform"
                style={{ fontSize: "0.9rem", fontWeight: 800 }}
              >
                <Calculator className="w-4 h-4" /> Demander mon devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-white/60 text-center" style={{ fontSize: "0.7rem" }}>
                Estimation indicative. Un conseiller IPPOO affine selon votre profil.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ippoo-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(90deg,#FF3B57,#FF7A00); outline: none; }
        .ippoo-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid #FF3B57; box-shadow: 0 2px 8px rgba(255,59,87,0.35); cursor: pointer; }
        .ippoo-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid #FF3B57; box-shadow: 0 2px 8px rgba(255,59,87,0.35); cursor: pointer; }
      `}</style>
    </section>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[#717182]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em" }}>{label.toUpperCase()}</p>
        {value && <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0E1320" }}>{value}</p>}
      </div>
      {children}
    </div>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: active ? "linear-gradient(90deg,#FF3B57,#FF7A00)" : "white",
        color: active ? "white" : "#0E1320",
        border: active ? "none" : "1.5px solid rgba(0,0,0,0.08)",
        fontSize: "0.78rem",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/60" style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em" }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>{value}</p>
    </div>
  );
}
