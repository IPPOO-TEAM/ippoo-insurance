import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, XCircle, Clock, RefreshCw, Search, User, ChevronRight, ShieldCheck, FileText, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi, type AgentKyc } from "../api";
import { ListSkeleton, EmptyState, EmptyKycArt } from "../components/ListStates";

const TYPE_LABEL: Record<string, string> = {
  identite: "Pièce d'identité",
  adresse: "Justificatif de domicile",
  revenu: "Justificatif de revenu",
};

function relTime(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AgentKycPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const navigate = useNavigate();
  const [pending, setPending] = useState<AgentKyc[]>([]);
  const [decided, setDecided] = useState<AgentKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"pending" | "decided">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await agentApi.kycQueue(token);
      setPending(res.pending ?? []);
      setDecided(res.decided ?? []);
    } catch (err) {
      console.error("Erreur chargement KYC:", err);
      toast.error("Impossible de charger la file KYC.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  const list = tab === "pending" ? pending : decided;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((k) =>
      [k.userName, k.userEmail, k.memberNumber, TYPE_LABEL[k.type] ?? k.type]
        .some((v) => (v ?? "").toLowerCase().includes(needle)),
    );
  }, [list, q]);

  const selected = useMemo(() => filtered.find((k) => k.id === selectedId) ?? null, [filtered, selectedId]);

  useEffect(() => { setNote(""); }, [selected?.id]);

  async function decide(decision: "valide" | "rejete") {
    if (!selected || !token) return;
    if (decision === "rejete" && !note.trim()) {
      toast.warning("Indiquez un motif de rejet pour le client.");
      return;
    }
    setSubmitting(true);
    try {
      await agentApi.kycDecide(token, selected.userId, selected.id, decision, note.trim());
      toast.success(decision === "valide" ? "Identité validée." : "Demande rejetée.");
      setNote("");
      await load();
    } catch (err) {
      toast.error(`Erreur : ${err}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLock(force = false) {
    if (!selected || !token) return;
    const wantsRelease = !!selected.lock?.lockedByMe;
    try {
      await agentApi.kycLock(token, selected.userId, selected.id, { force, release: wantsRelease });
      toast.success(wantsRelease ? "Verrou libéré." : "Verrou acquis (15 min).");
      await load();
    } catch (err) {
      const msg = String(err);
      if (msg.includes("verrou-occupe") && !force) {
        if (confirm("Demande verrouillée par un autre conseiller. Forcer la prise en main ?")) {
          await toggleLock(true);
        }
        return;
      }
      toast.error(`Erreur : ${err}`);
    }
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,87,0.12)", color: "var(--accent-primary)" }}>
            <ShieldCheck className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>KYC</h1>
            <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
              Vérifications d'identité
            </p>
          </div>
        </div>
        <button
          onClick={load}
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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, email, n° membre…"
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
        <div className="flex gap-2">
          {(["pending", "decided"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedId(null); }}
              className="flex-1 rounded-2xl transition active:scale-95"
              style={{
                minHeight: 40,
                background: tab === t ? "var(--accent-primary)" : "var(--surface-card)",
                color: tab === t ? "white" : "var(--ippoo-text-muted)",
                border: `1px solid ${tab === t ? "var(--accent-primary)" : "var(--line-hairline)"}`,
                fontSize: "0.82rem",
                fontWeight: 800,
              }}
            >
              {t === "pending" ? `En attente · ${pending.length}` : `Décidées · ${decided.length}`}
            </button>
          ))}
        </div>
      </div>

      {loading && filtered.length === 0 ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          art={<EmptyKycArt />}
          title={tab === "pending" ? "Pile KYC vide" : "Aucune décision"}
          hint={
            tab === "pending"
              ? "Bonne nouvelle — aucune vérification d'identité ne vous attend."
              : "Les décisions récentes (validations et rejets) apparaîtront ici."
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((k) => (
            <li key={k.id}>
              <button
                onClick={() => setSelectedId(k.id)}
                className="w-full text-left rounded-2xl p-3 active:scale-[0.99] transition"
                style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,87,0.12)", color: "var(--accent-primary)" }}>
                    <User className="w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--ippoo-text)" }}>{k.userName}</p>
                      <StatusBadge status={k.status} />
                    </div>
                    <p className="truncate mt-0.5" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
                      {TYPE_LABEL[k.type] ?? k.type} · {k.memberNumber || k.userEmail}
                    </p>
                    <p className="mt-0.5" style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>
                      {relTime(k.status === "pending" ? k.createdAt : (k.decidedAt ?? k.createdAt))}
                    </p>
                    {k.lock && (
                      <span
                        className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full"
                        style={{
                          background: k.lock.lockedByMe ? "#D4F4E2" : "#FFE6CC",
                          color: k.lock.lockedByMe ? "#0F7A47" : "#B85400",
                          fontSize: "0.66rem",
                          fontWeight: 800,
                        }}
                      >
                        <Lock className="w-3 h-3" />
                        {k.lock.lockedByMe ? "Verrouillé par moi" : `Pris par ${k.lock.agentMatricule}`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <KycSheet onClose={() => setSelectedId(null)}>
          <div className="px-5 pt-1 pb-5 space-y-5">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ippoo-text-muted)" }}>
                  {TYPE_LABEL[selected.type] ?? selected.type}
                </p>
                <h2 className="truncate" style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{selected.userName}</h2>
                <p className="truncate" style={{ fontSize: "0.82rem", color: "var(--ippoo-text-muted)" }}>
                  {selected.memberNumber || "—"} · {selected.userEmail || "—"}
                </p>
                <p className="mt-1" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)" }}>
                  Soumis {relTime(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => navigate(`/agent/clients/${selected.userId}`)}
                className="px-3 rounded-xl flex items-center gap-1.5 active:scale-95 transition"
                style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800, minHeight: 40 }}
              >
                Fiche <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </header>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selected.fields ?? {}).length === 0 ? (
                <p className="col-span-2" style={{ fontSize: "0.84rem", color: "var(--ippoo-text-muted)" }}>Aucun champ déclaré.</p>
              ) : Object.entries(selected.fields).map(([key, value]) => (
                <div key={key} className="rounded-2xl p-3" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
                  <p style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, color: "var(--ippoo-text-muted)" }}>
                    {key}
                  </p>
                  <p className="truncate" style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--ippoo-text)" }}>{value || "—"}</p>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ippoo-text-muted)" }}>Pièces jointes</p>
              {(!selected.docs || selected.docs.length === 0) ? (
                <p className="mt-1" style={{ fontSize: "0.84rem", color: "var(--ippoo-text-muted)" }}>Aucune pièce déposée.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selected.docs.map((d, i) => (
                    <li key={i}>
                      <a
                        href={d.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 rounded-2xl active:scale-95 transition ${d.url ? "" : "opacity-50 pointer-events-none"}`}
                        style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.85rem", minHeight: 48 }}
                      >
                        <FileText className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                        <span className="truncate">{d.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected.status === "pending" ? (
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p style={{ fontSize: "0.82rem", fontWeight: 800 }}>Décision conseiller</p>
                  <button
                    onClick={() => toggleLock(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-95 transition"
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      background: selected.lock?.lockedByMe ? "#D4F4E2" : selected.lock ? "#FFE6CC" : "var(--surface-card)",
                      color: selected.lock?.lockedByMe ? "#0F7A47" : selected.lock ? "#B85400" : "var(--ippoo-text)",
                      border: "1px solid var(--line-hairline)",
                    }}
                  >
                    {selected.lock?.lockedByMe ? (
                      <><Unlock className="w-3.5 h-3.5" /> Libérer</>
                    ) : selected.lock ? (
                      <><Lock className="w-3.5 h-3.5" /> Forcer ({selected.lock.agentMatricule})</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> Verrouiller 15 min</>
                    )}
                  </button>
                </div>
                {selected.lock && !selected.lock.lockedByMe && (
                  <p className="mb-2" style={{ fontSize: "0.74rem", color: "#B85400", fontWeight: 700 }}>
                    Verrou actif jusqu'à {new Date(selected.lock.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — décision bloquée tant que vous ne reprenez pas la main.
                  </p>
                )}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Note interne ou motif de rejet (visible par le client en cas de rejet)…"
                  className="mt-2 w-full px-3 py-3 rounded-2xl focus:outline-none resize-none"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)", fontSize: "16px" }}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => decide("rejete")}
                    disabled={submitting || Boolean(selected.lock && !selected.lock.lockedByMe)}
                    className="rounded-2xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition active:scale-[0.97]"
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      background: "#FFE2E7",
                      color: "#C0263A",
                      border: "1px solid rgba(192,38,58,0.18)",
                      minHeight: 48,
                    }}
                  >
                    <XCircle className="w-[18px] h-[18px]" /> Rejeter
                  </button>
                  <button
                    onClick={() => decide("valide")}
                    disabled={submitting || Boolean(selected.lock && !selected.lock.lockedByMe)}
                    className="rounded-2xl text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition active:scale-[0.97]"
                    style={{ fontSize: "0.88rem", fontWeight: 800, background: "#16B26A", minHeight: 48, boxShadow: "0 4px 12px rgba(22,178,106,0.25)" }}
                  >
                    <CheckCircle2 className="w-[18px] h-[18px]" /> Valider
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <p style={{ fontSize: "0.82rem", color: "var(--ippoo-text-muted)" }}>
                    Décidée {relTime(selected.decidedAt ?? "")}
                  </p>
                </div>
                {selected.decidedBy && (
                  <p className="mt-2" style={{ fontSize: "0.8rem", color: "var(--ippoo-text-muted)" }}>
                    Par <span style={{ color: "var(--ippoo-text)", fontWeight: 700 }}>{selected.decidedBy}</span>
                  </p>
                )}
                {selected.note && (
                  <p className="mt-2" style={{ fontSize: "0.85rem", color: "var(--ippoo-text)", opacity: 0.85 }}>
                    « {selected.note} »
                  </p>
                )}
              </div>
            )}
          </div>
        </KycSheet>
      )}
    </div>
  );
}

function KycSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
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
          animation: "slideUpKyc 220ms cubic-bezier(0.2,0.8,0.2,1)",
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
      <style>{`@keyframes slideUpKyc { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta =
    status === "valide" ? { label: "Validé", bg: "#D4F4E2", color: "#0F7A47", Icon: CheckCircle2 } :
    status === "rejete" ? { label: "Rejeté", bg: "#FFE2E7", color: "#C0263A", Icon: XCircle } :
                           { label: "En attente", bg: "#FFE6CC", color: "#B85400", Icon: Clock };
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
      style={{ background: meta.bg, color: meta.color, fontSize: "0.68rem", fontWeight: 800 }}
    >
      <Icon className="w-3 h-3" /> {meta.label}
    </span>
  );
}
