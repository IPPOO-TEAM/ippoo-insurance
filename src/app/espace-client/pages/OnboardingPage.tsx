import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, ArrowRight, Users, Sparkles, Bell, X } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useAuthedMutation } from "../hooks";
import { qk } from "../queryClient";
import { api } from "../api";

const STEPS = [
  { id: "beneficiaires", title: "Vos bénéficiaires", desc: "Ajoutez les membres de votre famille à couvrir.", icon: Users },
  { id: "souscription", title: "Votre première couverture", desc: "Activez une offre adaptée à vos besoins.", icon: Sparkles },
  { id: "notifications", title: "Restez informé", desc: "Choisissez comment IPPOO vous contacte.", icon: Bell },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [bname, setBname] = useState("");
  const [brelation, setBrelation] = useState("Conjoint(e)");
  const [skipBenef, setSkipBenef] = useState(false);

  const [productPicked, setProductPicked] = useState<string | null>(null);

  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  const addBenef = useAuthedMutation(api.createBeneficiary, { invalidate: [qk.beneficiaries] });
  const subscribe = useAuthedMutation(api.subscribe, { invalidate: [qk.contracts, qk.notifications] });
  const saveSettings = useAuthedMutation(api.updateSettings, { invalidate: [qk.settings] });

  async function next() {
    if (step === 0 && !skipBenef && bname.trim()) {
      await addBenef.mutateAsync({ name: bname.trim(), relation: brelation });
    }
    if (step === 1 && productPicked) {
      const offers: Record<string, { product: string; premium: number }> = {
        sante: { product: "IPPOO Santé", premium: 1500 },
        famille: { product: "IPPOO Famille", premium: 3000 },
        moto: { product: "IPPOO Moto", premium: 1000 },
      };
      await subscribe.mutateAsync({ ...offers[productPicked], frequency: "mensuel" });
    }
    if (step === 2) {
      await saveSettings.mutateAsync({ notifySms, notifyEmail });
      navigate("/espace-client");
      return;
    }
    setStep((s) => s + 1);
  }

  const name = (user?.user_metadata?.name as string | undefined) ?? "";
  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#666]" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em" }}>
          ÉTAPE {step + 1} / {STEPS.length}
        </p>
        <button onClick={() => navigate("/espace-client")} className="text-[#666] hover:text-black inline-flex items-center gap-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          Passer <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 h-1.5 rounded-full transition-colors" style={{ background: i <= step ? "#FF3B57" : "#E5E5E9" }} />
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#FFE2E7] flex items-center justify-center mb-4">
          <StepIcon className="w-6 h-6 text-[#FF3B57]" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{STEPS[step].title}</h1>
        <p className="text-[#666] mt-1 mb-6" style={{ fontSize: "0.95rem" }}>{STEPS[step].desc}</p>

        {step === 0 && (
          <div className="space-y-4">
            <p style={{ fontSize: "0.9rem" }}>Bienvenue {name.split(" ")[0]} ! Commencez par ajouter un proche à protéger.</p>
            <input value={bname} onChange={(e) => setBname(e.target.value)} placeholder="Nom complet du bénéficiaire" className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
            <select value={brelation} onChange={(e) => setBrelation(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white">
              <option>Conjoint(e)</option><option>Enfant</option><option>Père</option><option>Mère</option><option>Frère / Sœur</option><option>Autre</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={skipBenef} onChange={(e) => setSkipBenef(e.target.checked)} className="w-4 h-4 accent-[#FF3B57]" />
              <span className="text-[#666]" style={{ fontSize: "0.85rem" }}>Je le ferai plus tard</span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "sante", label: "Santé", price: "1 500 / mois" },
              { id: "famille", label: "Famille", price: "3 000 / mois" },
              { id: "moto", label: "Moto", price: "1 000 / mois" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProductPicked(p.id)}
                className="text-left p-4 rounded-2xl border-2 transition-all"
                style={{ borderColor: productPicked === p.id ? "#FF3B57" : "rgba(0,0,0,0.1)", background: productPicked === p.id ? "#FFF1F4" : "white" }}
              >
                <p style={{ fontSize: "1rem", fontWeight: 800 }}>{p.label}</p>
                <p className="text-[#666] mt-1" style={{ fontSize: "0.8rem" }}>{p.price} FCFA</p>
                {productPicked === p.id && <Check className="w-4 h-4 text-[#FF3B57] mt-2" />}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black/5 cursor-pointer">
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Recevoir des SMS</span>
              <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} className="w-5 h-5 accent-[#FF3B57]" />
            </label>
            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black/5 cursor-pointer">
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Recevoir des emails</span>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="w-5 h-5 accent-[#FF3B57]" />
            </label>
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <button
            onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate("/espace-client"))}
            className="px-5 py-3 rounded-xl text-[#666] hover:bg-black/5"
            style={{ fontSize: "0.85rem", fontWeight: 700 }}
          >
            Retour
          </button>
          <button
            onClick={next}
            disabled={addBenef.isPending || subscribe.isPending || saveSettings.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white disabled:opacity-60"
            style={{ background: "#FF3B57", fontSize: "0.9rem", fontWeight: 800 }}
          >
            {step === STEPS.length - 1 ? "Terminer" : "Continuer"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
