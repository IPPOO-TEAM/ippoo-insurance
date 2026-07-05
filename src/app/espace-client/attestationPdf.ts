import { jsPDF } from "jspdf";
import type { Contract } from "./api";
import { formatXOF, formatDate } from "./hooks";
import {
  loadLogoDataUrl,
  drawDocumentHeader,
  drawDocumentFooter,
  IPPOO_RED,
  PANEL_GREY,
  ROW_GREY,
  TEXT_DARK,
  TEXT_MUTED,
} from "./pdfBranding";

interface Holder {
  name: string;
  id: string;
  phone?: string;
  email?: string;
}

export async function downloadAttestation(holder: Holder, contract: Contract) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;
  const contentW = W - M * 2;

  const logo = await loadLogoDataUrl();
  drawDocumentHeader(doc, {
    logo,
    title: "Attestation",
    reference: contract.id.toUpperCase(),
    subtitle: `Émis le ${formatDate(new Date().toISOString())}`,
  });

  let y = 58;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("ASSURÉ", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(holder.name, M, y + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  if (holder.email) doc.text(holder.email, M, y + 11);
  if (holder.phone) doc.text(holder.phone, M, y + 15.5);
  doc.text(`N° membre : ${holder.id}`, M, y + 20);

  const panelX = W / 2 + 6;
  const panelW = W - M - panelX;
  doc.setFillColor(...PANEL_GREY);
  doc.rect(panelX, y - 4, panelW, 26, "F");
  doc.setFillColor(...IPPOO_RED);
  doc.rect(panelX, y - 4, 1.6, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Référence contrat", panelX + 4, y);
  doc.text("Période de validité", panelX + panelW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(contract.id, panelX + 4, y + 5);
  doc.text(`${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`, panelX + panelW / 2, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Statut", panelX + 4, y + 13);
  doc.text("Fréquence", panelX + panelW / 2, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(contract.status, panelX + 4, y + 18);
  doc.text(contract.frequency ?? "—", panelX + panelW / 2, y + 18);

  y += 36;

  doc.setFillColor(...IPPOO_RED);
  doc.rect(M, y, contentW, 9, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("N°", M + 3, y + 6);
  doc.text("DÉSIGNATION", M + 14, y + 6);
  doc.text("PRIX", M + contentW - 56, y + 6, { align: "right" });
  doc.text("QTÉ", M + contentW - 28, y + 6, { align: "right" });
  doc.text("TOTAL", M + contentW - 3, y + 6, { align: "right" });
  y += 9;

  const rows = [{ label: contract.product, desc: `Cotisation ${contract.frequency ?? "mensuelle"}`, qty: 1, unit: contract.premium }];
  rows.forEach((r, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...ROW_GREY);
      doc.rect(M, y, contentW, 14, "F");
    }
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`0${i + 1}.`, M + 3, y + 6);
    doc.text(r.label, M + 14, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(r.desc, M + 14, y + 11);
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    doc.text(formatXOF(r.unit), M + contentW - 56, y + 8, { align: "right" });
    doc.text(String(r.qty), M + contentW - 28, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatXOF(r.unit * r.qty), M + contentW - 3, y + 8, { align: "right" });
    y += 14;
  });

  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("CERTIFICATION", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  const cert = doc.splitTextToSize(
    "IPPOO Assurance certifie que la personne désignée ci-dessus est titulaire d'un contrat d'assurance valide pour la période indiquée. Document à présenter en cas de contrôle.",
    contentW / 2 - 4,
  );
  doc.text(cert, M, y + 5);

  const totalsX = W - M - 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Sous-total", totalsX, y + 2);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatXOF(contract.premium), W - M, y + 2, { align: "right" });
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Taxes", totalsX, y + 8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatXOF(0), W - M, y + 8, { align: "right" });
  doc.setFillColor(...IPPOO_RED);
  doc.rect(totalsX - 3, y + 12, 70 + 3, 10, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", totalsX, y + 18.5);
  doc.text(formatXOF(contract.premium), W - M, y + 18.5, { align: "right" });

  y += 40;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 55, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Équipe IPPOO", M, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Service souscriptions", M, y + 10);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(...IPPOO_RED);
  doc.text("Merci de votre confiance.", W - M, y + 5, { align: "right" });

  drawDocumentFooter(doc);
  const slug = (holder.name || "membre").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`IPPOO_Attestation_${slug}.pdf`);
}
