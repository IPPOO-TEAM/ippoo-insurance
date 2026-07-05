import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { CheckCircle2, XCircle, Clock, RefreshCw, Search, User, ChevronRight, Banknote, Download, UserPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { toCsv, downloadCsv } from "../csv";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi, type AgentClaim } from "../api";
import { ListSkeleton, EmptyState, EmptyClaimsArt } from "../components/ListStates";
import { statusLabel } from "../../espace-client/labels";

type StatusFilter = "" | "soumis" | "en_cours" | "en_examen" | "valide" | "rejete" | "regle";

// La couleur/icône reste locale (UI métier agent) mais le libellé vient de
// labels.ts (source unique partagée avec client + admin, prêt pour FR/EN).
const STATUS_META: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  soumis:    { color: "#B85400", bg: "#FFE6CC", icon: Clock },
  en_cours:  { color: "#B85400", bg: "#FFE6CC", icon: Clock },
  en_examen: { color: "#B85400", bg: "#FFE6CC", icon: Clock },
  valide:    { color: "#0F7A47", bg: "#D4F4E2", icon: CheckCircle2 },
  rejete:    { color: "#C0263A", bg: "#FFE2E7", icon: XCircle },
  regle:     { color: "#0F7A47", bg: "#D4F4E2", icon: Banknote },
};

