import { jsPDF } from "jspdf";
import { formatXOF, formatDate } from "../espace-client/hooks";
import {
  loadLogoDataUrl,
  drawDocumentHeader,
  drawDocumentFooter,
  IPPOO_RED,
  PANEL_GREY,
  ROW_GREY,
  TEXT_DARK,
  TEXT_MUTED,
} from "../espace-client/pdfBranding";

const PREMIUM_PER_MONTH = 500 * 31; // 15 500 FCFA/mois (aligné backend)

const FREQ_LABEL: Record<string, string> = {
  mensuel: "Mensuelle",
  trimestriel: "Trimestrielle",
  annuel: "Annuelle",
};
const FREQ_MULT: Record<string, number> = { mensuel: 1, trimestriel: 3, annuel: 12 };

export interface DevisInput {
  prospect: { name: string; email?: string; phone?: string; memberNumber?: string };
  product: string;
  frequency: "mensuel" | "trimestriel" | "annuel";
  agent: { matricule: string; name?: string };
  validUntilDays?: number;
}

export async function downloadDevis(input: DevisInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;
  const contentW = W - M * 2;
  const ref = `DEVIS-${Date.now().toString(36).toUpperCase()}`;
  const validUntil = new Date(Date.now() + (input.validUntilDays ?? 30) * 86400000).toISOString();
  const mult = FREQ_MULT[input.frequency] ?? 1;
  const total = PREMIUM_PER_MONTH * mult;

  const logo = await loadLogoDataUrl();
  drawDocumentHeader(doc, {
    logo,
    title: "Devis",
    reference: ref,
    subtitle: `Émis le ${formatDate(new Date().toISOString())} · valable jusqu'au ${formatDate(validUntil)}`,
  });

  let y = 58;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("PROSPECT", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(input.prospect.name || "—", M, y + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  if (input.prospect.email) doc.text(input.prospect.email, M, y + 11);
  if (input.prospect.phone) doc.text(input.prospect.phone, M, y + 15.5);
  if (input.prospect.memberNumber) doc.text(`N° membre : ${input.prospect.memberNumber}`, M, y + 20);

  const panelX = W / 2 + 6;
  const panelW = W - M - panelX;
  doc.setFillColor(...PANEL_GREY);
  doc.rect(panelX, y - 4, panelW, 26, "F");
  doc.setFillColor(...IPPOO_RED);
  doc.rect(panelX, y - 4, 1.6, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Conseiller", panelX + 4, y);
  doc.text("Fréquence", panelX + panelW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(input.agent.name || input.agent.matricule, panelX + 4, y + 5);
  doc.text(FREQ_LABEL[input.frequency] ?? input.frequency, panelX + panelW / 2, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Référence", panelX + 4, y + 13);
  doc.text("Validité", panelX + panelW / 2, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(ref, panelX + 4, y + 18);
  doc.text(formatDate(validUntil), panelX + panelW / 2, y + 18);

  y += 36;
  doc.setFillColor(...IPPOO_RED);
  doc.rect(M, y, contentW, 9, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("N°", M + 3, y + 6);
  doc.text("DÉSIGNATION", M + 14, y + 6);
  doc.text("PRIX MOIS", M + contentW - 56, y + 6, { align: "right" });
  doc.text("QTÉ", M + contentW - 28, y + 6, { align: "right" });
  doc.text("TOTAL", M + contentW - 3, y + 6, { align: "right" });
  y += 9;

  doc.setFillColor(...ROW_GREY);
  doc.rect(M, y, contentW, 14, "F");
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("01.", M + 3, y + 6);
  doc.text(input.product, M + 14, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Cotisation ${FREQ_LABEL[input.frequency]?.toLowerCase() ?? input.frequency} — IPPOO Assurance`, M + 14, y + 11);
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatXOF(PREMIUM_PER_MONTH), M + contentW - 56, y + 8, { align: "right" });
  doc.text(String(mult), M + contentW - 28, y + 8, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(formatXOF(total), M + contentW - 3, y + 8, { align: "right" });
  y += 14;

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("CONDITIONS", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  const txt = doc.splitTextToSize(
    "Devis indicatif. La souscription est confirmée après réception du premier paiement. Les garanties sont définies aux conditions générales IPPOO.",
    contentW / 2 - 4,
  );
  doc.text(txt, M, y + 5);

  const totalsX = W - M - 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Sous-total", totalsX, y + 2);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatXOF(total), W - M, y + 2, { align: "right" });
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
  doc.text(formatXOF(total), W - M, y + 18.5, { align: "right" });

  y += 40;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 55, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(input.agent.name || "Conseiller IPPOO", M, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Matricule : ${input.agent.matricule}`, M, y + 10);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(...IPPOO_RED);
  doc.text("Devis sans engagement.", W - M, y + 5, { align: "right" });

  drawDocumentFooter(doc);
  const slug = (input.prospect.name || "prospect").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`IPPOO_Devis_${slug}.pdf`);
}
