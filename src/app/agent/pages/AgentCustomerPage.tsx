import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getSupabase } from "../../espace-client/supabaseClient";
import {
  Mail, Phone, MapPin, FileText, AlertTriangle, CreditCard, Users, FolderOpen,
  MessageCircle, RefreshCw, Bell, Calendar, Hash, UserCog, Banknote, Tag, X, CheckCircle2, FilePlus2, Pencil, Upload, Eye, Trash2, Download,
} from "lucide-react";
import { useAuth } from "../../espace-client/AuthContext";
import { agentApi, type Customer360 } from "../api";
import { UserAvatar } from "../../espace-client/components/UserAvatar";
import { downloadDevis } from "../devisPdf";
import { downloadAttestation } from "../../espace-client/attestationPdf";
import { toCsv, downloadCsv } from "../csv";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatFcfa(n?: number) {
  if (typeof n !== "number") return "—";
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export function AgentCustomerPage() {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [data, setData] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [peers, setPeers] = useState<{ matricule: string; userId: string; name: string }[]>([]);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "agence" | "virement" | "carte">("cash");
  const [payNote, setPayNote] = useState("");
  const [payContract, setPayContract] = useState("");
  const [subOpen, setSubOpen] = useState(false);
  const [subBusy, setSubBusy] = useState(false);
  const [subProduct, setSubProduct] = useState("");
  const [subFrequency, setSubFrequency] = useState<"mensuel" | "trimestriel" | "annuel">("mensuel");
  const [subNote, setSubNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; address: string; city: string; department: string; country: string; profession: string }>({
    name: "", phone: "", address: "", city: "", department: "", country: "", profession: "",
  });
  function openEdit() {
    const p = data?.profile ?? {};
    setEditForm({
      name: p.name ?? "",
      phone: p.phone ?? "",
      address: p.address ?? "",
      city: p.city ?? "",
      department: p.department ?? "",
      country: p.country ?? "",
      profession: p.profession ?? "",
    });
    setEditOpen(true);
  }
  async function saveEdit() {
    if (!token || !uid) return;
    setEditBusy(true);
    try {
      await agentApi.updateClientProfile(token, uid, editForm);
      setEditOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise à jour");
    } finally { setEditBusy(false); }
  }
  async function doDevis() {
    if (!data) return;
    const product = subProduct.trim();
    if (product.length < 2) { setError("Saisissez un nom de produit pour le devis."); return; }
    try {
      const me = await agentApi.me(token);
      const agent = me.agent ?? { matricule: "—", username: "Conseiller IPPOO" };
      const p = data.profile ?? {};
      await downloadDevis({
        prospect: { name: p.name || p.email || "Prospect", email: p.email, phone: p.phone, memberNumber: p.memberNumber },
        product,
        frequency: subFrequency,
        agent: { matricule: agent.matricule, name: agent.username },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de génération du devis");
    }
  }
  async function doSubscribe() {
    if (!token || !uid) return;
    const product = subProduct.trim();
    if (product.length < 2) return;
    setSubBusy(true);
    try {
      await agentApi.subscribeForUser(token, uid, { product, frequency: subFrequency, note: subNote });
      setSubOpen(false);
      setSubProduct(""); setSubNote(""); setSubFrequency("mensuel");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de souscription");
    } finally { setSubBusy(false); }
  }
  async function doManualPayment() {
    if (!token || !uid) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    setPayBusy(true);
    try {
      await agentApi.recordManualPayment(token, uid, { amount, method: payMethod, contractId: payContract || undefined, note: payNote });
      setPayOpen(false);
      setPayAmount(""); setPayNote(""); setPayContract("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'encaissement");
    } finally { setPayBusy(false); }
  }

  async function openReassign() {
    if (!token) return;
    setReassignOpen(true);
    if (!peers.length) {
      try {
        const res = await agentApi.peers(token);
        setPeers(res.peers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement des conseillers");
      }
    }
  }

  async function doReassign(targetMatricule: string | null) {
    if (!token || !uid) return;
    setReassignBusy(true);
    try {
      await agentApi.updateMeta(token, uid, { assignee: targetMatricule });
      setReassignOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de réassignation");
    } finally {
      setReassignBusy(false);
    }
  }

  async function reload() {
    if (!token || !uid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agentApi.customer360(token, uid);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token, uid]);

  // Realtime : si un webhook KKiaPay confirme un paiement de ce client pendant
  // qu'un conseiller consulte sa fiche, on rafraîchit le Customer360 pour que
  // les montants/transactions soient à jour sans recharger manuellement.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    if (!uid) return;
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    const ch = sb.channel(`payments:user:${uid}`)
      .on("broadcast", { event: "payments:dirty" }, () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => reloadRef.current(), 1500);
      })
      .subscribe();
    return () => { if (t) clearTimeout(t); sb.removeChannel(ch); };
  }, [uid]);

  // Présence conseiller côté client (C6) : tant que la fiche du user est
  // ouverte par un agent, on rejoint le canal `chat:<uid>` et on track
  // role="conseiller". L'espace client lit ce presenceState pour afficher
  // « En ligne » dans la messagerie. Aucun message envoyé — juste la présence.
  useEffect(() => {
    if (!uid) return;
    const sb = getSupabase();
    if (!sb) return;
    const ch = sb.channel(`chat:${uid}`, {
      config: { presence: { key: `agent-${uid}` }, broadcast: { self: false } },
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ role: "conseiller", joinedAt: new Date().toISOString() });
      }
    });
    return () => {
      try { ch.untrack(); } catch { /* noop */ }
      sb.removeChannel(ch);
    };
  }, [uid]);

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" style={{ color: "var(--ippoo-text-muted)" }}>
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-center" style={{ color: "var(--ippoo-text-muted)" }}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--accent-primary)" }} />
        <p style={{ fontSize: "0.9rem" }}>{error}</p>
        <button
          onClick={reload}
          className="mt-3 rounded-2xl active:scale-95 transition"
          style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", fontSize: "0.85rem", fontWeight: 800, minHeight: 44, minWidth: 120 }}
        >
          Réessayer
        </button>
      </div>
    );
  }
  if (!data) return null;

  const p = data.profile ?? {};
  const activeContracts = (data.contracts ?? []).filter((c) => c.status === "active");
  const pendingClaims = (data.claims ?? []).filter((cl) => ["soumis", "en_cours", "en_examen"].includes(cl.status));
  const totalPaid = (data.payments ?? []).filter((pay) => pay.status === "confirme").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Retour"
        >
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>‹</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate" style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Fiche client
          </h1>
        </div>
        <button
          onClick={() => setSubOpen(true)}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Souscrire"
          title="Souscription assistée"
        >
          <FilePlus2 className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => setPayOpen(true)}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Encaisser"
          title="Encaissement manuel"
        >
          <Banknote className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={openReassign}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Réassigner"
          title={`Assigné à : ${data?.conversationMeta?.assignee ?? "—"}`}
        >
          <UserCog className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={reload}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Recharger"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Identity card */}
      <div
        className="relative rounded-3xl p-4 overflow-hidden mb-3"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--line-hairline)",
          boxShadow: "0 8px 24px rgba(14,19,32,0.05)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg,#FF3B57 0%,#FF7A00 60%,#FFB020 100%)" }}
        />
        <div className="flex items-start gap-3 pt-1">
          <UserAvatar url={p.avatarUrl} name={p.name} email={p.email} size="lg" />
          <button
            onClick={openEdit}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
            title="Modifier les coordonnées"
            aria-label="Modifier les coordonnées"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate" style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.015em" }}>
              {p.name || p.email || "Client"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {p.memberNumber && (
                <p
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    background: "rgba(255,59,87,0.10)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Hash className="w-3 h-3" /> {p.memberNumber}
                </p>
              )}
              {p.kycVerified && (
                <p
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    background: "rgba(22,178,106,0.12)",
                    color: "#0F7A47",
                  }}
                  title={p.kycVerifiedAt ? `Vérifié le ${new Date(p.kycVerifiedAt).toLocaleDateString("fr-FR")}` : "Identité vérifiée"}
                >
                  <CheckCircle2 className="w-3 h-3" /> ID VÉRIFIÉE
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <ContactLine icon={Mail} value={p.email} />
          <ContactLine icon={Phone} value={p.phone} />
          {/* A12 — Deep-links direct WhatsApp/téléphone. Le numéro est
              normalisé en E.164 (chiffres + 229 préfixe Bénin par défaut)
              pour que wa.me et tel: fonctionnent même si le profil
              contient des espaces. */}
          {p.phone && (
            <div className="flex gap-2 mt-1">
              <a
                href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl active:scale-95 transition"
                style={{ minHeight: 40, fontSize: "0.8rem", fontWeight: 800, background: "var(--surface-app)", border: "1px solid var(--line-hairline)", color: "var(--ippoo-text)" }}
              >
                <Phone className="w-3.5 h-3.5" /> Appeler
              </a>
              <a
                href={`https://wa.me/${p.phone.replace(/[^\d]/g, "").replace(/^0/, "229")}`}
                target="_blank" rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl active:scale-95 transition text-white"
                style={{ minHeight: 40, fontSize: "0.8rem", fontWeight: 800, background: "#25D366" }}
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          )}
          <ContactLine icon={MapPin} value={[p.city, p.department, p.country].filter(Boolean).join(", ")} />
        </div>
        {p.createdAt && (
          <p className="mt-2.5 inline-flex items-center gap-1" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            <Calendar className="w-3 h-3" /> Membre depuis {formatDate(p.createdAt)}
          </p>
        )}
        <Link
          to="/agent/inbox"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl active:scale-[0.98] transition"
          style={{
            fontSize: "0.88rem",
            fontWeight: 800,
            color: "white",
            background: "var(--accent-primary)",
            minHeight: 48,
            boxShadow: "0 6px 16px rgba(255,59,87,0.25)",
          }}
        >
          <MessageCircle className="w-4 h-4" /> Ouvrir la messagerie
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Kpi icon={FileText} label="Contrats actifs" value={String(activeContracts.length)} color="#FF3B57" />
        <Kpi icon={AlertTriangle} label="Sinistres en cours" value={String(pendingClaims.length)} color="#FF7A00" />
        <Kpi icon={CreditCard} label="Total payé" value={formatFcfa(totalPaid)} color="#16B26A" />
        <Kpi icon={Bell} label="Alertes" value={String(data.unreadNotifications)} color="#C2410C" />
      </div>

      {/* Stacked sections */}
      <div className="space-y-3">
        <MetaSection
          uid={uid}
          token={token}
          status={data.conversationMeta?.status ?? "ouvert"}
          tags={data.conversationMeta?.tags ?? []}
          onChanged={reload}
        />
        <NotesSection uid={uid} token={token} />
        <QuickTaskSection uid={uid} token={token} />
        <Section title="Contrats" icon={FileText} count={data.contracts.length}>
          {data.contracts.length === 0 ? (
            <Empty text="Aucun contrat." />
          ) : (
            <>
              <ul className="divide-y" style={{ borderColor: "var(--line-hairline)" }}>
                {data.contracts.map((c) => (
                  <ContractRow key={c.id} contract={c} uid={uid} token={token} profile={p} onChanged={reload} />
                ))}
              </ul>
              <ExportButton
                label="Exporter les contrats (CSV)"
                onClick={() => {
                  const csv = toCsv(
                    data.contracts.map((c: any) => ({
                      id: c.id,
                      product: c.product,
                      status: c.status,
                      startDate: c.startDate ?? "",
                      endDate: c.endDate ?? "",
                      premium: c.premium ?? "",
                      frequency: c.frequency ?? "",
                      subscribedBy: c.subscribedBy ?? "",
                      nextBillingDate: c.nextBillingDate ?? "",
                    })),
                    [
                      { key: "id", label: "ID" },
                      { key: "product", label: "Produit" },
                      { key: "status", label: "Statut" },
                      { key: "startDate", label: "Début" },
                      { key: "endDate", label: "Fin" },
                      { key: "premium", label: "Prime" },
                      { key: "frequency", label: "Fréquence" },
                      { key: "subscribedBy", label: "Souscrit par" },
                      { key: "nextBillingDate", label: "Prochain prélèv." },
                    ],
                  );
                  const slug = (p.name || p.memberNumber || uid).toString().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  downloadCsv(`IPPOO_contrats_${slug}.csv`, csv);
                }}
              />
            </>
          )}
        </Section>

        <Section title="Sinistres" icon={AlertTriangle} count={data.claims.length}>
          {data.claims.length === 0 ? (
            <Empty text="Aucun sinistre." />
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--line-hairline)" }}>
              {data.claims.slice(0, 6).map((cl) => (
                <li key={cl.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{cl.type}</p>
                    <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>{formatDate(cl.createdAt)}{typeof cl.amount === "number" ? ` · ${formatFcfa(cl.amount)}` : ""}</p>
                  </div>
                  <Badge label={cl.status} color="#8A5A00" bg="rgba(255,176,32,0.14)" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Paiements récents" icon={CreditCard} count={data.payments.length}>
          {data.payments.length === 0 ? (
            <Empty text="Aucun paiement." />
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--line-hairline)" }}>
              {data.payments.slice(0, 6).map((pay) => (
                <li key={pay.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{formatFcfa(pay.amount)}</p>
                    <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>{pay.method || "—"} · {formatDate(pay.createdAt)}</p>
                  </div>
                  <Badge
                    label={pay.status === "confirme" ? "Confirmé" : pay.status === "en_attente" ? "En attente" : pay.status}
                    color={pay.status === "confirme" ? "#0F7A47" : "#8A5A00"}
                    bg={pay.status === "confirme" ? "rgba(22,178,106,0.12)" : "rgba(255,176,32,0.14)"}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <BeneficiariesSection uid={uid} token={token} beneficiaries={data.beneficiaries} onChanged={reload} />

        <DocumentsSection uid={uid} token={token} documents={data.documents} onChanged={reload} />


        <Section title="Derniers messages" icon={MessageCircle} count={data.lastMessages.length}>
          {data.lastMessages.length === 0 ? (
            <Empty text="Aucun échange." />
          ) : (
            <ul className="space-y-2">
              {data.lastMessages.slice().reverse().map((m) => (
                <li key={m.id} className="flex gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded-md h-fit shrink-0"
                    style={{
                      background: m.from === "conseiller" ? "rgba(255,59,87,0.10)" : "rgba(14,19,32,0.06)",
                      color: m.from === "conseiller" ? "var(--accent-primary)" : "var(--ippoo-text-muted)",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {m.from === "conseiller" ? "AGENT" : "CLIENT"}
                  </span>
                  <p className="min-w-0 line-clamp-2" style={{ fontSize: "0.82rem", lineHeight: 1.4 }}>{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {payOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !payBusy && setPayOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>Encaissement manuel</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
              Le paiement est marqué confirmé immédiatement et tracé à votre matricule.
            </p>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Montant (FCFA)</label>
            <input
              type="number" min="100" inputMode="numeric"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
            />
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Méthode</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            >
              <option value="cash">Espèces</option>
              <option value="agence">Paiement en agence</option>
              <option value="virement">Virement bancaire</option>
              <option value="carte">Carte bancaire</option>
            </select>
            {(data.contracts ?? []).length > 0 && (
              <>
                <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Contrat (optionnel)</label>
                <select
                  value={payContract}
                  onChange={(e) => setPayContract(e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded-xl"
                  style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
                >
                  <option value="">Aucun</option>
                  {(data.contracts ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.product}</option>)}
                </select>
              </>
            )}
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Note (optionnelle)</label>
            <input
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Reçu n°, observation…"
              className="w-full mb-3 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPayOpen(false)}
                disabled={payBusy}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface-app)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                Annuler
              </button>
              <button
                onClick={doManualPayment}
                disabled={payBusy || !payAmount || Number(payAmount) <= 0}
                className="flex-1 px-3 py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: "#16B26A", color: "white", fontSize: "0.85rem", fontWeight: 800 }}
              >
                {payBusy ? "…" : "Encaisser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !editBusy && setEditOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>Modifier les coordonnées</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
              Email et n° de membre ne peuvent être modifiés que par le client lui-même.
            </p>
            {(["name", "phone", "address", "city", "department", "country", "profession"] as const).map((f) => (
              <div key={f} className="mb-2">
                <label className="block mb-1" style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "capitalize" }}>
                  {f === "name" ? "Nom complet" : f === "phone" ? "Téléphone" : f === "address" ? "Adresse" : f === "city" ? "Ville" : f === "department" ? "Département" : f === "country" ? "Pays" : "Profession"}
                </label>
                <input
                  value={(editForm as any)[f]}
                  onChange={(e) => setEditForm((s) => ({ ...s, [f]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl"
                  style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
                />
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditOpen(false)}
                disabled={editBusy}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface-app)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={editBusy}
                className="flex-1 px-3 py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                {editBusy ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {subOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !subBusy && setSubOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>Souscription assistée</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
              Le contrat est créé au nom du client et tracé à votre matricule.
            </p>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Produit</label>
            <input
              value={subProduct}
              onChange={(e) => setSubProduct(e.target.value)}
              placeholder="Ex. IPPOO Santé, IPPOO Famille…"
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
            />
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Fréquence</label>
            <select
              value={subFrequency}
              onChange={(e) => setSubFrequency(e.target.value as any)}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            >
              <option value="mensuel">Mensuelle</option>
              <option value="trimestriel">Trimestrielle</option>
              <option value="annuel">Annuelle</option>
            </select>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Note (optionnelle)</label>
            <input
              value={subNote}
              onChange={(e) => setSubNote(e.target.value)}
              placeholder="Contexte, canal, observation…"
              className="w-full mb-3 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            />
            <button
              onClick={doDevis}
              disabled={subBusy || subProduct.trim().length < 2}
              className="w-full mb-2 px-3 py-2.5 rounded-xl disabled:opacity-50"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.85rem", fontWeight: 800 }}
            >
              Télécharger un devis (PDF)
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setSubOpen(false)}
                disabled={subBusy}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface-app)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                Annuler
              </button>
              <button
                onClick={doSubscribe}
                disabled={subBusy || subProduct.trim().length < 2}
                className="flex-1 px-3 py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.85rem", fontWeight: 800 }}
              >
                {subBusy ? "…" : "Activer le contrat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reassignOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !reassignBusy && setReassignOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>Réassigner la conversation</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.8rem", color: "var(--ippoo-text-muted)" }}>
              Conseiller actuel : <strong>{data?.conversationMeta?.assignee ?? "—"}</strong>
            </p>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              <button
                onClick={() => doReassign(null)}
                disabled={reassignBusy}
                className="w-full text-left px-3 py-2.5 rounded-xl active:scale-[0.99] transition"
                style={{ border: "1px solid var(--line-hairline)", fontSize: "0.85rem", fontWeight: 700 }}
              >
                Libérer la conversation (aucun conseiller)
              </button>
              {peers.map((p) => (
                <button
                  key={p.matricule}
                  onClick={() => doReassign(p.matricule)}
                  disabled={reassignBusy}
                  className="w-full text-left px-3 py-2.5 rounded-xl active:scale-[0.99] transition flex items-center justify-between gap-2"
                  style={{ border: "1px solid var(--line-hairline)", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  <span className="truncate">{p.name || "—"}</span>
                  <span className="shrink-0" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)", fontWeight: 800 }}>{p.matricule}</span>
                </button>
              ))}
              {peers.length === 0 && (
                <p className="py-4 text-center" style={{ fontSize: "0.8rem", color: "var(--ippoo-text-muted)" }}>
                  Chargement…
                </p>
              )}
            </div>
            <button
              onClick={() => setReassignOpen(false)}
              disabled={reassignBusy}
              className="mt-3 w-full px-3 py-2.5 rounded-xl"
              style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.85rem", fontWeight: 800 }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value?: string }) {
  if (!value) return null;
  return (
    <p
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl truncate"
      style={{ fontSize: "0.82rem", background: "rgba(14,19,32,0.04)", fontWeight: 600 }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
      <span className="truncate">{value}</span>
    </p>
  );
}

function Kpi({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1A`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="truncate" style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ippoo-text-muted)" }}>{label}</p>
      </div>
      <p className="mt-1.5 truncate" style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.015em" }}>{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: { title: string; icon: typeof FileText; count: number; children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-4"
      style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
    >
      <div className="flex items-center gap-2 mb-2 pb-2.5" style={{ borderBottom: "1px solid var(--line-hairline)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)" }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h2 style={{ fontSize: "0.92rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h2>
        <span
          className="ml-auto px-2 py-0.5 rounded-full"
          style={{
            background: count > 0 ? "rgba(255,59,87,0.10)" : "rgba(14,19,32,0.05)",
            color: count > 0 ? "var(--accent-primary)" : "var(--ippoo-text-muted)",
            fontSize: "0.68rem",
            fontWeight: 800,
          }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full shrink-0 capitalize" style={{ background: bg, color, fontSize: "0.68rem", fontWeight: 800 }}>{label}</span>
  );
}

function MetaSection({
  uid, token, status, tags, onChanged,
}: { uid: string; token: string; status: string; tags: string[]; onChanged: () => void | Promise<void> }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const STATUSES: { value: string; label: string; color: string; bg: string }[] = [
    { value: "ouvert", label: "Ouvert", color: "#8A5A00", bg: "rgba(255,176,32,0.18)" },
    { value: "en_cours", label: "En cours", color: "#1D4ED8", bg: "rgba(29,78,216,0.12)" },
    { value: "resolu", label: "Résolu", color: "#0F7A47", bg: "rgba(22,178,106,0.14)" },
  ];
  async function setStatus(s: string) {
    if (busy || s === status) return;
    setBusy(true);
    try {
      await agentApi.updateMeta(token, uid, { status: s });
      await onChanged();
    } finally { setBusy(false); }
  }
  async function addTag() {
    const t = draft.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24);
    if (!t || busy || tags.includes(t)) { setDraft(""); return; }
    setBusy(true);
    try {
      await agentApi.updateMeta(token, uid, { tags: [...tags, t] });
      setDraft("");
      await onChanged();
    } finally { setBusy(false); }
  }
  async function removeTag(t: string) {
    if (busy) return;
    setBusy(true);
    try {
      await agentApi.updateMeta(token, uid, { tags: tags.filter((x) => x !== t) });
      await onChanged();
    } finally { setBusy(false); }
  }
  return (
    <section className="rounded-3xl p-3" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
      <header className="flex items-center justify-between mb-2 px-1">
        <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>Suivi conversation</p>
        {busy && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: "var(--ippoo-text-muted)" }} />}
      </header>
      <div className="flex gap-1.5 mb-3">
        {STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              disabled={busy}
              className="flex-1 px-2 py-2 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-1"
              style={{
                background: active ? s.bg : "var(--surface-app)",
                color: active ? s.color : "var(--ippoo-text-muted)",
                border: active ? "1px solid transparent" : "1px solid var(--line-hairline)",
                fontSize: "0.78rem",
                fontWeight: 800,
                minHeight: 40,
              }}
            >
              {active && <CheckCircle2 className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mb-2 px-1">
        <Tag className="w-3 h-3" style={{ color: "var(--ippoo-text-muted)" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ippoo-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Tags
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.length === 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--ippoo-text-muted)" }}>Aucun tag.</span>
        )}
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)", fontSize: "0.72rem", fontWeight: 800 }}
          >
            {t}
            <button
              onClick={() => removeTag(t)}
              disabled={busy}
              aria-label={`Retirer ${t}`}
              className="rounded-full hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="Nouveau tag (ex. urgent, vip, relance)"
          className="flex-1 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
        />
        <button
          onClick={addTag}
          disabled={!draft.trim() || busy}
          className="px-3 py-2 rounded-xl disabled:opacity-50"
          style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.78rem", fontWeight: 800 }}
        >
          Ajouter
        </button>
      </div>
    </section>
  );
}

function QuickTaskSection({ uid, token }: { uid: string; token: string }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await agentApi.createTask(token, {
        title: title.trim(),
        dueAt: due ? new Date(due + "T09:00:00").toISOString() : null,
        userId: uid,
      });
      toast.success("Tâche créée et liée à ce client.");
      setTitle(""); setDue("");
    } catch (err) {
      toast.error(`Erreur : ${err}`);
    } finally { setBusy(false); }
  }
  return (
    <section className="rounded-3xl p-3" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
      <header className="flex items-center justify-between mb-2 px-1">
        <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>Nouvelle tâche liée</p>
        <button
          onClick={() => navigate("/agent/taches")}
          style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-primary)" }}
        >
          Voir mes tâches →
        </button>
      </header>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex. Rappeler avant 17h, demander pièce CNI…"
        className="w-full mb-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "14px" }}
        />
        <button
          onClick={create}
          disabled={!title.trim() || busy}
          className="px-3 py-2 rounded-xl disabled:opacity-50"
          style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.78rem", fontWeight: 800 }}
        >
          Créer
        </button>
      </div>
    </section>
  );
}

type Note = { id: string; text: string; authorMatricule: string; authorName: string; createdAt: string };

function NotesSection({ uid, token }: { uid: string; token: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    if (!token || !uid) return;
    try {
      const res = await agentApi.listNotes(token, uid);
      setNotes(res.notes);
    } catch { /* ignore */ }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [uid, token]);
  async function add() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await agentApi.addNote(token, uid, draft.trim());
      setDraft("");
      await reload();
    } finally { setBusy(false); }
  }
  async function remove(noteId: string) {
    if (!window.confirm("Supprimer cette note ?")) return;
    setBusy(true);
    try {
      await agentApi.deleteNote(token, uid, noteId);
      await reload();
    } finally { setBusy(false); }
  }
  return (
    <section className="rounded-3xl p-3" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
      <header className="flex items-center justify-between mb-2 px-1">
        <p style={{ fontSize: "0.85rem", fontWeight: 800 }}>Notes internes</p>
        <span style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)", fontWeight: 700 }}>
          {notes.length} note(s) · privées
        </span>
      </header>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ajouter une note (visible uniquement par les conseillers)…"
        rows={2}
        className="w-full mb-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
      />
      <button
        onClick={add}
        disabled={!draft.trim() || busy}
        className="px-3 py-2 rounded-xl disabled:opacity-50"
        style={{ background: "var(--ippoo-text)", color: "var(--surface-card)", fontSize: "0.78rem", fontWeight: 800 }}
      >
        Ajouter
      </button>
      {notes.length > 0 && (
        <ul className="space-y-2 mt-3">
          {notes.slice().reverse().map((n) => (
            <li key={n.id} className="rounded-2xl p-2.5" style={{ background: "var(--surface-app)" }}>
              <p style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{n.text}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>
                  {n.authorName} · {n.authorMatricule} · {new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <button
                  onClick={() => remove(n.id)}
                  className="px-2 py-0.5 rounded-md"
                  style={{ fontSize: "0.66rem", color: "#B42318", fontWeight: 800 }}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BeneficiariesSection({
  uid, token, beneficiaries, onChanged,
}: { uid: string; token: string; beneficiaries: any[]; onChanged: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", relation: "conjoint", birthDate: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  function startCreate() { setEditing(null); setForm({ name: "", relation: "conjoint", birthDate: "" }); setErr(null); setOpen(true); }
  function startEdit(b: any) {
    setEditing(b);
    setForm({ name: b.name ?? "", relation: b.relation ?? "autre", birthDate: b.birthDate ?? "" });
    setErr(null); setOpen(true);
  }
  async function save() {
    if (form.name.trim().length < 2) { setErr("Nom trop court."); return; }
    setBusy(true); setErr(null);
    try {
      if (editing) {
        await agentApi.updateCustomerBeneficiary(token, uid, editing.id, {
          name: form.name.trim(), relation: form.relation, birthDate: form.birthDate || null,
        });
      } else {
        await agentApi.addCustomerBeneficiary(token, uid, {
          name: form.name.trim(), relation: form.relation, birthDate: form.birthDate || null,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }
  async function remove(b: any) {
    if (!window.confirm(`Retirer ${b.name} des bénéficiaires ?`)) return;
    try { await agentApi.deleteCustomerBeneficiary(token, uid, b.id); await onChanged(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "Erreur"); }
  }
  return (
    <>
      <Section title="Bénéficiaires" icon={Users} count={beneficiaries.length}>
        <button
          onClick={startCreate}
          className="w-full mb-2 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition"
          style={{ background: "var(--surface-app)", border: "1px dashed var(--line-hairline)", minHeight: 44, fontSize: "0.82rem", fontWeight: 800 }}
        >
          <FilePlus2 className="w-4 h-4" /> Ajouter un bénéficiaire
        </button>
        {beneficiaries.length === 0 ? (
          <Empty text="Aucun bénéficiaire ajouté." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line-hairline)" }}>
            {beneficiaries.map((b) => (
              <li key={b.id} className="py-2.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{b.name}</p>
                  <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
                    {b.relation}{b.birthDate ? ` · ${formatDate(b.birthDate)}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(b)}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
                  style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
                  aria-label="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(b)}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
                  style={{ background: "rgba(180,35,24,0.08)", color: "#B42318" }}
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>{editing ? "Modifier le bénéficiaire" : "Ajouter un bénéficiaire"}</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
              Le client est notifié à chaque ajout / modification / suppression.
            </p>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Nom complet</label>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
            />
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Relation</label>
            <select
              value={form.relation}
              onChange={(e) => setForm((s) => ({ ...s, relation: e.target.value }))}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            >
              <option value="conjoint">Conjoint(e)</option>
              <option value="enfant">Enfant</option>
              <option value="pere">Père</option>
              <option value="mere">Mère</option>
              <option value="frere">Frère</option>
              <option value="soeur">Sœur</option>
              <option value="autre">Autre</option>
            </select>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Date de naissance (optionnelle)</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((s) => ({ ...s, birthDate: e.target.value }))}
              className="w-full mb-3 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            />
            {err && <p className="mb-2" style={{ fontSize: "0.78rem", color: "#B42318" }}>{err}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface-app)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={busy || form.name.trim().length < 2}
                className="flex-1 px-3 py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.85rem", fontWeight: 800 }}
              >
                {busy ? "…" : editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocumentsSection({
  uid, token, documents, onChanged,
}: { uid: string; token: string; documents: any[]; onChanged: () => void | Promise<void> }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<string>("autre");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  function reset() { setFile(null); setLabel(""); setKind("autre"); setErr(null); if (fileRef.current) fileRef.current.value = ""; }
  async function send() {
    if (!file) { setErr("Sélectionnez un fichier."); return; }
    setBusy(true); setErr(null);
    try {
      await agentApi.uploadCustomerDocument(token, uid, file, label.trim() || file.name, kind);
      setOpen(false); reset();
      await onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }
  async function view(path: string) {
    try {
      const { url } = await agentApi.customerDocumentUrl(token, uid, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) { window.alert(e instanceof Error ? e.message : "Erreur"); }
  }
  async function remove(d: any) {
    if (!window.confirm(`Supprimer « ${d.name} » des documents du client ?`)) return;
    try { await agentApi.deleteCustomerDocument(token, uid, d.id); await onChanged(); }
    catch (e) { window.alert(e instanceof Error ? e.message : "Erreur"); }
  }
  return (
    <>
      <Section title="Documents" icon={FolderOpen} count={documents.length}>
        <button
          onClick={() => setOpen(true)}
          className="w-full mb-2 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition"
          style={{ background: "var(--surface-app)", border: "1px dashed var(--line-hairline)", minHeight: 44, fontSize: "0.82rem", fontWeight: 800 }}
        >
          <Upload className="w-4 h-4" /> Déposer un document pour le client
        </button>
        {documents.length === 0 ? (
          <Empty text="Aucun document partagé." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line-hairline)" }}>
            {documents.slice(0, 12).map((d) => (
              <li key={d.id} className="py-2.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{d.name || d.type || "Document"}</p>
                  <p className="truncate" style={{ fontSize: "0.72rem", color: "var(--ippoo-text-muted)" }}>
                    {formatDate(d.createdAt ?? d.uploadedAt)}
                    {d.uploadedByName ? ` · ${d.uploadedByName}` : ""}
                    {d.kind ? ` · ${d.kind}` : ""}
                  </p>
                </div>
                {d.path && (
                  <button
                    onClick={() => view(d.path)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
                    style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)" }}
                    aria-label="Ouvrir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {d.uploadedBy && (
                  <button
                    onClick={() => remove(d)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
                    style={{ background: "rgba(180,35,24,0.08)", color: "#B42318" }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(14,19,32,0.5)" }}
          onClick={() => !busy && (setOpen(false), reset())}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4"
            style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>Déposer un document</p>
            <p className="mt-1 mb-3" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
              Le client est notifié et retrouve le fichier dans son espace documents.
            </p>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Type</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "15px" }}
            >
              <option value="attestation">Attestation</option>
              <option value="contrat">Contrat</option>
              <option value="cni">Pièce d'identité</option>
              <option value="justificatif">Justificatif</option>
              <option value="facture">Facture / reçu</option>
              <option value="autre">Autre</option>
            </select>
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Libellé (optionnel)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Attestation IPPOO Santé 2026"
              className="w-full mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }}
            />
            <label className="block mb-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Fichier (10 Mo max)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full mb-3"
              style={{ fontSize: "13px" }}
            />
            {err && <p className="mb-2" style={{ fontSize: "0.78rem", color: "#B42318" }}>{err}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); reset(); }}
                disabled={busy}
                className="flex-1 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface-app)", fontSize: "0.85rem", fontWeight: 800 }}
              >
                Annuler
              </button>
              <button
                onClick={send}
                disabled={busy || !file}
                className="flex-1 px-3 py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.85rem", fontWeight: 800 }}
              >
                {busy ? "Envoi…" : "Déposer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ContractRow({
  contract: c, uid, token, profile, onChanged,
}: { contract: any; uid: string; token: string; profile: any; onChanged: () => void | Promise<void> }) {
  const [busy, setBusy] = useState<null | "renew" | "cancel" | "pdf">(null);
  async function doAttestation() {
    setBusy("pdf");
    try {
      await downloadAttestation(
        {
          name: profile?.name || profile?.email || "Membre IPPOO",
          id: profile?.memberNumber || uid.slice(0, 8),
          email: profile?.email,
          phone: profile?.phone,
        },
        c as any,
      );
    } catch (err) { window.alert(err instanceof Error ? err.message : "Erreur"); }
    finally { setBusy(null); }
  }
  const status = c.status as string;
  const statusBadge = status === "active"
    ? { label: "Actif", color: "#0F7A47", bg: "rgba(22,178,106,0.14)" }
    : status === "annule"
      ? { label: "Annulé", color: "#B42318", bg: "rgba(180,35,24,0.10)" }
      : status === "expired"
        ? { label: "Expiré", color: "#8A5A00", bg: "rgba(255,176,32,0.14)" }
        : { label: status, color: "var(--ippoo-text-muted)", bg: "rgba(14,19,32,0.06)" };
  async function doRenew() {
    if (!window.confirm(`Renouveler le contrat « ${c.product} » pour 12 mois ?`)) return;
    setBusy("renew");
    try { await agentApi.contractAction(token, uid, c.id, "renew"); await onChanged(); }
    catch (err) { window.alert(err instanceof Error ? err.message : "Erreur"); }
    finally { setBusy(null); }
  }
  async function doCancel() {
    const reason = window.prompt(`Motif de résiliation du contrat « ${c.product} » ?`, "");
    if (reason === null) return;
    if (reason.trim().length < 3) { window.alert("Motif requis (3 caractères min)."); return; }
    setBusy("cancel");
    try { await agentApi.contractAction(token, uid, c.id, "cancel", reason.trim()); await onChanged(); }
    catch (err) { window.alert(err instanceof Error ? err.message : "Erreur"); }
    finally { setBusy(null); }
  }
  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{c.product}</p>
          <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
            {c.id?.slice(0, 8)} · {formatDate(c.createdAt ?? c.startDate)}
            {c.endDate ? ` → ${formatDate(c.endDate)}` : ""}
          </p>
        </div>
        <Badge label={statusBadge.label} color={statusBadge.color} bg={statusBadge.bg} />
      </div>
      <div className="flex gap-2 mt-2">
        {status === "active" && (
          <button
            onClick={doAttestation}
            disabled={!!busy}
            className="flex-1 px-3 py-2 rounded-xl active:scale-[0.98] transition disabled:opacity-50"
            style={{ background: "rgba(22,178,106,0.12)", color: "#0F7A47", fontSize: "0.78rem", fontWeight: 800 }}
          >
            {busy === "pdf" ? "…" : "Attestation PDF"}
          </button>
        )}
        <button
          onClick={doRenew}
          disabled={!!busy}
          className="flex-1 px-3 py-2 rounded-xl active:scale-[0.98] transition disabled:opacity-50"
          style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800 }}
        >
          {busy === "renew" ? "…" : "Renouveler"}
        </button>
        {status === "active" && (
          <button
            onClick={doCancel}
            disabled={!!busy}
            className="flex-1 px-3 py-2 rounded-xl active:scale-[0.98] transition disabled:opacity-50"
            style={{ background: "rgba(180,35,24,0.08)", color: "#B42318", fontSize: "0.78rem", fontWeight: 800 }}
          >
            {busy === "cancel" ? "…" : "Résilier"}
          </button>
        )}
      </div>
    </li>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 w-full px-3 py-2 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2"
      style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800 }}
    >
      <Download className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-5 text-center" style={{ color: "var(--ippoo-text-muted)" }}>
      <p style={{ fontSize: "0.82rem", fontWeight: 600 }}>{text}</p>
    </div>
  );
}
