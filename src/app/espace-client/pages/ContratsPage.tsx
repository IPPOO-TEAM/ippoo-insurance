import { useMemo, useState } from "react";
import { FileText, Calendar, Repeat, RefreshCw, Loader2, Download, Info as InfoIcon, Clock, ShieldCheck } from "lucide-react";
import { usePricing } from "../../data/pricing";
import { benefitEligibility, formatEligibleDate, BENEFIT_QUALIFYING_MONTHS } from "../../lib/eligibility";
import { ProductDetailsModal } from "../components/ProductDetailsModal";
import { downloadAttestation } from "../attestationPdf";
import { useApiData, formatXOF, formatDate } from "../hooks";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { StatusBadge } from "./DashboardPage";
import { ListCardSkeleton } from "../Skeleton";
import { MoMoDialog } from "../MoMoDialog";
import { toast } from "sonner";
import { openKkiapay } from "../kkiapay";

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function ContratsPage() {
  const { session, user } = useAuth();
  const { data, loading, error, reload } = useApiData((t) => api.contracts(t));
  const meQ = useApiData((t) => api.me(t));
  const [renewing, setRenewing] = useState<string | null>(null);
  const [momoFor, setMomoFor] = useState<{ id: string; premium: number; product: string } | null>(null);
  const [detailsName, setDetailsName] = useState<string | null>(null);
  const { byName } = usePricing();
  const detailsProduct = useMemo(() => (detailsName ? byName(detailsName) : null), [byName, detailsName]);

  async function doRenew(id: string, phone?: string) {
    if (!session?.access_token) return;
    setRenewing(id);
    try {
      const init = await api.renewContract(session.access_token, id, phone);
      const profile = meQ.data?.profile;
      if (init.payment.mode === "kkiapay" && init.kkiapay.publicKey) {
        const result = await openKkiapay({
          amount: init.payment.amount,
          publicKey: init.kkiapay.publicKey,
          sandbox: init.kkiapay.sandbox,
          phone: phone ?? profile?.phone ?? "",
          email: profile?.email ?? "",
          name: profile?.name ?? "",
          paymentId: init.payment.id,
          userId: user?.id ?? "",
        });
        if (!result.ok) {
          toast.error("Paiement non finalisé", { description: result.reason });
          return;
        }
        toast.success("Paiement en cours de validation", { description: "Le renouvellement sera confirmé après vérification par KkiaPay." });
      } else {
        // Sandbox-only: server falls back to confirm-mock when no KkiaPay key
        await api.confirmPaymentMock(session.access_token, init.payment.id);
        toast.success("Renouvellement confirmé (sandbox)");
      }
      await reload();
    } catch (err) {
      toast.error("Renouvellement impossible", { description: err instanceof Error ? err.message : "" });
    } finally {
      setRenewing(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="t-title1">Mes contrats</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>Tous vos contrats IPPOO en un coup d'œil.</p>
      </header>

      {loading && (
        <div className="space-y-4">
          <ListCardSkeleton /><ListCardSkeleton />
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && data && data.contracts.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-black/5">
          <p className="text-[#666]">Vous n'avez aucun contrat pour l'instant.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.contracts.map((c) => {
          const dleft = daysUntil(c.endDate);
          const expiring = dleft <= 30 && dleft >= 0 && c.status === "active";
          const renewalPending = Boolean((c as any).pendingRenewalPaymentId);
          return (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#DBFBE7] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#16B26A]" />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 900 }}>{c.product}</p>
                    <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>Réf. {c.id}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDetailsName(c.product)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#0E1320] bg-[#F5F6FA] hover:bg-[#EAECF2]"
                  style={{ fontSize: "0.78rem", fontWeight: 700 }}
                >
                  <InfoIcon className="w-3.5 h-3.5" /> Garanties détaillées
                </button>
              <button
                onClick={() => {
                  const p = meQ.data?.profile;
                  downloadAttestation(
                    {
                      name: p?.name ?? (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "Membre IPPOO",
                      id: p?.id ?? user?.id ?? "",
                      phone: p?.phone,
                      email: p?.email ?? user?.email ?? undefined,
                    },
                    c,
                  );
                  toast.success("Attestation téléchargée");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#FF3B57] hover:bg-[#FFE2E7]"
                style={{ fontSize: "0.78rem", fontWeight: 700 }}
              >
                <Download className="w-3.5 h-3.5" /> Attestation PDF
              </button>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={Calendar} label="Début" value={formatDate(c.startDate)} />
                <Info icon={Calendar} label="Fin" value={formatDate(c.endDate)} />
                <Info icon={Repeat} label="Fréquence" value={c.frequency} />
                <Info label="Cotisation" value={formatXOF(c.premium)} />
              </dl>
              {(() => {
                const el = benefitEligibility(c.startDate);
                return el.eligible ? (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#E3F8EC", color: "#0F7A47", fontSize: "0.74rem", fontWeight: 800 }}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Bénéfices actifs
                  </div>
                ) : (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "#FFF7E6", border: "1px solid #FFE2B3" }}>
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#B85400" }} />
                    <p style={{ fontSize: "0.74rem", color: "#5C3A00", lineHeight: 1.45 }}>
                      Période de stage ({BENEFIT_QUALIFYING_MONTHS} mois) — bénéfices ouverts le <strong>{formatEligibleDate(el.eligibleAt)}</strong>
                    </p>
                  </div>
                );
              })()}
              {renewalPending && (
                <div className="mt-4 p-3 rounded-xl bg-[#E6F4FF] border border-[#1B6FB3]/20 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1B6FB3]" />
                  <p className="text-[#0E4A7E] flex-1" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                    Renouvellement en attente — paiement en cours de validation
                  </p>
                </div>
              )}
              {expiring && !renewalPending && (
                <div className="mt-4 p-3 rounded-xl bg-[#FFF1D9] border border-[#FF7A00]/20 flex items-center justify-between gap-3">
                  <p className="text-[#7A4500] flex-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    Expire dans {dleft} jour{dleft > 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setMomoFor({ id: c.id, premium: c.premium, product: c.product })}
                    disabled={renewing === c.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white disabled:opacity-60"
                    style={{ background: "#FF3B57", fontSize: "0.78rem", fontWeight: 800 }}
                  >
                    {renewing === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Renouveler 1-clic
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {detailsProduct && (
        <ProductDetailsModal product={detailsProduct} onClose={() => setDetailsName(null)} />
      )}

      <MoMoDialog
        open={!!momoFor}
        amount={momoFor?.premium ?? 0}
        onCancel={() => setMomoFor(null)}
        onConfirmed={async ({ phone }) => {
          if (!momoFor) return;
          setMomoFor(null);
          await doRenew(momoFor.id, phone);
        }}
      />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div>
      <p className="text-[#666] flex items-center gap-1" style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em" }}>
        {Icon ? <Icon className="w-3 h-3" /> : null}{label.toUpperCase()}
      </p>
      <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}
