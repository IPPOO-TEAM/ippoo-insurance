import { jsPDF } from "jspdf";
import { mergedDetails } from "../data/pricing";
import type { CatalogProduct } from "../data/productCatalog";
import { formatXOF } from "./hooks";
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

export async function downloadProductDetails(product: CatalogProduct) {
  const data = mergedDetails()[product.id];
  if (!data) return;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const contentW = W - M * 2;

  const logo = await loadLogoDataUrl();
  drawDocumentHeader(doc, {
    logo,
    title: "Fiche offre",
    reference: product.id.toUpperCase(),
    subtitle: `${formatXOF(product.premium)} / ${product.frequency}`,
  });

  let y = 58;

  // Product title + description left, meta panel right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  const nameLines = doc.splitTextToSize(product.name, contentW / 2 - 4);
  doc.text(nameLines, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  const descLines = doc.splitTextToSize(product.desc, contentW / 2 - 4);
  doc.text(descLines, M, y + nameLines.length * 5 + 2);

  const panelX = W / 2 + 6;
  const panelW = W - M - panelX;
  doc.setFillColor(...PANEL_GREY);
  doc.rect(panelX, y - 4, panelW, 22, "F");
  doc.setFillColor(...IPPOO_RED);
  doc.rect(panelX, y - 4, 1.6, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Catégorie", panelX + 4, y);
  doc.text("Cotisation", panelX + panelW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(product.category, panelX + 4, y + 5);
  doc.text(`${formatXOF(product.premium)} / ${product.frequency}`, panelX + panelW / 2, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Délai de carence", panelX + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  const carenceShort = doc.splitTextToSize(data.delaiCarence, panelW - 8);
  doc.text(carenceShort.slice(0, 2), panelX + 4, y + 18);

  y += 30;

  function ensure(space: number) {
    if (y + space > H - 22) {
      drawDocumentFooter(doc);
      doc.addPage();
      drawDocumentHeader(doc, {
        logo,
        title: "Fiche offre",
        reference: product.id.toUpperCase(),
        subtitle: product.name,
      });
      y = 58;
    }
  }

  // Garanties table (red header band like template)
  ensure(20);
  doc.setFillColor(...IPPOO_RED);
  doc.rect(M, y, contentW, 9, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("N°", M + 3, y + 6);
  doc.text("RISQUE COUVERT", M + 14, y + 6);
  doc.text("PRISE EN CHARGE", M + contentW - 80, y + 6, { align: "right" });
  doc.text("PLAFOND", M + contentW - 40, y + 6, { align: "right" });
  doc.text("FRANCHISE", M + contentW - 3, y + 6, { align: "right" });
  y += 9;

  data.garanties.forEach((g, i) => {
    const risqueWrap = doc.splitTextToSize(g.risque, contentW * 0.42);
    const rowH = Math.max(10, risqueWrap.length * 4.2 + 4);
    ensure(rowH);
    if (i % 2 === 0) {
      doc.setFillColor(...ROW_GREY);
      doc.rect(M, y, contentW, rowH, "F");
    }
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`0${i + 1}.`, M + 3, y + 6);
    doc.setTextColor(...TEXT_DARK);
    doc.text(risqueWrap, M + 14, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(g.priseEnCharge, M + contentW - 80, y + 6, { align: "right" });
    doc.text(g.plafond, M + contentW - 40, y + 6, { align: "right" });
    doc.text(g.franchise, M + contentW - 3, y + 6, { align: "right" });
    y += rowH;
  });

  y += 6;

  // Formules
  ensure(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...IPPOO_RED);
  doc.text("FORMULES DISPONIBLES", M, y);
  doc.setDrawColor(...IPPOO_RED);
  doc.setLineWidth(0.4);
  doc.line(M, y + 1.5, M + 60, y + 1.5);
  y += 6;
  for (const f of data.formules) {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text(`${f.nom}${f.highlight ? "  ★" : ""}`, M, y);
    doc.setTextColor(...IPPOO_RED);
    doc.text(f.cotisation, W - M, y, { align: "right" });
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(f.description, contentW);
    doc.text(lines, M, y + 5);
    y += 5 + lines.length * 4.3 + 2;
  }

  // Exclusions
  ensure(16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...IPPOO_RED);
  doc.text("CE QUI N'EST PAS COUVERT", M, y);
  doc.line(M, y + 1.5, M + 80, y + 1.5);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  for (const e of data.exclusions) {
    const lines = doc.splitTextToSize(`•  ${e}`, contentW - 4);
    ensure(lines.length * 4.5 + 1);
    doc.text(lines, M + 2, y);
    y += lines.length * 4.5 + 1;
  }
  y += 4;

  // Exemple concret in grey card
  ensure(32);
  doc.setFillColor(...PANEL_GREY);
  doc.rect(M, y, contentW, 28, "F");
  doc.setFillColor(...IPPOO_RED);
  doc.rect(M, y, 1.6, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("EXEMPLE CONCRET", M + 5, y + 5);
  doc.setFontSize(9.5);
  doc.text(data.exempleSinistre.profil, M + 5, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  const hist = doc.splitTextToSize(data.exempleSinistre.histoire, contentW - 10);
  doc.text(hist.slice(0, 3), M + 5, y + 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...IPPOO_RED);
  doc.text(`Indemnisation : ${data.exempleSinistre.indemnisation}`, M + 5, y + 26);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Délai : ${data.exempleSinistre.delai}`, W - M - 5, y + 26, { align: "right" });
  y += 32;

  drawDocumentFooter(doc, "Document informatif — sans valeur contractuelle");
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`IPPOO_Offre_${slug || product.id}.pdf`);
}
