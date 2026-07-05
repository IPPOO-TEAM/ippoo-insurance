import { useEffect, useRef, useState } from "react";
import { Smartphone, ShieldCheck, X, Loader2, Check } from "lucide-react";
import { formatXOF } from "./hooks";

type Operator = "mtn" | "moov";
type Step = "phone" | "ussd" | "otp" | "processing" | "done";

interface Props {
  open: boolean;
  amount: number;
  defaultPhone?: string;
  onCancel: () => void;
  onConfirmed: (info: { operator: Operator; phone: string }) => Promise<void> | void;
}

const OPERATORS: { id: Operator; name: string; color: string; ussd: string; prefixes: string[] }[] = [
  { id: "mtn",  name: "MTN MoMo",   color: "#FFCC00", ussd: "*880#", prefixes: ["96","97","69","66","51","52","53","54","61","62","67","91","90"] },
  { id: "moov", name: "Moov Money", color: "#0066CC", ussd: "*155#", prefixes: ["94","95","98","99","65","68","56","57","60","63","64"] },
];

function guessOperator(phone: string): Operator {
  const digits = phone.replace(/\D/g, "").replace(/^229/, "");
  const p = digits.slice(0, 2);
  return OPERATORS.find((o) => o.prefixes.includes(p))?.id ?? "mtn";
}

export function MoMoDialog({ open, amount, defaultPhone, onCancel, onConfirmed }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [operator, setOperator] = useState<Operator>("mtn");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("phone"); setOtp(""); setErr(null);
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    }
  }, [open]);

  useEffect(() => {
    if (phone) setOperator(guessOperator(phone));
  }, [phone]);

  if (!open) return null;
  const op = OPERATORS.find((o) => o.id === operator)!;

  async function go() {
    if (step === "phone") {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 8) { setErr("Numéro invalide"); return; }
      setErr(null);
      setStep("ussd");
      timerRef.current = window.setTimeout(() => setStep("otp"), 1800);
    } else if (step === "otp") {
      if (otp.length < 4) { setErr("Code à 4 chiffres requis"); return; }
      setErr(null);
      setStep("processing");
      try {
        await onConfirmed({ operator, phone });
        setStep("done");
        timerRef.current = window.setTimeout(() => onCancel(), 1200);
      } catch (e) {
        setStep("otp");
        setErr(e instanceof Error ? e.message : "Échec du paiement");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: op.color, color: operator === "mtn" ? "#0E1320" : "white" }}>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <p style={{ fontWeight: 900 }}>{op.name}</p>
          </div>
          {step !== "processing" && step !== "done" && (
            <button onClick={onCancel} aria-label="Fermer"><X className="w-4 h-4" /></button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-[#666]" style={{ fontSize: "0.75rem", letterSpacing: "0.14em", fontWeight: 700 }}>MONTANT</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{formatXOF(amount)}</p>
          </div>

          {step === "phone" && (
            <>
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Numéro Mobile Money</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="97 00 00 00"
                  className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]"
                />
                <p className="mt-1.5 text-[#666]" style={{ fontSize: "0.72rem" }}>
                  Opérateur détecté : <strong>{op.name}</strong>
                </p>
              </div>
              <div className="flex gap-2">
                {OPERATORS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOperator(o.id)}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 transition-colors ${operator === o.id ? "border-[#FF3B57] bg-[#FFE2E7]" : "border-black/10 hover:border-black/20"}`}
                    style={{ fontSize: "0.78rem", fontWeight: 700 }}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "ussd" && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#FF3B57]" />
              <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>Composer {op.ussd}</p>
              <p className="text-[#666] mt-1" style={{ fontSize: "0.82rem" }}>
                Vérifiez votre téléphone, puis confirmez la transaction avec votre code secret.
              </p>
            </div>
          )}

          {step === "otp" && (
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Code OTP reçu par SMS</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] text-center tracking-[0.4em]"
                style={{ fontSize: "1.2rem", fontWeight: 800 }}
              />
              <p className="mt-1.5 text-[#666] flex items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Code à 4-6 chiffres reçu sur {phone || "votre numéro"}
              </p>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-6">
              <Loader2 className="w-9 h-9 mx-auto mb-3 animate-spin text-[#FF3B57]" />
              <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Validation auprès de {op.name}...</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#16B26A,#0F7A47)" }}>
                <Check className="w-7 h-7 text-white" />
              </div>
              <p style={{ fontSize: "1rem", fontWeight: 800 }}>Paiement confirmé</p>
            </div>
          )}

          {err && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200" style={{ fontSize: "0.8rem" }}>{err}</div>}

          {(step === "phone" || step === "otp") && (
            <button
              onClick={go}
              className="w-full px-5 py-3 rounded-xl text-white"
              style={{ background: "#FF3B57", fontWeight: 800 }}
            >
              {step === "phone" ? `Composer ${op.ussd}` : "Valider le code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
