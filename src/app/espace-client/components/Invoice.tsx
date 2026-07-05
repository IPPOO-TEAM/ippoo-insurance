import { useEffect } from "react";
import { Download, Printer, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logoIppoo from "../../../imports/Plan_de_travail72-4.png";
import type { Payment, Profile, Contract } from "../api";
import { formatXOF, formatDate } from "../hooks";

export const INVOICE_RED = "#D84332";

export interface InvoiceLine {
  no: number;
  label: string;
  description?: string;
  qty: number;
  unitPrice: number;
}

export function buildInvoiceLines(payment: Payment, contract?: Contract | null): InvoiceLine[] {
  if (contract) {
    return [{
      no: 1,
      label: `Cotisation – ${contract.product}`,
      description: contract.frequency ? `Fréquence ${contract.frequency}` : undefined,
      qty: 1,
      unitPrice: payment.amount,
    }];
  }
  return [{
    no: 1,
    label: "Cotisation IPPOO",
    description: payment.method ? `Méthode : ${payment.method.replace("_", " ")}` : undefined,
    qty: 1,
    unitPrice: payment.amount,
  }];
}

export function Invoice({
  open, onClose, payment, profile, contract,
}: {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  profile: Profile | null;
  contract?: Contract | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const lines = buildInvoiceLines(payment, contract);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const total = subtotal;
  const invoiceNumber = `INV-${payment.id.slice(-8).toUpperCase()}`;
  const issuedOn = new Date(payment.createdAt);
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.name || profile?.email || "—";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-3 sm:p-6 bg-black/60 ippoo-invoice-root">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .ippoo-invoice-root, .ippoo-invoice-root * { visibility: visible !important; }
          .ippoo-invoice-root { position: absolute; inset: 0; background: white !important; padding: 0 !important; overflow: visible !important; }
          .ippoo-invoice-toolbar, .ippoo-invoice-backdrop { display: none !important; }
          .ippoo-invoice-paper { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>
      <button aria-label="Fermer" onClick={onClose} className="ippoo-invoice-backdrop absolute inset-0" />

      <div className="ippoo-invoice-paper relative w-full max-w-[820px] bg-white rounded-2xl shadow-2xl overflow-hidden my-4">
        {/* Toolbar */}
        <div className="ippoo-invoice-toolbar absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/10 text-[#0E1320] shadow-sm hover:bg-[#F5F6FA]"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            <Download className="w-3.5 h-3.5" /> Télécharger
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/10 text-[#0E1320] shadow-sm hover:bg-[#F5F6FA]"
            style={{ fontSize: "0.78rem", fontWeight: 700 }}
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer
          </button>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-black/10 text-[#0E1320] shadow-sm hover:bg-[#F5F6FA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HEADER — logo left, big title right */}
        <header className="px-7 sm:px-12 pt-10 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <img src={logoIppoo} alt="IPPOO" style={{ width: 130, height: "auto", objectFit: "contain" }} />
              <p className="mt-3" style={{ fontSize: "0.92rem", fontWeight: 900, letterSpacing: "-0.005em", color: "#191923" }}>
                IPPOO ASSURANCE
              </p>
              <p className="text-[#8a8a8a]" style={{ fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                Micro-assurance · Afrique
              </p>
            </div>
            <div className="text-right">
              <h1 style={{ fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#191923" }}>
                FACTURE
              </h1>
              <p className="mt-1 text-[#9a9a9a]" style={{ fontSize: "0.78rem" }}>#{invoiceNumber}</p>
            </div>
          </div>

          <div className="mt-6 h-px bg-black/10" />

          {/* INVOICE TO + meta panel */}
          <div className="mt-5 flex flex-col sm:flex-row gap-5 items-stretch">
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.85rem", fontWeight: 900, color: "#191923" }}>FACTURÉ À :</p>
              <p className="mt-1" style={{ fontSize: "0.92rem", fontWeight: 800, color: "#191923" }}>{fullName}</p>
              {profile?.email && <p className="text-[#777]" style={{ fontSize: "0.8rem" }}>{profile.email}</p>}
              {profile?.phone && <p className="text-[#777]" style={{ fontSize: "0.8rem" }}>{profile.phone}</p>}
              {[profile?.quartier, profile?.city, profile?.department, profile?.country].filter(Boolean).length > 0 && (
                <p className="text-[#777]" style={{ fontSize: "0.8rem" }}>
                  {[profile?.quartier, profile?.city, profile?.department, profile?.country].filter(Boolean).join(", ")}
                </p>
              )}
              {profile?.memberNumber && <p className="text-[#777]" style={{ fontSize: "0.8rem" }}>N° membre : {profile.memberNumber}</p>}
            </div>

            <div className="relative bg-[#F2F3F7] rounded-md flex" style={{ minWidth: 280 }}>
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: INVOICE_RED }} />
              <div className="flex-1 grid grid-cols-2 gap-3 px-5 py-3">
                <div>
                  <p className="text-[#191923]" style={{ fontSize: "0.78rem", fontWeight: 800 }}>N° Facture</p>
                  <p className="text-[#777]" style={{ fontSize: "0.78rem" }}>{invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[#191923]" style={{ fontSize: "0.78rem", fontWeight: 800 }}>Date d'émission</p>
                  <p className="text-[#777]" style={{ fontSize: "0.78rem" }}>{formatDate(issuedOn.toISOString())}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Items table */}
        <div className="px-7 sm:px-12">
          <div className="overflow-hidden">
            <div
              className="grid grid-cols-[40px_1fr_92px_60px_110px] sm:grid-cols-[52px_1fr_120px_70px_130px] text-white px-4 py-3"
              style={{ background: INVOICE_RED, fontSize: "0.78rem", fontWeight: 900, letterSpacing: "0.04em" }}
            >
              <span>NO</span>
              <span>ITEM DESCRIPTION</span>
              <span className="text-right">PRIX</span>
              <span className="text-right">QTÉ</span>
              <span className="text-right">TOTAL</span>
            </div>
            {lines.map((l, i) => (
              <div
                key={l.no}
                className={`grid grid-cols-[40px_1fr_92px_60px_110px] sm:grid-cols-[52px_1fr_120px_70px_130px] px-4 py-4 items-start ${i % 2 === 0 ? "bg-[#F7F8FA]" : "bg-white"}`}
                style={{ fontSize: "0.84rem" }}
              >
                <span className="text-[#888]" style={{ fontWeight: 700 }}>{String(l.no).padStart(2, "0")}.</span>
                <div className="min-w-0">
                  <p className="truncate text-[#191923]" style={{ fontWeight: 800 }}>{l.label}</p>
                  {l.description && <p className="text-[#9a9a9a] truncate mt-0.5" style={{ fontSize: "0.74rem" }}>{l.description}</p>}
                </div>
                <span className="text-right text-[#191923]">{formatXOF(l.unitPrice)}</span>
                <span className="text-right text-[#777]">{l.qty}</span>
                <span className="text-right text-[#191923]" style={{ fontWeight: 800 }}>{formatXOF(l.qty * l.unitPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: payment + terms left, totals right */}
        <div className="px-7 sm:px-12 pt-8 pb-10 grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 900, color: "#191923" }}>Méthode de paiement</p>
              <p className="text-[#777] mt-1" style={{ fontSize: "0.8rem" }}>
                {payment.method.replace("_", " ").replace(/^./, (s) => s.toUpperCase())}
              </p>
              <p className="text-[#9a9a9a]" style={{ fontSize: "0.74rem" }}>Réf. {payment.id}</p>
              <p className="text-[#9a9a9a]" style={{ fontSize: "0.74rem" }}>
                Statut :{" "}
                <span style={{ color: payment.status === "confirme" ? "#0F7A47" : payment.status === "echec" ? "#C0263A" : "#B36B00", fontWeight: 800 }}>
                  {payment.status}
                </span>
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 900, color: "#191923" }}>Conditions</p>
              <p className="text-[#777] mt-1" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                Facture éditée automatiquement à la confirmation du paiement. Aucun timbre exigé. Pour toute réclamation, contactez-nous via votre espace client.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="w-full space-y-1.5 text-right" style={{ fontSize: "0.85rem" }}>
              <div className="flex justify-between text-[#777]">
                <span>Sous-total :</span>
                <span style={{ fontWeight: 700, color: "#191923" }}>{formatXOF(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#777]">
                <span>Taxes :</span>
                <span style={{ fontWeight: 700, color: "#191923" }}>{formatXOF(0)}</span>
              </div>
            </div>
            <div
              className="w-full mt-3 text-white px-5 py-3 flex items-center justify-between"
              style={{ background: INVOICE_RED }}
            >
              <span style={{ fontSize: "0.92rem", fontWeight: 800, letterSpacing: "0.04em" }}>TOTAL :</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{formatXOF(total)}</span>
            </div>
          </div>
        </div>

        {/* Signature + thank you + footer line */}
        <div className="px-7 sm:px-12 pb-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div>
            <p className="text-[#777]" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
              Merci d'avoir choisi IPPOO Assurance. Nous restons à vos côtés pour protéger ce qui compte vraiment.
            </p>
            <div className="mt-5 inline-block">
              <p style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontStyle: "italic" }}>IPPOO</p>
              <div className="h-px w-40 bg-black/30 mt-0.5" />
              <p className="mt-1" style={{ fontSize: "0.85rem", fontWeight: 800, color: "#191923" }}>Équipe IPPOO</p>
              <p className="text-[#888]" style={{ fontSize: "0.74rem" }}>Service souscriptions</p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end items-start gap-3">
            <p style={{ fontFamily: "Georgia, serif", fontSize: "1.05rem", fontStyle: "italic", fontWeight: 700, color: INVOICE_RED }}>
              Merci de votre confiance !
            </p>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[#888]" style={{ fontSize: "0.68rem" }}>Vérifier l'authenticité</p>
              </div>
              <div className="p-1.5 bg-white border border-black/10 rounded-lg">
                <QRCodeSVG
                  value={`ippoo:invoice:${invoiceNumber}:member:${profile?.memberNumber ?? "—"}:total:${total}:date:${issuedOn.toISOString().slice(0, 10)}`}
                  size={70} level="M" bgColor="#ffffff" fgColor="#0E1320"
                />
              </div>
            </div>
            <p className="text-[#888]" style={{ fontSize: "0.72rem" }}>
              ☎ +229 01 41 52 10 92 &nbsp;·&nbsp; ✉ contact@ippoo.bj
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