function relativeTime(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatFcfa(n?: number) {
  if (typeof n !== "number") return "—";
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export function AgentClaimsPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const navigate = useNavigate();
  const { me } = useOutletContext<{ me: { matricule?: string } | null }>() ?? { me: null };
  const myMatricule = me?.matricule ?? "";
  const [claims, setClaims] = useState<AgentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [transferMatricule, setTransferMatricule] = useState("");

  async function reload() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await agentApi.claims(token);
      setClaims(res.claims);
    } catch (err) {
      console.error("agentApi.claims failed:", err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return claims.filter((c) => {
      if (status && c.status !== status) return false;
      if (mineOnly && myMatricule && c.assignedTo !== myMatricule) return false;
      if (!ql) return true;
      return [c.userName, c.userEmail, c.memberNumber, c.type, c.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(ql));
    });
  }, [claims, q, status, mineOnly, myMatricule]);

  const mineCount = useMemo(
    () => (myMatricule ? claims.filter((c) => c.assignedTo === myMatricule).length : 0),
    [claims, myMatricule],
  );

  const selected = useMemo(() => filtered.find((c) => c.id === selectedId) ?? null, [filtered, selectedId]);

  useEffect(() => { setNote(selected?.adminNote ?? ""); }, [selected?.id]);

  const orphanCount = useMemo(
    () => claims.filter((c) => !c.assignedTo && c.status !== "valide" && c.status !== "rejete" && c.status !== "regle").length,
    [claims],
  );

  async function transferClaim() {
    if (!token || !selected) return;
    if (!/^IPPOO-A-\d{4}$/.test(transferMatricule)) { toast.error("Matricule invalide"); return; }
    setActing(true);
    try {
      const res = await agentApi.reassignClaimTo(token, selected.userId, selected.id, transferMatricule, note.trim() || undefined);
      setClaims((prev) => prev.map((cl) =>
        (cl.id === selected.id && cl.userId === selected.userId) ? { ...cl, ...res.claim } : cl,
      ));
      toast.success(`Transféré à ${transferMatricule}.`);
      setTransferMatricule("");
      setSelectedId(null);
    } catch (err) {
      toast.error(`Transfert impossible : ${err}`);
    } finally { setActing(false); }
  }

  async function uploadAttachment(file: File) {
    if (!token || !selected) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (10 Mo max)"); return; }
    setUploading(true);
    try {
      const res = await agentApi.uploadClaimAttachment(token, selected.userId, selected.id, file);
      setClaims((prev) => prev.map((cl) =>
        (cl.id === selected.id && cl.userId === selected.userId)
          ? { ...cl, attachments: [...(cl.attachments ?? []), { name: res.attachment.name }] }
          : cl,
      ));
      toast.success("Pièce ajoutée au dossier.");
    } catch (err) {
      toast.error(`Upload impossible : ${err}`);
    } finally {
      setUploading(false);
    }
  }

  async function assignToMe(c: AgentClaim) {
    if (!token) return;
    try {
      const res = await agentApi.assignClaimToMe(token, c.userId, c.id);
      setClaims((prev) => prev.map((cl) => (cl.id === c.id && cl.userId === c.userId ? { ...cl, ...res.claim } : cl)));
      toast.success("Sinistre assigné.");
    } catch (err) {
      toast.error(`Assignation impossible : ${err}`);
    }
  }

  async function changeStatus(next: "valide" | "rejete" | "regle" | "en_cours") {
    if (!token || !selected) return;
    setActing(true);
    try {
      const res = await agentApi.updateClaimStatus(token, selected.userId, selected.id, next, note);
      setClaims((prev) => prev.map((c) => (c.id === selected.id && c.userId === selected.userId ? { ...c, ...res.claim } : c)));
    } catch (err) {
      console.error("updateClaimStatus failed:", err);
      alert("Mise à jour impossible — réessayez.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Sinistres
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            Décisions et suivi des déclarations
          </p>
        </div>
        <button
          onClick={() => {
            const csv = toCsv(
              filtered.map((c) => ({
                createdAt: c.createdAt,
                id: c.id,
                userName: c.userName,
                userEmail: c.userEmail,
                memberNumber: c.memberNumber,
                type: c.type,
                amount: c.amount ?? "",
                status: c.status,
                decidedAt: c.decidedAt ?? "",
                decidedBy: c.decidedBy ?? "",
                description: c.description ?? "",
                adminNote: c.adminNote ?? "",
              })),
              [
                { key: "createdAt", label: "Date" },
                { key: "id", label: "ID sinistre" },
                { key: "userName", label: "Client" },
                { key: "userEmail", label: "Email" },
                { key: "memberNumber", label: "N° membre" },
                { key: "type", label: "Type" },
                { key: "amount", label: "Montant" },
                { key: "status", label: "Statut" },
                { key: "decidedAt", label: "Décidé le" },
                { key: "decidedBy", label: "Décidé par" },
                { key: "description", label: "Description" },
                { key: "adminNote", label: "Note" },
              ],
            );
            downloadCsv(`IPPOO_sinistres_${new Date().toISOString().slice(0, 10)}.csv`, csv);
          }}
          disabled={filtered.length === 0}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Exporter CSV"
          title="Exporter en CSV"
        >
          <Download className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={reload}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Rafraîchir"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div
        className="sticky z-10 -mx-4 px-4 pt-1 pb-3 mb-3"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 60px)",
          background: "color-mix(in srgb, var(--surface-app) 92%, transparent)",
          backdropFilter: "saturate(160%) blur(12px)",
          WebkitBackdropFilter: "saturate(160%) blur(12px)",
        }}
      >
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "var(--ippoo-text-muted)" }} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, type, description…"
            className="w-full rounded-2xl pl-10 pr-3 focus:outline-none"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--line-hairline)",
              color: "var(--ippoo-text)",
              fontSize: "16px",
              minHeight: 44,
            }}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {myMatricule && (
            <button
              onClick={() => setMineOnly((v) => !v)}
              className="shrink-0 px-3.5 rounded-full transition active:scale-95 inline-flex items-center gap-1.5"
              style={{
                minHeight: 36,
                background: mineOnly ? "var(--accent-primary)" : "var(--surface-card)",
                color: mineOnly ? "white" : "var(--ippoo-text-muted)",
                border: `1px solid ${mineOnly ? "var(--accent-primary)" : "var(--line-hairline)"}`,
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
              title="N'afficher que les sinistres qui me sont assignés"
            >
              <User className="w-3.5 h-3.5" /> Mes sinistres
              {mineCount > 0 && (
                <span
                  className="ml-0.5 px-1.5 rounded-full"
                  style={{
                    background: mineOnly ? "rgba(255,255,255,0.22)" : "var(--surface-app)",
                    fontSize: "0.66rem",
                    fontWeight: 800,
                  }}
                >
                  {mineCount}
                </span>
              )}
            </button>
          )}
          {(["", "en_cours", "valide", "rejete", "regle"] as StatusFilter[]).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              className="shrink-0 px-3.5 rounded-full transition active:scale-95"
              style={{
                minHeight: 36,
                background: status === s ? "var(--accent-primary)" : "var(--surface-card)",
                color: status === s ? "white" : "var(--ippoo-text-muted)",
                border: `1px solid ${status === s ? "var(--accent-primary)" : "var(--line-hairline)"}`,
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              {s ? statusLabel(s) : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {loading && filtered.length === 0 && <ListSkeleton rows={6} />}
      {!loading && filtered.length === 0 && (
        <EmptyState
          art={<EmptyClaimsArt />}
          title={q || status ? "Aucun résultat" : "Aucun sinistre"}
          hint={
            q || status
              ? "Aucun sinistre ne correspond à vos filtres."
              : "Tous les sinistres déclarés par les clients apparaîtront ici."
          }
        />
      )}
      {orphanCount > 0 && (
        <div
          className="mb-3 rounded-2xl px-3.5 py-2.5 flex items-center gap-2"
          style={{ background: "#FFF4E0", border: "1px solid #F1C36E", color: "#7A4E00", fontSize: "0.82rem", fontWeight: 700 }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {orphanCount} sinistre{orphanCount > 1 ? "s" : ""} sans conseiller — utilisez « Assigner à moi » pour prendre en charge.
        </div>
      )}
      <ul className="space-y-2">
        {filtered.map((c) => {
          const meta = STATUS_META[c.status] ?? STATUS_META.en_cours;
          const Icon = meta.icon;
          const orphan =
            !c.assignedTo &&
            c.status !== "valide" &&
            c.status !== "rejete" &&
            c.status !== "regle";
          return (
            <li key={`${c.userId}:${c.id}`}>
              <button
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left rounded-2xl px-3.5 py-3 active:scale-[0.99] transition"
                style={{
                  background: orphan ? "#FFF8EC" : "var(--surface-card)",
                  border: `1px solid ${orphan ? "#F1C36E" : "var(--line-hairline)"}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--ippoo-text)" }}>{c.type || "Sinistre"}</p>
                      <span className="shrink-0" style={{ fontSize: "0.68rem", color: "var(--ippoo-text-muted)" }}>{relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="truncate mt-0.5" style={{ fontSize: "0.76rem", color: "var(--ippoo-text-muted)" }}>
                      {c.userName || c.userEmail || "Client"}{c.memberNumber ? ` · ${c.memberNumber}` : ""}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color, fontSize: "0.66rem", fontWeight: 800 }}>
                        {statusLabel(c.status)}
                      </span>
                      {c.assignedTo && (
                        <span
                          className="px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{
                            background: c.assignedTo === myMatricule ? "rgba(255,59,87,0.12)" : "var(--surface-app)",
                            color: c.assignedTo === myMatricule ? "var(--accent-primary)" : "var(--ippoo-text-muted)",
                            border: "1px solid var(--line-hairline)",
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                          }}
                          title={c.assignedTo === myMatricule ? "Assigné à moi" : `Assigné à ${c.assignedTo}`}
                        >
                          <User className="w-2.5 h-2.5" /> {c.assignedTo === myMatricule ? "Moi" : c.assignedTo}
                        </span>
                      )}
                      {typeof c.amount === "number" && (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>{formatFcfa(c.amount)}</span>
                      )}
                      {orphan && (
                        <span
                          onClick={(e) => { e.stopPropagation(); assignToMe(c); }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); assignToMe(c); } }}
                          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full cursor-pointer active:scale-95 transition"
                          style={{ background: "#7A4E00", color: "white", fontSize: "0.66rem", fontWeight: 800 }}
                        >
                          <UserPlus className="w-3 h-3" /> Assigner à moi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom sheet pour le détail d'un sinistre. Native pattern : slide-up,
          handle bar, scroll interne, fermeture par tap sur le scrim ou ← */}
      {selected && (
        <DetailSheet onClose={() => setSelectedId(null)}>
          <div className="px-5 pt-2 pb-1 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{selected.type}</p>
              <p className="truncate" style={{ fontSize: "0.76rem", color: "var(--ippoo-text-muted)" }}>
                Déposé {relativeTime(selected.createdAt)} · #{selected.id.slice(-6)}
              </p>
            </div>
            <button
              onClick={() => navigate(`/agent/clients/${selected.userId}`)}
              className="px-3 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800, minHeight: 40 }}
            >
              <User className="w-4 h-4" /> Fiche <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 pt-4 pb-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Client" value={selected.userName || selected.userEmail || "—"} />
              <Info label="N° membre" value={selected.memberNumber || "—"} />
              <Info label="Montant" value={formatFcfa(selected.amount)} />
              <Info label="Statut" value={statusLabel(selected.status)} />
            </div>

            {selected.description && (
              <div>
                <p className="mb-1.5" style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ippoo-text-muted)" }}>Description</p>
                <p className="whitespace-pre-wrap" style={{ fontSize: "0.92rem", lineHeight: 1.5, color: "var(--ippoo-text)" }}>{selected.description}</p>
              </div>
            )}

            <div>
              <p className="mb-1.5 flex items-center justify-between" style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ippoo-text-muted)" }}>
                <span>Pièces jointes</span>
                <label
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer active:scale-95 transition"
                  style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)", textTransform: "none", letterSpacing: 0, fontSize: "0.72rem", fontWeight: 800 }}
                >
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 rotate-180" />}
                  {uploading ? "Envoi…" : "Ajouter"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }}
                  />
                </label>
              </p>
              {selected.attachments && selected.attachments.length > 0 ? (
                <ul className="space-y-1.5">
                  {selected.attachments.map((a, i) => (
                    <li key={i}>
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 rounded-xl active:scale-95 transition" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--accent-primary)", fontSize: "0.85rem", fontWeight: 700, minHeight: 44 }}>📎 {a.name}</a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 rounded-xl" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text-muted)", fontSize: "0.85rem", minHeight: 44 }}>📎 {a.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.76rem", color: "var(--ippoo-text-muted)" }}>Aucune pièce. Utilisez « Ajouter » pour joindre un document reçu hors-app (WhatsApp, agence).</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block" style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ippoo-text-muted)" }}>Note conseiller</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Justification, pièces réclamées, motif…"
                className="w-full rounded-2xl px-3 py-3 focus:outline-none resize-none"
                style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)", fontSize: "16px" }}
              />
              <p className="mt-1" style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>Envoyée avec la prochaine décision de statut. Visible côté client.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: "1px solid var(--line-hairline)" }}>
              <ActionButton color="#16B26A" onClick={() => changeStatus("valide")} disabled={acting} icon={CheckCircle2} label="Valider" />
              <ActionButton color="#B85400" onClick={() => changeStatus("en_cours")} disabled={acting} icon={Clock} label="En cours" />
              <ActionButton color="#FF3B57" onClick={() => changeStatus("regle")} disabled={acting} icon={Banknote} label="Réglé" />
              <ActionButton color="#C0263A" onClick={() => changeStatus("rejete")} disabled={acting} icon={XCircle} label="Rejeter" />
            </div>

            {selected.assignedTo === myMatricule && (
              <div className="pt-3" style={{ borderTop: "1px solid var(--line-hairline)" }}>
                <p className="mb-1.5" style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ippoo-text-muted)" }}>Transférer à un collègue</p>
                <div className="flex gap-2">
                  <input
                    placeholder="IPPOO-A-XXXX"
                    value={transferMatricule}
                    onChange={(e) => setTransferMatricule(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl"
                    style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "14px" }}
                  />
                  <button
                    onClick={() => transferClaim()}
                    disabled={acting || !/^IPPOO-A-\d{4}$/.test(transferMatricule)}
                    className="px-3 py-2 rounded-xl disabled:opacity-50"
                    style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.78rem", fontWeight: 800 }}
                  >
                    Transférer
                  </button>
                </div>
                <p className="mt-1" style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>La note ci-dessus sera envoyée comme motif au collègue.</p>
              </div>
            )}

            {selected.decidedAt && (
              <p style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
                Dernière décision : {selected.decidedBy ?? "—"} · {relativeTime(selected.decidedAt)}
              </p>
            )}
          </div>
        </DetailSheet>
      )}
    </div>
  );
}

// Bottom sheet réutilisable — pattern natif iOS/Android. Scrim cliquable
// pour fermer, slide-up via transform, handle barre visible en haut, scroll
// interne, max-h 92vh pour laisser respirer le scrim.
function DetailSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(14,19,32,0.45)" }} onClick={onClose}>
      <div
        className="w-full mx-auto rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface-card)",
          maxWidth: 672,
          maxHeight: "92vh",
          animation: "slideUp 220ms cubic-bezier(0.2,0.8,0.2,1)",
          boxShadow: "0 -10px 30px rgba(14,19,32,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="block rounded-full" style={{ width: 40, height: 4, background: "var(--line-hairline)" }} />
        </div>
        <div className="overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {children}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
      <p style={{ fontSize: "0.66rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ippoo-text-muted)" }}>{label}</p>
      <p className="mt-0.5 truncate" style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--ippoo-text)" }}>{value}</p>
    </div>
  );
}

function ActionButton({ color, onClick, disabled, icon: Icon, label }: { color: string; onClick: () => void; disabled?: boolean; icon: typeof CheckCircle2; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 px-3.5 rounded-2xl text-white disabled:opacity-50 active:scale-[0.97] transition"
      style={{ background: color, fontSize: "0.88rem", fontWeight: 800, minHeight: 48, boxShadow: `0 4px 12px ${color}33` }}
    >
      <Icon className="w-[18px] h-[18px]" /> {label}
    </button>
  );
}
