import { FileText, Download, FolderOpen, Search, Receipt } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { useApiData, formatDate, formatXOF } from "../hooks";
import { api, type Payment, type Document } from "../api";
import { RowSkeleton } from "../Skeleton";
import { Invoice } from "../components/Invoice";
import { drawDocumentHeader, drawDocumentFooter, loadLogoDataUrl, TEXT_DARK, TEXT_MUTED } from "../pdfBranding";

const CATEGORIES = ["Tous", "Contrat", "Attestation", "Facture", "Sinistre", "Autre"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// Génère et télécharge un PDF brandé reprenant les informations du document.
async function downloadDocumentPdf(d: Document) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadLogoDataUrl();
  drawDocumentHeader(doc, {
    logo,
    title: d.category || "Document",
    reference: d.id.slice(-8).toUpperCase(),
    subtitle: formatDate(d.createdAt),
  });

  let y = 66;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(doc.splitTextToSize(d.name, 178), 16, y);
  y += 14;

  const rows: [string, string][] = [
    ["Catégorie", d.category],
    ["Type", d.type],
    ["Taille", formatSize(d.size)],
    ["Émis le", formatDate(d.createdAt)],
  ];
  doc.setFontSize(10.5);
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${k} :`, 16, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(v), 52, y);
    y += 8;
  }

  drawDocumentFooter(doc, "Document généré depuis votre espace assuré IPPOO.");
  doc.save(`${(d.name || "document").replace(/[^\w.-]+/g, "_")}.pdf`);
}

export function DocumentsPage() {
  const q = useApiData((t) => api.documents(t));
  const paymentsQ = useApiData((t) => api.payments(t));
  const contractsQ = useApiData((t) => api.contracts(t));
  const meQ = useApiData((t) => api.me(t));
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);

  const docs = useMemo(() => {
    const list = q.data?.documents ?? [];
    return list.filter((d) => (cat === "Tous" || d.category === cat) && d.name.toLowerCase().includes(search.toLowerCase()));
  }, [q.data, cat, search]);

  const receipts = useMemo(() => {
    const list = (paymentsQ.data?.payments ?? []).filter((p) => p.status === "confirme");
    const s = search.toLowerCase();
    return list.filter((p) =>
      (cat === "Tous" || cat === "Facture") &&
      (!s || p.method.toLowerCase().includes(s) || p.id.toLowerCase().includes(s)),
    );
  }, [paymentsQ.data, cat, search]);

  const invoiceContract = useMemo(
    () => (invoicePayment?.contractId ? contractsQ.data?.contracts.find((c) => c.id === invoicePayment.contractId) ?? null : null),
    [invoicePayment, contractsQ.data?.contracts],
  );

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="t-title1">Documents</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>Vos contrats, attestations et factures, regroupés en un seul endroit.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-black/5 focus:outline-none focus:border-[#FF3B57]"
            style={{ fontSize: "0.9rem" }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors"
              style={{
                background: cat === c ? "#0E1320" : "white",
                color: cat === c ? "white" : "#333",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {q.loading && (
        <div className="bg-white rounded-2xl border border-black/5 divide-y divide-black/5 overflow-hidden">
          <RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton />
        </div>
      )}
      {q.error && <p className="text-red-600">{q.error}</p>}
      {!q.loading && docs.length === 0 && receipts.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 text-[#FF7A00]" />
          <p style={{ fontSize: "1rem", fontWeight: 800 }}>Aucun document</p>
        </div>
      )}

      {receipts.length > 0 && (
        <>
          <h2 className="mt-2 mb-3" style={{ fontSize: "1rem", fontWeight: 900 }}>Factures &amp; reçus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {receipts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: "linear-gradient(135deg,#FF3B57,#FF7A00)" }}>
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800 }}>Facture {formatXOF(p.amount)}</p>
                    <p className="text-[#666] truncate" style={{ fontSize: "0.75rem" }}>
                      INV-{p.id.slice(-8).toUpperCase()} · {p.method}
                    </p>
                  </div>
                </div>
                <p className="text-[#666] mb-4" style={{ fontSize: "0.75rem" }}>Émise le {formatDate(p.createdAt)}</p>
                <button
                  onClick={() => setInvoicePayment(p)}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black/10 hover:border-[#FF3B57] hover:text-[#FF3B57] transition-colors"
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  <FileText className="w-4 h-4" /> Voir la facture
                </button>
              </div>
            ))}
          </div>
          {docs.length > 0 && <h2 className="mb-3" style={{ fontSize: "1rem", fontWeight: 900 }}>Autres documents</h2>}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFE8D1] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#B85400]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: "0.95rem", fontWeight: 800 }}>{d.name}</p>
                <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>{d.category} · {formatSize(d.size)}</p>
              </div>
            </div>
            <p className="text-[#666] mb-4" style={{ fontSize: "0.75rem" }}>Ajouté le {formatDate(d.createdAt)}</p>
            <button
              onClick={async () => {
                try {
                  await downloadDocumentPdf(d);
                } catch {
                  toast.error("Téléchargement impossible pour le moment.");
                }
              }}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black/10 hover:border-[#FF3B57] hover:text-[#FF3B57] transition-colors"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
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
    </div>
  );
}
