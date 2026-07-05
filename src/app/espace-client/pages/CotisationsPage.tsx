import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { getSupabase } from "../supabaseClient";
import { CreditCard, Plus, Smartphone, FileText } from "lucide-react";
import { Invoice } from "../components/Invoice";
import { PaymentCalendar } from "../components/PaymentCalendar";
import type { Payment } from "../api";
import { Modal } from "../Modal";
import { useAuth } from "../AuthContext";
import { useApiData, formatXOF, formatDate } from "../hooks";
import { api } from "../api";
import { StatusBadge } from "./DashboardPage";
import { toast } from "sonner";
import { RowSkeleton } from "../Skeleton";
import { EmptyState } from "../EmptyState";
import { MoMoDialog } from "../MoMoDialog";
import { openKkiapay } from "../kkiapay";
import { hapticSuccess, hapticError } from "../native";

const METHODS = [
  { id: "mobile_money", label: "Mobile Money (MTN / Moov)" },
  { id: "carte", label: "Carte bancaire" },
  { id: "agence", label: "Paiement en agence" },
];

export function CotisationsPage() {
  const { session } = useAuth();
  const payQ = useApiData((t) => api.payments(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const meQ = useApiData((t) => api.me(t));
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);
  const invoiceContract = useMemo(
    () => (invoicePayment?.contractId ? contractsQ.data?.contracts.find((c) => c.id === invoicePayment.contractId) ?? null : null),
    [invoicePayment, contractsQ.data?.contracts],
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", method: METHODS[0].id, contractId: "" });
  const [momoOpen, setMomoOpen] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

  // Realtime : si le webhook KKiaPay confirme un paiement pendant que
  // l'utilisateur consulte cette page, on rafraîchit le calendrier sans
  // qu'il ait à tirer la liste.
  const reloadRef = useRef(payQ.reload);
  reloadRef.current = payQ.reload;
  const uid = session?.user?.id;
  useEffect(() => {
    if (!uid) return;
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    let pulseT: any = null;
    const ch = sb.channel(`payments:user:${uid}`)
      .on("broadcast", { event: "payments:dirty" }, () => {
        setLivePulse(true);
        if (pulseT) clearTimeout(pulseT);
        pulseT = setTimeout(() => setLivePulse(false), 2000);
        if (t) clearTimeout(t);
        t = setTimeout(() => reloadRef.current(), 1200);
      })
      .subscribe();
    return () => { if (t) clearTimeout(t); sb.removeChannel(ch); };
  }, [uid]);

  async function commitPayment(method: string) {
    if (!session?.access_token) return;
    const amount = Number(form.amount);
    await api.createPayment(session.access_token, { amount, method, contractId: form.contractId || undefined });
    setForm({ amount: "", method: METHODS[0].id, contractId: "" });
    setOpen(false);
    await payQ.reload();
    hapticSuccess();
    toast.success("Paiement confirmé", { description: `${formatXOF(amount)} reçus.` });
  }

  // Real Mobile Money via KkiaPay: initiate (server creates a pending payment),
  // open the widget, and on success the webhook will mark it confirmed.
  // When no KKIAPAY_PUBLIC_KEY is set, the server returns mode="mock" and we
  // fall back to the MoMoDialog UI + confirm-mock route.
  async function commitMobileMoney(phone?: string) {
    if (!session?.access_token) return;
    const amount = Number(form.amount);
    const { payment, kkiapay } = await api.initiatePayment(session.access_token, {
      amount,
      contractId: form.contractId || undefined,
      phone,
    });
    if (payment.mode === "kkiapay" && kkiapay.publicKey) {
      const res = await openKkiapay({
        amount,
        publicKey: kkiapay.publicKey,
        sandbox: kkiapay.sandbox,
        phone,
        paymentId: payment.id,
        userId: session.user.id,
      });
      if (!res.ok) throw new Error(res.reason);
      // Webhook confirms server-side; refresh after a short delay.
      setTimeout(() => { payQ.reload(); }, 1500);
    } else {
      // Mock path
      await api.confirmPaymentMock(session.access_token, payment.id);
    }
    setForm({ amount: "", method: METHODS[0].id, contractId: "" });
    setOpen(false);
    await payQ.reload();
    hapticSuccess();
    toast.success("Paiement confirmé", { description: `${formatXOF(amount)} reçus.` });
  }

  async function payPending(p: Payment) {
    if (!session?.access_token) return;
    try {
      const { payment, kkiapay } = await api.initiatePayment(session.access_token, {
        amount: p.amount,
        contractId: p.contractId || undefined,
        paymentId: p.id,
        purpose: p.purpose,
        phone: meQ.data?.profile?.phone,
      });
      if (payment.mode === "kkiapay" && kkiapay.publicKey) {
        const res = await openKkiapay({
          amount: p.amount,
          publicKey: kkiapay.publicKey,
          sandbox: kkiapay.sandbox,
          phone: meQ.data?.profile?.phone ?? "",
          email: meQ.data?.profile?.email ?? "",
          name: meQ.data?.profile?.name ?? "",
          paymentId: payment.id,
          userId: session.user.id,
        });
        if (!res.ok) {
          toast.error("Paiement non finalisé", { description: res.reason });
          return;
        }
        hapticSuccess();
        toast.success("Paiement en cours de validation", { description: "Confirmation après vérification KkiaPay." });
        setTimeout(() => { payQ.reload(); }, 1500);
      } else {
        await api.confirmPaymentMock(session.access_token, payment.id);
        toast.success("Paiement confirmé (sandbox)");
      }
      await payQ.reload();
    } catch (err) {
      hapticError();
      toast.error("Échec du paiement", { description: err instanceof Error ? err.message : "" });
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError("Montant invalide"); return; }
    setError(null);
    if (form.method === "mobile_money") {
      setMomoOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      await commitPayment(form.method);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du paiement";
      setError(msg);
      toast.error("Échec du paiement", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const total = (payQ.data?.payments ?? []).filter((p) => p.status === "confirme").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="t-title1 inline-flex items-center gap-2">
            Cotisations
            <span
              aria-label={livePulse ? "Live" : "En attente"}
              className={livePulse ? "animate-pulse" : ""}
              style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: livePulse ? "#16B26A" : "rgba(0,0,0,0.2)",
              }}
            />
          </h1>
          <p className="mt-1 text-[#666] break-words" style={{ fontSize: "0.9rem" }}>Total versé : <strong>{formatXOF(total)}</strong></p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white w-full sm:w-auto shrink-0" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
          <Plus className="w-4 h-4" /> Nouvelle cotisation
        </button>
      </header>

      {!payQ.loading && (payQ.data?.payments.length ?? 0) > 0 && (
        <PaymentCalendar
          payments={(payQ.data?.payments ?? []) as any}
          title="Suivi de mes prélèvements"
          subtitle="Vos paiements jour par jour"
        />
      )}

      {payQ.loading && (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
          <RowSkeleton /><RowSkeleton /><RowSkeleton />
        </div>
      )}
      {payQ.error && <p className="text-red-600">{payQ.error}</p>}
      {!payQ.loading && (payQ.data?.payments.length ?? 0) === 0 && (
        <EmptyState
          icon={CreditCard}
          tone="blue"
          title="Aucune cotisation"
          description="Versez votre première cotisation en Mobile Money pour activer pleinement votre couverture."
          action={
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white" style={{ background: "#FF3B57", fontSize: "0.85rem", fontWeight: 800 }}>
              <Plus className="w-4 h-4" /> Payer une cotisation
            </button>
          }
        />
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        {payQ.data?.payments.map((p, idx) => (
          <div key={p.id} className={`p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 ${idx > 0 ? "border-t border-black/5" : ""}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-[#DDE7FF] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#2A6BFF]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{formatXOF(p.amount)}</p>
                <p className="text-[#666] truncate" style={{ fontSize: "0.75rem" }}>{p.method} · {formatDate(p.createdAt)}</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <StatusBadge status={p.status} />
              {p.status === "en_attente" && (
                <button
                  onClick={() => payPending(p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FF3B57] text-white hover:opacity-90"
                  style={{ fontSize: "0.72rem", fontWeight: 700 }}
                >
                  <Smartphone className="w-3 h-3" /> Payer
                </button>
              )}
              {p.status === "confirme" && (
                <button
                  onClick={() => setInvoicePayment(p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E1320] text-white hover:opacity-90"
                  style={{ fontSize: "0.72rem", fontWeight: 700 }}
                  aria-label="Voir la facture"
                >
                  <FileText className="w-3 h-3" /> Reçu
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {invoicePayment && (
        <Invoice
          open
          onClose={() => setInvoicePayment(null)}
          payment={invoicePayment}
          profile={meQ.data?.profile ?? null}
          contract={invoiceContract}
        />
      )}

      <MoMoDialog
        open={momoOpen}
        amount={Number(form.amount) || 0}
        onCancel={() => setMomoOpen(false)}
        onConfirmed={async ({ phone }) => {
          try { await commitMobileMoney(phone); }
          catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur";
            toast.error("Échec du paiement", { description: msg });
            throw err;
          }
          setMomoOpen(false);
        }}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle cotisation">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Montant (FCFA)</label>
                <input type="number" min="100" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#2A6BFF]" />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Mode de paiement</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#2A6BFF] bg-white">
                  {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              {(contractsQ.data?.contracts.length ?? 0) > 0 && (
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Contrat (optionnel)</label>
                  <select value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#2A6BFF] bg-white">
                    <option value="">  Aucun  </option>
                    {contractsQ.data?.contracts.map((c) => <option key={c.id} value={c.id}>{c.product}</option>)}
                  </select>
                </div>
              )}
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>{error}</div>}
              <button type="submit" disabled={submitting} className="w-full px-6 py-3.5 rounded-xl text-white disabled:opacity-60" style={{ background: "#FF3B57", fontWeight: 800 }}>
                {submitting ? "Traitement..." : form.method === "mobile_money" ? "Continuer vers Mobile Money" : "Confirmer le paiement"}
              </button>
            </form>
      </Modal>
    </div>
  );
}
