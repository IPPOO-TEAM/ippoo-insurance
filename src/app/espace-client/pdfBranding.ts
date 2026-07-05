import type { jsPDF } from "jspdf";
import logoUrl from "../../imports/Plan_de_travail72-4.png";

export const IPPOO_RED: [number, number, number] = [216, 67, 50];
export const IPPOO_ORANGE: [number, number, number] = [255, 122, 0];
export const PANEL_GREY: [number, number, number] = [242, 243, 247];
export const ROW_GREY: [number, number, number] = [247, 248, 250];
export const TEXT_DARK: [number, number, number] = [25, 25, 35];
export const TEXT_MUTED: [number, number, number] = [140, 140, 150];

let cachedLogo: string | null = null;

export async function loadLogoDataUrl(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const res = await fetch(logoUrl);
  const blob = await res.blob();
  cachedLogo = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return cachedLogo;
}

/**
 * Draws the IPPOO header band used by all client PDFs: logo top-left
 * with brand label, large document title top-right with reference.
 */
export function drawDocumentHeader(
  doc: jsPDF,
  opts: { logo: string; title: string; reference?: string; subtitle?: string },
) {
  const W = doc.internal.pageSize.getWidth();
  const M = 16;

  // Logo (max 34mm wide, preserve ratio)
  try { doc.addImage(opts.logo, "PNG", M, 14, 34, 22, undefined, "FAST"); } catch {}

  // Brand label under logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("IPPOO ASSURANCE", M, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Micro-assurance · Afrique", M, 46.5);

  // Big title (top-right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...TEXT_DARK);
  doc.text(opts.title.toUpperCase(), W - M, 26, { align: "right" });

  if (opts.reference) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`#${opts.reference}`, W - M, 32, { align: "right" });
  }
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(opts.subtitle, W - M, 38, { align: "right" });
  }

  // Soft divider line
  doc.setDrawColor(225);
  doc.setLineWidth(0.2);
  doc.line(M, 50, W - M, 50);
}

/** Bottom-of-page footer with brand line. */
export function drawDocumentFooter(doc: jsPDF, extra?: string) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Thank-you band marker (just colored bar)
    doc.setDrawColor(...IPPOO_RED);
    doc.setLineWidth(0.6);
    doc.line(16, H - 14, W - 16, H - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    const left = "IPPOO ASSURANCE — contact@ippoo.bj · +229 01 41 52 10 92";
    doc.text(left, 16, H - 9);
    if (extra) doc.text(extra, 16, H - 5);
    doc.text(`${i} / ${pages}`, W - 16, H - 9, { align: "right" });
  }
}
