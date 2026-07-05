import { useState, type FormEvent } from "react";
import { Users, Plus, X, Trash2, Heart } from "lucide-react";
import { Modal } from "../Modal";
import { useAuth } from "../AuthContext";
import { useApiData, formatDate } from "../hooks";
import { api } from "../api";
import { toast } from "sonner";
import { ListCardSkeleton } from "../Skeleton";
import { EmptyState } from "../EmptyState";

const RELATIONS = ["Conjoint(e)", "Enfant", "Père", "Mère", "Frère / Sœur", "Autre"];

export function BeneficiairesPage() {
  const { session } = useAuth();
  const q = useApiData((t) => api.beneficiaries(t));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", relation: RELATIONS[0], birthDate: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createBeneficiary(session.access_token, {
        name: form.name.trim(),
        relation: form.relation,
        birthDate: form.birthDate || undefined,
      });
      const addedName = form.name.trim();
      setForm({ name: "", relation: RELATIONS[0], birthDate: "" });
      setOpen(false);
      await q.reload();
      toast.success(`${addedName} ajouté(e)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      toast.error("Échec de l'ajout", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!session?.access_token) return;
    if (!confirm("Retirer ce bénéficiaire ?")) return;
    try {
      await api.deleteBeneficiary(session.access_token, id);
      await q.reload();
      toast.success("Bénéficiaire retiré");
    } catch (err) {
      console.error("Delete beneficiary failed:", err);
      toast.error("Suppression impossible");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="t-title1">Bénéficiaires</h1>
          <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>Membres de votre famille couverts par vos contrats.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </header>

      {q.loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListCardSkeleton /><ListCardSkeleton /><ListCardSkeleton />
        </div>
      )}
      {q.error && <p className="text-red-600">{q.error}</p>}
      {!q.loading && (q.data?.beneficiaries.length ?? 0) === 0 && (
        <EmptyState
          icon={Users}
          tone="purple"
          title="Aucun bénéficiaire"
          description="Ajoutez votre famille conjoint(e), enfants pour qu'ils soient couverts par votre contrat IPPOO."
          action={
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
              <Plus className="w-4 h-4" /> Ajouter un bénéficiaire
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {q.data?.beneficiaries.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFDCEE] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#FF4FAE]" />
                </div>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 800 }}>{b.name}</p>
                  <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>{b.relation}</p>
                </div>
              </div>
              <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {b.birthDate && <p className="mt-3 text-[#666]" style={{ fontSize: "0.75rem" }}>Né(e) le {formatDate(b.birthDate)}</p>}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un bénéficiaire">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Nom complet" type="text" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Relation</label>
                <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF4FAE] bg-white">
                  {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <Field label="Date de naissance (optionnel)" type="date" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>{error}</div>}
              <button type="submit" disabled={submitting} className="w-full px-6 py-3.5 rounded-xl text-white disabled:opacity-60" style={{ background: "#FF3B57", fontWeight: 800 }}>
                {submitting ? "Ajout..." : "Ajouter"}
              </button>
            </form>
      </Modal>
    </div>
  );
}

function Field({ label, type, value, onChange, required }: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF4FAE]" />
    </div>
  );
}
