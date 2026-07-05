import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Upload, X, FileText, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useApiData } from "../hooks";
import { api, type KycBundle, type KycDoc, type KycRequest, type KycType } from "../api";

const TYPE_LABEL: Record<KycType, string> = {
  identite: "Pièce d'identité",
  adresse: "Justificatif de domicile",
  revenu: "Justificatif de revenu",
};

// Mapping heuristique entre les libellés cochés dans le wizard d'inscription
// (`profile.documentsDeclares`) et le type de dossier KYC correspondant. Permet
// de pré-cocher la checklist côté client pour éviter de demander à l'utilisateur
// ce qu'il a déjà annoncé.
function inferKycTypeFromDeclared(label: string): KycType | null {
  const v = label.toLowerCase();
  if (/(identit|cni|passeport|permis)/.test(v)) return "identite";
  if (/(domicil|adress|bail|facture|sbee|soneb)/.test(v)) return "adresse";
  if (/(revenu|salair|fiche.*paie|activit|employ|bulletin)/.test(v)) return "revenu";
  return null;
}

const FIELDS_BY_TYPE: Record<KycType, { key: string; label: string; placeholder: string }[]> = {
  identite: [
    { key: "idType", label: "Type de pièce", placeholder: "CNI, passeport, permis…" },
    { key: "idNumber", label: "Numéro", placeholder: "AB1234567" },
  ],
  adresse: [
    { key: "address", label: "Adresse complète", placeholder: "Quartier, rue, ville" },
    { key: "issuedBy", label: "Émis par", placeholder: "SBEE, SONEB, mairie…" },
  ],
  revenu: [
    { key: "employer", label: "Employeur / source", placeholder: "Nom de l'employeur ou activité" },
    { key: "monthly", label: "Revenu mensuel estimé (FCFA)", placeholder: "150000" },
  ],
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function KycPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const meQ = useApiData((t) => api.me(t));
  const declared = meQ.data?.profile?.documentsDeclares ?? [];
  const declaredByType = (() => {
    const m: Partial<Record<KycType, string[]>> = {};
    for (const d of declared) {
      const t = inferKycTypeFromDeclared(d);
      if (!t) continue;
      (m[t] ??= []).push(d);
    }
    return m;
  })();
  const [bundle, setBundle] = useState<KycBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<KycType>("identite");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preselected, setPreselected] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getKyc(token);
      setBundle(res);
    } catch (err) {
      toast.error("Impossible de charger votre dossier KYC.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  // Reset form fields when changing type so we don't carry over stale keys.
  useEffect(() => { setFields({}); }, [type]);

  // Pré-coche le premier type KYC déclaré au signup et non encore validé. Ne
  // s'exécute qu'une fois pour ne pas écraser un choix manuel de l'utilisateur.
  useEffect(() => {
    if (preselected || loading || !bundle) return;
    const validatedTypes = new Set(
      (bundle.history ?? []).filter((h) => h.status === "valide").map((h) => h.type as KycType),
    );
    if (bundle.current?.status === "valide") validatedTypes.add(bundle.current.type);
    const order: KycType[] = ["identite", "adresse", "revenu"];
    const pick = order.find((t) => (declaredByType[t]?.length ?? 0) > 0 && !validatedTypes.has(t));
    if (pick) setType(pick);
    setPreselected(true);
  }, [preselected, loading, bundle, declaredByType]);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (10 Mo max)"); return; }
    setUploading(true);
    try {
      const doc = await api.uploadKycDoc(token, file);
      setDocs((d) => [...d, doc].slice(0, 6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'upload");
    } finally { setUploading(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || submitting) return;
    if (docs.length === 0) { toast.warning("Joignez au moins une pièce."); return; }
    setSubmitting(true);
    try {
      await api.submitKyc(token, { type, fields, docs });
      toast.success("Dossier envoyé pour vérification.");
      setFields({}); setDocs([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally { setSubmitting(false); }
  }

  const current = bundle?.current ?? null;
  const canSubmit = !current || current.status !== "pending";

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#16B26A,#0F7A47)" }}
        >
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.025em" }}>Vérification d'identité</h1>
          <p className="text-[#666]" style={{ fontSize: "0.82rem" }}>
            Un conseiller IPPOO contrôle vos pièces sous 24 h ouvrées.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-center border border-black/5" style={{ fontSize: "0.9rem", color: "#666" }}>
          Chargement…
        </div>
      ) : (
        <>
          {current && <CurrentStatus kyc={current} onRemind={async () => {
            try { await api.remindKyc(token); toast.success("Votre conseiller a été notifié."); await load(); }
            catch (err) { toast.error(err instanceof Error ? err.message : "Relance impossible (1 / 24 h)."); }
          }} />}

          {canSubmit && (
            <form onSubmit={submit} className="rounded-3xl bg-white p-4 border border-black/5 mt-3">
              <p style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>
                Nouvelle soumission
              </p>
              <label className="block mt-3 mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Type de pièce</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KycType)}
                className="w-full mb-1 px-3 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#16B26A]"
                style={{ fontSize: "15px" }}
              >
                {(Object.keys(TYPE_LABEL) as KycType[]).map((t) => {
                  const flagged = (declaredByType[t]?.length ?? 0) > 0;
                  return (
                    <option key={t} value={t}>{TYPE_LABEL[t]}{flagged ? "  — déclaré à l'inscription" : ""}</option>
                  );
                })}
              </select>
              {(declaredByType[type]?.length ?? 0) > 0 && (
                <p className="mb-3 px-3 py-2 rounded-lg" style={{ fontSize: "0.78rem", background: "rgba(22,178,106,0.08)", color: "#0F7A47" }}>
                  Vous avez déclaré au signup : <strong>{declaredByType[type]!.join(", ")}</strong>. Téléversez la pièce pour finaliser.
                </p>
              )}

              {FIELDS_BY_TYPE[type].map((f) => (
                <div key={f.key} className="mb-3">
                  <label className="block mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{f.label}</label>
                  <input
                    value={fields[f.key] ?? ""}
                    onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#16B26A]"
                    style={{ fontSize: "16px" }}
                  />
                </div>
              ))}

              <label className="block mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                Pièces jointes ({docs.length}/6)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-black/15 cursor-pointer hover:border-[#16B26A] hover:bg-[#16B26A]/5 transition-colors"
                  style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666" }}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Téléversement…" : "Fichier / Galerie"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    disabled={uploading || docs.length >= 6}
                    onChange={pickFile}
                  />
                </label>
                {/* P8 - Capture caméra directe sur mobile. L'attribut `capture`
                    déclenche l'appareil photo arrière sans passer par la galerie,
                    pratique pour scanner la CNI ou un justificatif. Sur desktop,
                    le navigateur retombe sur le sélecteur de fichier classique. */}
                <label
                  className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-black/15 cursor-pointer hover:border-[#2A6BFF] hover:bg-[#2A6BFF]/5 transition-colors"
                  style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  Prendre une photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    disabled={uploading || docs.length >= 6}
                    onChange={pickFile}
                  />
                </label>
              </div>
              <p className="mt-1 text-[#999]" style={{ fontSize: "0.72rem" }}>
                Photo ou PDF · 10 Mo max
              </p>
              {docs.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {docs.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F5F0]"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <FileText className="w-4 h-4 shrink-0 text-[#16B26A]" />
                      <span className="truncate flex-1">{d.name}</span>
                      <span className="shrink-0 text-[#999]" style={{ fontSize: "0.72rem" }}>
                        {Math.round(d.size / 1024)} ko
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocs((p) => p.filter((_, j) => j !== i))}
                        className="shrink-0 p-1 text-[#666] hover:text-[#FF3B57]"
                        aria-label={`Retirer ${d.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                disabled={submitting || docs.length === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white disabled:opacity-50"
                style={{ background: "#16B26A", fontWeight: 800 }}
              >
                {submitting ? "Envoi…" : "Envoyer pour vérification"}
              </button>
            </form>
          )}

          {(bundle?.history ?? []).length > 0 && (
            <section className="mt-4">
              <p className="mb-2 px-1" style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>
                Historique
              </p>
              <ul className="space-y-2">
                {bundle!.history.map((h) => (
                  <li key={h.id} className="rounded-2xl bg-white p-3 border border-black/5">
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>{TYPE_LABEL[h.type as KycType] ?? h.type}</span>
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="mt-1" style={{ fontSize: "0.74rem", color: "#666" }}>
                      Soumise le {formatDate(h.createdAt)} · {h.docs?.length ?? 0} pièce(s)
                      {h.decidedAt ? ` · décidée le ${formatDate(h.decidedAt)}` : ""}
                    </p>
                    {h.note && (
                      <p className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F5F0]" style={{ fontSize: "0.8rem" }}>
                        {h.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CurrentStatus({ kyc, onRemind }: { kyc: KycRequest; onRemind?: () => void }) {
  if (kyc.status === "pending") {
    const ageMs = Date.now() - new Date(kyc.createdAt).getTime();
    const ageH = Math.floor(ageMs / 3_600_000);
    const ageDays = Math.floor(ageH / 24);
    const overdue = ageDays >= 3;
    const palette = overdue
      ? { bg: "rgba(180,35,24,0.07)", border: "rgba(180,35,24,0.35)", fg: "#B42318" }
      : { bg: "rgba(255,176,32,0.08)", border: "rgba(255,176,32,0.3)", fg: "#8A5A00" };
    const elapsed = ageDays > 0 ? `${ageDays} j ${ageH % 24} h` : `${ageH} h`;
    const remindedAt = (kyc as any).remindedAt as string | undefined;
    const canRemind = !remindedAt || (Date.now() - new Date(remindedAt).getTime()) >= 24 * 3600_000;
    return (
      <div className="rounded-3xl p-4 border" style={{ background: palette.bg, borderColor: palette.border }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5" style={{ color: palette.fg }} />
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: palette.fg }}>
            {overdue ? "SLA dépassé (>72 h)" : "Vérification en cours"}
          </p>
          <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.6)", fontSize: "0.72rem", fontWeight: 800, color: palette.fg }}>
            {elapsed}
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: palette.fg }}>
          Votre demande du {formatDate(kyc.createdAt)} est en file d'attente. Vous pouvez en envoyer une nouvelle si vous avez des pièces plus récentes.
        </p>
        {onRemind && (
          <button
            onClick={onRemind}
            disabled={!canRemind}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ background: overdue ? "#B42318" : "#FF7A00", fontSize: "0.8rem", fontWeight: 800 }}
          >
            Relancer mon conseiller
          </button>
        )}
        {remindedAt && (
          <p className="mt-1.5" style={{ fontSize: "0.72rem", color: palette.fg }}>
            Dernière relance : {formatDate(remindedAt)}
            {!canRemind && " — vous pourrez relancer à nouveau dans 24 h."}
          </p>
        )}
      </div>
    );
  }
  if (kyc.status === "valide") {
    return (
      <div className="rounded-3xl p-4 border" style={{ background: "rgba(22,178,106,0.08)", borderColor: "rgba(22,178,106,0.3)" }}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5" style={{ color: "#0F7A47" }} />
          <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F7A47" }}>Identité vérifiée</p>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#0F7A47" }}>
          Validée le {formatDate(kyc.decidedAt)}. Vous pouvez resoumettre si vos pièces ont changé.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl p-4 border" style={{ background: "rgba(180,35,24,0.06)", borderColor: "rgba(180,35,24,0.3)" }}>
      <div className="flex items-center gap-2 mb-1">
        <XCircle className="w-5 h-5" style={{ color: "#B42318" }} />
        <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#B42318" }}>Demande rejetée</p>
      </div>
      <p style={{ fontSize: "0.85rem", color: "#B42318" }}>
        Motif : {kyc.note || "non précisé"}. Resoumettez avec les pièces demandées ci-dessous.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
    pending: { label: "En attente", color: "#8A5A00", bg: "rgba(255,176,32,0.18)", Icon: Clock },
    valide: { label: "Validée", color: "#0F7A47", bg: "rgba(22,178,106,0.14)", Icon: CheckCircle2 },
    rejete: { label: "Rejetée", color: "#B42318", bg: "rgba(180,35,24,0.10)", Icon: AlertTriangle },
  };
  const cfg = map[status] ?? map.pending;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, fontSize: "0.7rem", fontWeight: 800 }}
    >
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}
