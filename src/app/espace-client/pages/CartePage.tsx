import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Copy, Check, Gift, Sparkles, AlertTriangle, Loader2, Wallet, CreditCard, Plus, Share2 } from "lucide-react";
import { share, canShare, hapticTap, hapticSuccess } from "../native";
import { useAuth } from "../AuthContext";
import { useApiData, formatXOF } from "../hooks";
import { api } from "../api";
import { MemberCard, type MemberCardData } from "../components/MemberCard";
import { openKkiapay } from "../kkiapay";
import { toast } from "sonner";

export function CartePage() {
  const { session, user } = useAuth();
  const meQ = useApiData((t) => api.me(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const billingQ = useApiData((t) => api.billing(t));
  const refQ = useApiData((t) => api.referral(t));

  const [qr, setQr] = useState<{ token: string; memberNumber: string } | null>(null);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationErr, setActivationErr] = useState<string | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  async function reloadQr() {
    if (!session?.access_token) return;
    try {
      const d = await api.qrToken(session.access_token);
      setQr(d);
      setQrErr(null);
    } catch (err) {
      setQrErr(err instanceof Error ? err.message : "Erreur");
    }
  }

  const profile = meQ.data?.profile;
  const contracts = contractsQ.data?.contracts ?? [];
  const hasActiveContract = contracts.some((c) => c.status === "active");
  const cardActive = !!profile?.cardActive;
  const ready = cardActive && hasActiveContract;

  useEffect(() => {
    if (!session?.access_token || !ready) { setQr(null); return; }
    let cancelled = false;
    api.qrToken(session.access_token)
      .then((d) => { if (!cancelled) setQr(d); })
      .catch((err) => { if (!cancelled) setQrErr(err instanceof Error ? err.message : "Erreur"); });
    return () => { cancelled = true; };
  }, [session?.access_token, ready]);

  async function activate() {
    if (!session?.access_token) return;
    setActivating(true);
    setActivationErr(null);
    try {
      const init = await api.activateMemberCard(session.access_token, profile?.phone);
      if (init.payment && init.kkiapay && init.payment.mode === "kkiapay" && init.kkiapay.publicKey) {
        const result = await openKkiapay({
          amount: init.payment.amount,
          publicKey: init.kkiapay.publicKey,
          sandbox: init.kkiapay.sandbox,
          phone: profile?.phone ?? "",
          email: profile?.email ?? "",
          name: profile?.name ?? "",
          paymentId: init.payment.id,
          userId: user?.id ?? "",
        });
        if (!result.ok) {
          setActivationErr(`Paiement non finalisé : ${result.reason}`);
          return;
        }
        toast.success("Paiement reçu, activation en cours…", { description: "La carte sera active après vérification KkiaPay." });
      } else if (init.payment) {
        // Sandbox fallback (no KkiaPay key)
        await api.confirmPaymentMock(session.access_token, init.payment.id);
        toast.success("Carte activée (sandbox)");
      }
      await Promise.all([meQ.reload(), billingQ.reload()]);
    } catch (err) {
      setActivationErr(err instanceof Error ? err.message : "Erreur d'activation");
    } finally {
      setActivating(false);
    }
  }

  const composedFullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  const name = composedFullName || profile?.name || (user?.user_metadata?.name as string | undefined) || user?.email || "";

  const activeContract = contracts.find((c) => c.status === "active");
  const expiresMs = activeContract?.endDate ? new Date(activeContract.endDate).getTime() : undefined;
  const subscriptionStatus: "active" | "expired" | "none" = activeContract
    ? (expiresMs && expiresMs < Date.now() ? "expired" : "active")
    : (contracts.some((c) => c.status === "expired") ? "expired" : "none");
  const mm = (d?: string) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return undefined;
    return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getFullYear()).slice(-2)}`;
  };
  const rawId = (profile?.memberNumber ?? "").replace(/\D/g, "").padStart(12, "0").slice(-12);
  const prettyId = rawId.length === 12
    ? `${rawId.slice(0, 4)}-${rawId.slice(4, 8)}-${rawId.slice(8, 12)}`
    : (profile?.memberNumber ?? " ");
  const cardData: MemberCardData = {
    accountId: rawId,
    prettyId,
    qrPayload: qr?.token ?? prettyId,
    fullName: name,
    organization: activeContract?.product,
    city: [profile?.city, profile?.department].filter(Boolean).join(" · ") || undefined,
    memberSince: mm(profile?.cardIssuedAt ?? profile?.createdAt),
    expiresOn: mm(activeContract?.endDate),
    planName: "MEMBRE",
    role: "member",
    bioEnabled: false,
    subscriptionStatus,
    subscriptionExpiresAt: expiresMs,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="t-title1">Ma carte IPPOO</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>
          Présentez cette carte chez nos partenaires santé.
        </p>
      </header>

      {!hasActiveContract && (
        <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE2E7] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#FF3B57]" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "1rem", fontWeight: 800 }}>Souscrivez pour obtenir votre carte</p>
              <p className="text-[#555] mt-1" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
                Votre carte membre IPPOO vous est attribuée dès que vous activez une couverture d'assurance.
              </p>
              <Link
                to="/espace-client/souscription"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white"
                style={{ background: "#FF3B57", fontWeight: 800, fontSize: "0.88rem" }}
              >
                <Sparkles className="w-4 h-4" /> Souscrire à une assurance
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasActiveContract && !cardActive && (
        <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1D9] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "1rem", fontWeight: 800 }}>Activer ma carte membre</p>
              <p className="text-[#555] mt-1" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
                500 FCFA / mois carte digitale avec QR signé pour la connexion et l'accès aux partenaires.
              </p>
              {activationErr && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2" style={{ fontSize: "0.85rem" }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {activationErr}
                </div>
              )}
              <button
                onClick={activate}
                disabled={activating}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
                style={{ background: "#FF3B57", fontWeight: 800, fontSize: "0.88rem" }}
              >
                {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {activating ? "Activation..." : "Activer la carte (500 FCFA)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ready && (
        <>
          <MemberCard data={cardData} onRegenerate={reloadQr} />
          {qrErr && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2" style={{ fontSize: "0.85rem" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {qrErr}
            </div>
          )}
        </>
      )}

      {/* Billing breakdown */}
      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#DDE7FF] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#2A6BFF]" />
          </div>
          <div>
            <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Facturation mensuelle</p>
            <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>500 FCFA / jour × 31 jours par couverture, +1 000 gestion, +500 carte.</p>
          </div>
        </div>
        {billingQ.loading && <p className="text-[#666]" style={{ fontSize: "0.85rem" }}>Calcul en cours…</p>}
        {billingQ.data && (
          <>
            <ul className="divide-y divide-black/5">
              {billingQ.data.items.map((it, i) => (
                <li key={`${it.kind}-${it.contractId ?? i}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p style={{ fontSize: "0.88rem", fontWeight: 700 }}>{it.label}</p>
                    {it.perDay && (
                      <p className="text-[#666]" style={{ fontSize: "0.74rem" }}>
                        {it.perDay} FCFA × {it.days} jours
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>{formatXOF(it.amount)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
              <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Total mensuel</p>
              <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#FF3B57" }}>{formatXOF(billingQ.data.total)}</p>
            </div>
            <Link
              to="/espace-client/cotisations"
              className="mt-4 inline-flex items-center gap-2 text-[#FF3B57]"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              Payer mes cotisations →
            </Link>
          </>
        )}
      </section>

      {ready && refQ.data?.code && (
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3B57] to-[#FF7A00] text-white flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Code parrainage</p>
              <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>
                {refQ.data.count} filleul{refQ.data.count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 rounded-xl bg-[#F5F6FA] text-center" style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "0.15em", fontFamily: "ui-monospace, monospace" }}>
              {refQ.data.code}
            </code>
            <button
              onClick={async () => {
                hapticTap();
                try { await navigator.clipboard.writeText(refQ.data!.code); setRefCopied(true); hapticSuccess(); setTimeout(() => setRefCopied(false), 1500); } catch {}
              }}
              className="px-4 py-3 rounded-xl text-white inline-flex items-center gap-2"
              style={{ background: "#FF3B57", fontWeight: 700, fontSize: "0.85rem" }}
            >
              {refCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {refCopied ? "Copié" : "Copier"}
            </button>
            {canShare() && (
              <button
                onClick={async () => {
                  hapticTap();
                  await share({
                    title: "Rejoins-moi sur IPPOO",
                    text: `Utilise mon code parrainage ${refQ.data!.code} pour profiter d'avantages sur IPPOO Assurance.`,
                    url: typeof window !== "undefined" ? `${window.location.origin}/espace-client/inscription?ref=${encodeURIComponent(refQ.data!.code)}` : undefined,
                  });
                }}
                className="px-4 py-3 rounded-xl inline-flex items-center gap-2"
                style={{ background: "var(--surface-card)", border: "1px solid var(--line-strong)", color: "var(--ippoo-text)", fontWeight: 700, fontSize: "0.85rem" }}
                aria-label="Partager"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#FFF7E6] border border-[#FF7A00]/20 rounded-2xl p-5">
        <p style={{ fontSize: "0.9rem", fontWeight: 800 }}>Comment utiliser ma carte ?</p>
        <p className="text-[#555] mt-1.5" style={{ fontSize: "0.85rem" }}>
          Présentez votre carte (physique ou digitale) chez un partenaire IPPOO pour bénéficier du tiers payant.
          Le QR signé permet aussi de vous connecter sans mot de passe depuis un autre appareil.
        </p>
      </div>
    </div>
  );
}

function WalletButtons() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  async function openGoogleWallet() {
    if (!session?.access_token || busy) return;
    setBusy(true);
    try {
      const res = await api.walletGoogle(session.access_token);
      if (!res.configured || !res.saveUrl) {
        toast.info("Google Wallet sera bientôt disponible");
        return;
      }
      window.open(res.saveUrl, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={openGoogleWallet}
        disabled={busy}
        className="inline-flex items-center gap-2 active:opacity-80 disabled:opacity-60"
        style={{
          minHeight: "44px",
          padding: "0 16px",
          borderRadius: "var(--radius-sm)",
          background: "#0E1320",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <Wallet className="w-[16px] h-[16px]" /> Ajouter à Google Wallet
      </button>
      <button
        type="button"
        onClick={() => toast.info("Apple Wallet bientôt disponible")}
        className="inline-flex items-center gap-2 active:opacity-80"
        style={{
          minHeight: "44px",
          padding: "0 16px",
          borderRadius: "var(--radius-sm)",
          background: "var(--surface-card)",
          border: "1px solid var(--line-strong)",
          color: "var(--ippoo-text)",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <Wallet className="w-[16px] h-[16px]" /> Apple Wallet
      </button>
    </div>
  );
}
