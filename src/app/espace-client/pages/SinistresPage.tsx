import { useState, useRef, type FormEvent } from "react";
import { AlertTriangle, Plus, X, Paperclip, FileText, Loader2, CheckCircle2, Clock, FileCheck2, Coins, UserCheck } from "lucide-react";
import { Modal } from "../Modal";
import { useAuth } from "../AuthContext";
import { useApiData, formatDate, formatXOF } from "../hooks";
import { api, type Claim } from "../api";
import { StatusBadge } from "./DashboardPage";
import { toast } from "sonner";
import { ListCardSkeleton } from "../Skeleton";
import { EmptyState } from "../EmptyState";
import { benefitEligibility, formatEligibleDate, BENEFIT_QUALIFYING_MONTHS } from "../../lib/eligibility";

const TYPES = ["Hospitalisation", "Décès", "Incendie boutique", "Vol de marchandise", "Accident", "Autre"];
const TIMELINE: { key: Claim["status"]; label: string; icon: any }[] = [
  { key: "en_cours", label: "Déclaré", icon: Clock },
  { key: "valide", label: "Validé", icon: FileCheck2 },
  { key: "regle", label: "Réglé", icon: Coins },
];

export function SinistresPage() {
  const { session } = useAuth();
  const claimsQ = useApiData((t) => api.claims(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const beneficiariesQ = useApiData((t) => api.beneficiaries(t));
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: TYPES[0], description: "", amount: "", contractId: "", beneficiaryId: "" });
  const [files, setFiles] = useState<File[]>([]);

  // Période de stage : 6 mois de cotisation avant d'ouvrir les droits.
  const contracts = contractsQ.data?.contracts ?? [];
  const selectedContract = form.contractId ? contracts.find((c) => c.id === form.contractId) ?? null : null;
  const selectedEligible = selectedContract
    ? benefitEligibility(selectedContract.startDate).eligible
    : contracts.length === 0 || contracts.some((c) => benefitEligibility(c.startDate).eligible);
  const blockedUntil = (() => {
    if (selectedEligible) return null;
    const pool = selectedContract ? [selectedContract] : contracts;
    const dates = pool
      .map((c) => benefitEligibility(c.startDate).eligibleAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ?? null;
  })();
  const stageActive = contracts.length > 0 && !contracts.some((c) => benefitEligibility(c.startDate).eligible);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setSubmitting(true);
    setError(null);
    try {
      const { claim } = await api.createClaim(session.access_token, {
        type: form.type,
        description: form.description.trim(),
        amount: form.amount ? Number(form.amount) : 0,
        contractId: form.contractId || undefined,
        beneficiaryId: form.beneficiaryId || undefined,
      });
      for (const f of files) {
        try {
          await api.uploadClaimAttachment(session.access_token, claim.id, f);
        } catch (err) {
          console.error("Attachment upload failed", err);
        }
      }
      setForm({ type: TYPES[0], description: "", amount: "", contractId: "", beneficiaryId: "" });
      setFiles([]);
      setOpen(false);
      await claimsQ.reload();
      toast.success("Sinistre déclaré", { description: "Vous recevrez une mise à jour sous 48 h." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la déclaration";
      setError(msg);
      toast.error("Échec de la déclaration", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="t-title1">Sinistres</h1>
          <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>Suivez vos déclarations et leur traitement.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
          <Plus className="w-4 h-4" /> Nouvelle déclaration
        </button>
      </header>

      {stageActive && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: "#FFF7E6", border: "1px solid #FFE2B3" }}>
          <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#B85400" }} />
          <p style={{ fontSize: "0.82rem", color: "#5C3A00", lineHeight: 1.5 }}>
            <strong>Période de stage.</strong> Vous devez cotiser pendant {BENEFIT_QUALIFYING_MONTHS} mois (un semestre) avant de bénéficier de votre mutuelle.
            {blockedUntil ? <> Vos droits seront ouverts le <strong>{formatEligibleDate(blockedUntil)}</strong>.</> : null}
          </p>
        </div>
      )}

      {claimsQ.loading && (
        <div className="space-y-4">
          <ListCardSkeleton /><ListCardSkeleton /><ListCardSkeleton />
        </div>
      )}
      {claimsQ.error && <p className="text-red-600">{claimsQ.error}</p>}
      {!claimsQ.loading && (claimsQ.data?.claims.length ?? 0) === 0 && (
        <EmptyState
          icon={AlertTriangle}
          tone="amber"
          title="Aucun sinistre déclaré"
          description="C'est bon signe ! En cas d'incident, déclarez-le ici et joignez vos pièces règlement en moins de 7 jours."
          action={
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
              <Plus className="w-4 h-4" /> Déclarer maintenant
            </button>
          }
        />
      )}

      <div className="space-y-4">
        {claimsQ.data?.claims.map((c) => (
          <ClaimCard key={c.id} claim={c} onChanged={() => claimsQ.reload()} />
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Déclarer un sinistre">
            <form onSubmit={onSubmit} className="space-y-4">
              {!selectedEligible && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "#FFF7E6", border: "1px solid #FFE2B3" }}>
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#B85400" }} />
                  <p style={{ fontSize: "0.8rem", color: "#5C3A00", lineHeight: 1.5 }}>
                    <strong>Période de stage.</strong> Un semestre de cotisation ({BENEFIT_QUALIFYING_MONTHS} mois) est requis avant toute prise en charge.
                    {blockedUntil ? <> Droits ouverts le <strong>{formatEligibleDate(blockedUntil)}</strong>.</> : null}
                  </p>
                </div>
              )}
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {(contractsQ.data?.contracts.length ?? 0) > 0 && (
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Contrat concerné (optionnel)</label>
                  <select value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white">
                    <option value="">  Aucun  </option>
                    {contracts.map((c) => {
                      const el = benefitEligibility(c.startDate);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.product}{el.eligible ? "" : ` — bénéfices le ${formatEligibleDate(el.eligibleAt)}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              {(beneficiariesQ.data?.beneficiaries.length ?? 0) > 0 && (
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Bénéficiaire concerné (optionnel)</label>
                  <select value={form.beneficiaryId} onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white">
                    <option value="">  Aucun (sinistre me concernant)  </option>
                    {beneficiariesQ.data?.beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.name}{b.relation ? ` — ${b.relation}` : ""}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Description des faits</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] resize-none" placeholder="Décrivez ce qui s'est passé..." />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Montant estimé (FCFA, optionnel)</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Pièces justificatives</label>
                <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-black/15 cursor-pointer hover:border-[#FF3B57]">
                  <Paperclip className="w-4 h-4 text-[#666]" />
                  <span className="text-[#666]" style={{ fontSize: "0.85rem" }}>Ajouter photos / PDF (10 Mo max)</span>
                  <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                </label>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f) => (
                      <li key={f.name} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#F5F6FA]" style={{ fontSize: "0.8rem" }}>
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} className="text-red-600"><X className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>{error}</div>}
              <button type="submit" disabled={submitting || !selectedEligible} className="w-full px-6 py-3.5 rounded-xl text-white disabled:opacity-60" style={{ background: "#FF3B57", fontWeight: 800 }}>
                {submitting ? "Envoi..." : !selectedEligible ? "Indisponible (période de stage)" : "Envoyer la déclaration"}
              </button>
            </form>
      </Modal>
    </div>
  );
}

function ClaimCard({ claim: c, onChanged }: { claim: Claim; onChanged: () => void }) {
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function openAttachment(path: string) {
    if (!session?.access_token) return;
    try {
      const { url } = await api.claimAttachmentUrl(session.access_token, path);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error("Signed URL error", err);
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!fs.length || !session?.access_token) return;
    setUploading(true);
    try {
      for (const f of fs) await api.uploadClaimAttachment(session.access_token, c.id, f);
      onChanged();
      toast.success(fs.length > 1 ? `${fs.length} pièces ajoutées` : "Pièce ajoutée");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'upload", { description: err instanceof Error ? err.message : "" });
    } finally {
      setUploading(false);
    }
  }

  const activeIdx = TIMELINE.findIndex((s) => s.key === c.status);
  const rejected = c.status === "rejete";

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>{c.type}</p>
          <p className="mt-1 text-[#444]" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{c.description}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>Déclaré le {formatDate(c.createdAt)}</p>
            {!rejected && c.status !== "regle" && <SlaChip createdAt={c.createdAt} />}
          </div>
          {c.assignedTo && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "#FFE2E7", color: "#FF3B57", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.02em" }}>
              <UserCheck className="w-3 h-3" /> Conseiller {c.assignedTo}
            </p>
          )}
          {c.adminNote && (
            <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: "#FFF7E6", border: "1px solid #FFE2B3" }}>
              <p style={{ fontSize: "0.66rem", fontWeight: 800, color: "#B85400", letterSpacing: "0.06em" }}>NOTE DU CONSEILLER</p>
              <p className="mt-0.5 whitespace-pre-wrap" style={{ fontSize: "0.78rem", color: "#5C3A00", lineHeight: 1.45 }}>{c.adminNote}</p>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <StatusBadge status={c.status} />
          {c.amount > 0 && <p className="mt-2" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{formatXOF(c.amount)}</p>}
        </div>
      </div>

      {!rejected && (
        <div className="mt-5 flex items-center gap-1.5">
          {TIMELINE.map((s, i) => {
            const Icon = s.icon;
            const done = i <= activeIdx;
            const isLast = i === TIMELINE.length - 1;
            return (
              <div key={s.key} className="flex-1 flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: done ? "linear-gradient(135deg,#16B26A,#0F7A47)" : "#F0F1F5" }}>
                    {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className="w-3.5 h-3.5 text-[#888]" />}
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: done ? "#0F7A47" : "#888" }}>{s.label}</span>
                </div>
                {!isLast && <div className="flex-1 h-0.5 -mt-4" style={{ background: i < activeIdx ? "#16B26A" : "#E5E5E9" }} />}
              </div>
            );
          })}
        </div>
      )}

      {(c.attachments?.length ?? 0) > 0 && (
        <div className="mt-4 pt-4 border-t border-black/5">
          <p className="text-[#666] mb-2" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: 800 }}>PIÈCES ({c.attachments!.length})</p>
          <div className="flex flex-wrap gap-2">
            {c.attachments!.map((a) => (
              <button key={a.path} onClick={() => openAttachment(a.path)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F6FA] hover:bg-[#FFE2E7]" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                <FileText className="w-3.5 h-3.5 text-[#FF3B57]" /> {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {c.status !== "regle" && c.status !== "rejete" && (
        <div className="mt-4 flex justify-end">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#FF3B57] hover:bg-[#FFE2E7]" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            {uploading ? "Envoi..." : c.adminNote ? "Compléter mon dossier" : "Ajouter une pièce"}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={onPick} />
        </div>
      )}
    </div>
  );
}

// SLA 48 h : promesse client affichée à la déclaration. Vert tant qu'il reste
// du temps, ambre dans les 6 dernières heures, rouge si dépassé — pour rendre
// l'engagement visible et opposable côté conseiller.
function SlaChip({ createdAt }: { createdAt: string }) {
  const created = new Date(createdAt).getTime();
  const deadline = created + 48 * 3600_000;
  const remainMs = deadline - Date.now();
  let label: string;
  let bg = "#D4F4E2"; let fg = "#0F7A47";
  if (remainMs <= 0) {
    const overH = Math.floor(-remainMs / 3600_000);
    label = `SLA dépassé · +${overH} h`;
    bg = "#FFE2E7"; fg = "#C0263A";
  } else if (remainMs < 6 * 3600_000) {
    label = `SLA · ${Math.max(1, Math.floor(remainMs / 3600_000))} h restantes`;
    bg = "#FFE6CC"; fg = "#B85400";
  } else {
    const h = Math.floor(remainMs / 3600_000);
    label = `SLA · ${h} h restantes`;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: bg, color: fg, fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.02em" }} title="Engagement de réponse sous 48 h après déclaration">
      <Clock className="w-3 h-3" /> {label}
    </span>
  );
}
