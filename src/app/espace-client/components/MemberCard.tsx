import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  Fingerprint,
  FileDown,
  RotateCw,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import ippooLogo from "../../../imports/Plan_de_travail72-1.png";

export type MemberCardData = {
  accountId: string;
  prettyId: string;
  qrPayload: string;
  fullName: string;
  organization?: string;
  city?: string;
  avatar?: string;
  memberSince?: string;
  expiresOn?: string;
  planName?: string;
  role?: "member" | "supplier" | "admin";
  bioEnabled?: boolean;
  subscriptionStatus?: "active" | "expired" | "none";
  subscriptionExpiresAt?: number;
};

type Props = {
  data: MemberCardData;
  onRegenerate?: () => void;
  onEnrolBiometric?: () => void;
};

const BRAND = {
  red: "#E8202A",
  orange: "#FF7A18",
  gold: "#D6A400",
};

function tierFor(role?: MemberCardData["role"]): { label: string; gradient: string; accent: string } {
  if (role === "supplier")
    return {
      label: "FOURNISSEUR",
      gradient: "linear-gradient(135deg, #0E0E12 0%, #1B1B1F 40%, #2A1810 100%)",
      accent: BRAND.gold,
    };
  if (role === "admin")
    return {
      label: "ADMIN",
      gradient: "linear-gradient(135deg, #1a0b0b 0%, #2A0E10 50%, #4a1418 100%)",
      accent: "#FF6B6B",
    };
  return {
    label: "MEMBRE",
    gradient: "linear-gradient(135deg, #E8202A 0%, #C71823 40%, #8B1218 100%)",
    accent: "#FFD27A",
  };
}

const QR_CANVAS_ID = "ippoo-member-qr-canvas";

export function MemberCard({ data, onRegenerate, onEnrolBiometric }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [exporting, setExporting] = useState(false);
  const tier = tierFor(data.role);
  const subStatus = data.subscriptionStatus ?? "none";
  const subBadge: { color: string; bg: string; label: string; dot: string } = subStatus === "active"
    ? { color: "#FFD27A", bg: "rgba(31,179,107,.18)", label: "ACTIF", dot: "#1FB36B" }
    : subStatus === "expired"
    ? { color: "#FCA5A5", bg: "rgba(255,77,79,.16)", label: "EXPIRÉ", dot: "#FF4D4F" }
    : { color: "#E5E7EB", bg: "transparent", label: "INACTIF", dot: "#9CA3AF" };
  const longExpiry = data.subscriptionExpiresAt
    ? new Date(data.subscriptionExpiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const daysLeft = data.subscriptionExpiresAt
    ? Math.ceil((data.subscriptionExpiresAt - Date.now()) / 86_400_000)
    : null;

  const initials = (data.fullName || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatted = data.prettyId.replace(/-/g, "  ");

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(data.prettyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  };

  const downloadQrPng = () => {
    const canvas = document.getElementById(QR_CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `ippoo-identity-${data.accountId}.png`;
    a.click();
  };

  const downloadPdf = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const W = 85.6;
      const H = 54;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H] });

      const captureFace = async (target: "recto" | "verso") =>
        html2canvas(cardRef.current!, {
          backgroundColor: null,
          scale: 3,
          useCORS: true,
          logging: false,
          onclone: (cloned: Document) => {
            cloned.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
              el.style.transform = "none";
            });
            cloned.querySelectorAll<HTMLElement>("[data-face]").forEach((el) => {
              if (el.getAttribute("data-face") === target) el.style.transform = "none";
              else el.style.display = "none";
            });
          },
        });

      const rectoCanvas = await captureFace("recto");
      doc.addImage(rectoCanvas.toDataURL("image/png"), "PNG", 0, 0, W, H);
      doc.addPage([W, H], "landscape");
      const versoCanvas = await captureFace("verso");
      doc.addImage(versoCanvas.toDataURL("image/png"), "PNG", 0, 0, W, H);
      doc.save(`ippoo-carte-membre-${data.accountId}.pdf`);
      toast.success("Carte PDF téléchargée");
    } catch (err) {
      console.error("[MemberCard] PDF export failed", err);
      toast.error("Échec du téléchargement du PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section
      className="rounded-3xl border border-black/5 bg-white p-5 md:p-6"
      style={{ boxShadow: "0 10px 30px rgba(27,27,31,.06)" }}
    >
      <header className="flex items-center gap-2 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg, #E8202A 0%, #FF7A18 100%)" }}
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            Ma carte de membre IPPOO
          </h3>
          <p style={{ fontSize: 12, color: "#5A5F6A" }}>
            Format CR80 · Imprimable en PDF.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="flex flex-col items-center w-full lg:w-auto">
          <div
            ref={cardRef}
            className="relative w-full mx-auto"
            style={{
              maxWidth: 380,
              aspectRatio: "1.586 / 1",
              perspective: 1400,
              containerType: "inline-size",
            }}
          >
            <div
              data-flip
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* RECTO */}
              <div
                data-face="recto"
                className="absolute inset-0 overflow-hidden text-white"
                style={{
                  borderRadius: "5.5cqw",
                  background:
                    "radial-gradient(120% 100% at 0% 0%, #E8202A 0%, #C71823 55%, #8B1218 100%)",
                  boxShadow:
                    "0 24px 48px rgba(14,14,18,.35), 0 6px 14px rgba(14,14,18,.18), inset 0 1px 0 rgba(255,255,255,.12)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  display: "grid",
                  gridTemplateRows: "auto auto auto 1fr auto",
                  padding: "5cqw",
                  gap: "1.8cqw",
                }}
              >
                <svg
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  style={{ opacity: 0.126 }}
                >
                  <defs>
                    <pattern id="ippoo-waves" x="0" y="0" width="120" height="22" patternUnits="userSpaceOnUse">
                      <path
                        d="M0 11 Q 15 0 30 11 T 60 11 T 90 11 T 120 11"
                        stroke="rgba(255,255,255,.55)"
                        strokeWidth="1.2"
                        fill="none"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#ippoo-waves)" />
                </svg>

                <span
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    right: "6cqw",
                    top: "50%",
                    fontFamily: "'Lilita One', Poppins, sans-serif",
                    fontWeight: 400,
                    fontSize: "32cqw",
                    color: "#FFFFFF",
                    opacity: 0.063,
                    letterSpacing: "0.1cqw",
                    lineHeight: 0.85,
                    transform: "translateY(-50%)",
                    textShadow: "0 0.5cqw 1cqw rgba(0,0,0,.15)",
                  }}
                >
                  {initials}
                </span>

                <div className="relative flex items-center justify-between" style={{ gap: "3cqw" }}>
                  <div className="flex items-center" style={{ gap: "3cqw" }}>
                    <img
                      src={ippooLogo}
                      alt="IPPOO"
                      crossOrigin="anonymous"
                      style={{
                        height: "9.1cqw",
                        width: "auto",
                        objectFit: "contain",
                        display: "block",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "2.6cqw",
                        letterSpacing: "0.3cqw",
                        lineHeight: 1,
                        opacity: 0.95,
                        fontWeight: 400,
                      }}
                    >
                      CARTE DE MEMBRE · BÉNIN
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center"
                    style={{
                      padding: "1.4cqw 3cqw",
                      borderRadius: 999,
                      background: subBadge.bg,
                      fontFamily: "Poppins",
                      fontSize: "2.2cqw",
                      fontWeight: 700,
                      letterSpacing: "0.38cqw",
                      border: `0.35cqw solid ${subBadge.color}`,
                      color: subBadge.color,
                      flexShrink: 0,
                      gap: "1cqw",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: "1.6cqw",
                        height: "1.6cqw",
                        borderRadius: 999,
                        background: subBadge.dot,
                        boxShadow: subStatus === "active" ? `0 0 0 0.6cqw ${subBadge.dot}33` : "none",
                        flexShrink: 0,
                      }}
                    />
                    {(data.planName ?? tier.label).toUpperCase()} · {subBadge.label}
                  </span>
                </div>

                <div className="relative flex items-center" style={{ gap: "2.8cqw" }}>
                  <div
                    style={{
                      width: "12cqw",
                      height: "9cqw",
                      borderRadius: "1.4cqw",
                      background: "linear-gradient(135deg, #F2D88A 0%, #D9B25E 35%, #A5832E 100%)",
                      position: "relative",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(0,0,0,.2), 0 1px 2px rgba(0,0,0,.25)",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "0.9cqw",
                        borderRadius: "0.5cqw",
                        border: "0.22cqw solid rgba(0,0,0,.3)",
                        backgroundImage:
                          "linear-gradient(to right, transparent 49%, rgba(0,0,0,.3) 50%, transparent 51%), linear-gradient(to bottom, transparent 49%, rgba(0,0,0,.3) 50%, transparent 51%)",
                      }}
                    />
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ width: "7cqw", height: "7cqw", opacity: 0.95, transform: "rotate(90deg)", color: "white" }}
                  >
                    <path
                      d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="relative flex flex-col justify-center" style={{ gap: "1cqw" }}>
                  <p style={{ fontFamily: "Poppins", fontSize: "2cqw", opacity: 0.85, letterSpacing: "0.42cqw", lineHeight: 1, fontWeight: 700 }}>
                    MEMBER ID
                  </p>
                  <p
                    style={{
                      fontFamily: "'Lilita One', Poppins, sans-serif",
                      fontWeight: 400,
                      fontSize: "8cqw",
                      letterSpacing: "0.25cqw",
                      textShadow: "0 0.4cqw 0 rgba(0,0,0,.18)",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatted}
                  </p>
                </div>

                <div className="relative flex items-end justify-between" style={{ gap: "2.5cqw" }}>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontFamily: "Poppins", fontSize: "2cqw", opacity: 0.85, letterSpacing: "0.42cqw", lineHeight: 1, fontWeight: 700 }}>
                      TITULAIRE
                    </p>
                    <p
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 800,
                        fontSize: "4cqw",
                        marginTop: "1.1cqw",
                        textTransform: "uppercase",
                        letterSpacing: "0.18cqw",
                        lineHeight: 1.05,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {data.fullName || " "}
                    </p>
                    {data.organization && (
                      <p
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "2.4cqw",
                          fontWeight: 500,
                          opacity: 0.92,
                          marginTop: "0.6cqw",
                          letterSpacing: "0.04cqw",
                          lineHeight: 1.15,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {data.organization}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontFamily: "Poppins", fontSize: "2cqw", opacity: 0.85, letterSpacing: "0.42cqw", lineHeight: 1, fontWeight: 700 }}>
                      {subStatus === "expired" ? "EXPIRÉ LE" : "EXPIRE LE"}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Lilita One', Poppins, sans-serif",
                        fontWeight: 400,
                        fontSize: "5cqw",
                        marginTop: "1.1cqw",
                        letterSpacing: "0.15cqw",
                        lineHeight: 1,
                        color: subStatus === "expired" ? "#FCA5A5" : "white",
                      }}
                    >
                      {data.expiresOn || " / "}
                    </p>
                    {daysLeft !== null && subStatus === "active" && daysLeft <= 30 && (
                      <p
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "1.8cqw",
                          marginTop: "0.6cqw",
                          opacity: 0.9,
                          color: daysLeft <= 7 ? "#FCA5A5" : "#FFD27A",
                          fontWeight: 600,
                          letterSpacing: "0.05cqw",
                        }}
                      >
                        {daysLeft <= 0 ? "Aujourd'hui" : `J‑${daysLeft}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* VERSO */}
              <div
                data-face="verso"
                className="absolute inset-0 overflow-hidden"
                style={{
                  borderRadius: "5.5cqw",
                  background: "linear-gradient(160deg, #14161D 0%, #1B1E27 55%, #0E0E12 100%)",
                  boxShadow: "0 24px 48px rgba(14,14,18,.45), 0 6px 14px rgba(14,14,18,.22), inset 0 1px 0 rgba(255,255,255,.08)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  color: "#EDEEF2",
                  display: "grid",
                  gridTemplateRows: "auto auto 1fr auto auto",
                }}
              >
                <svg
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  style={{ opacity: 0.126 }}
                >
                  <defs>
                    <pattern id="ippoo-waves-verso" x="0" y="0" width="120" height="22" patternUnits="userSpaceOnUse">
                      <path
                        d="M0 11 Q 15 0 30 11 T 60 11 T 90 11 T 120 11"
                        stroke="rgba(255,255,255,.55)"
                        strokeWidth="1.2"
                        fill="none"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#ippoo-waves-verso)" />
                </svg>

                <span
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    right: "6cqw",
                    top: "50%",
                    fontFamily: "'Lilita One', Poppins, sans-serif",
                    fontWeight: 400,
                    fontSize: "32cqw",
                    color: "#FFFFFF",
                    opacity: 0.063,
                    letterSpacing: "0.1cqw",
                    lineHeight: 0.85,
                    transform: "translateY(-50%)",
                    textShadow: "0 0.5cqw 1cqw rgba(0,0,0,.15)",
                  }}
                >
                  {initials}
                </span>

                <div className="relative flex items-center justify-between" style={{ padding: "4cqw 5cqw 0 5cqw", gap: "3cqw" }}>
                  <img
                    src={ippooLogo}
                    alt="IPPOO"
                    crossOrigin="anonymous"
                    style={{
                      height: "9.1cqw",
                      width: "auto",
                      objectFit: "contain",
                      display: "block",
                      flexShrink: 0,
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                  <span
                    className="inline-flex items-center"
                    style={{
                      padding: "1.4cqw 3cqw",
                      borderRadius: 999,
                      background: "transparent",
                      fontFamily: "Poppins",
                      fontSize: "2.2cqw",
                      fontWeight: 700,
                      letterSpacing: "0.38cqw",
                      border: "0.3cqw solid #FFD27A",
                      color: "#FFD27A",
                      flexShrink: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {data.organization || tier.label}
                  </span>
                </div>

                <div className="relative" style={{ marginTop: "3cqw" }}>
                  <div
                    style={{
                      height: "7.5cqw",
                      background: "linear-gradient(180deg, #000 0%, #15161B 50%, #000 100%)",
                      borderTop: "1px solid rgba(255,255,255,.06)",
                      borderBottom: "1px solid rgba(0,0,0,.6)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      left: "5cqw",
                      right: "5cqw",
                      bottom: "-1.6cqw",
                      height: "2.4cqw",
                      borderRadius: "1.2cqw",
                      background: "linear-gradient(90deg, #FF7A18 0%, #E8202A 25%, #FF3D8D 50%, #7C3AED 75%, #1DC7FF 100%)",
                      opacity: 0.85,
                      boxShadow: "0 4px 14px rgba(255,122,24,.35)",
                    }}
                  />
                </div>

                <div className="relative flex items-center" style={{ padding: "4cqw 5cqw 1.5cqw 5cqw", gap: "3cqw" }}>
                  <div
                    className="bg-white flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                    style={{
                      borderRadius: "1.4cqw",
                      padding: "0.8cqw",
                      width: "26cqw",
                      height: "26cqw",
                      boxShadow: "0 4px 10px rgba(0,0,0,.35)",
                    }}
                  >
                    <QRCodeCanvas
                      id={QR_CANVAS_ID}
                      value={data.qrPayload}
                      size={512}
                      level="H"
                      includeMargin={false}
                      bgColor="#FFFFFF"
                      fgColor="#0E0E12"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <div className="min-w-0 flex flex-col" style={{ gap: "1.2cqw", width: "32cqw" }}>
                    <div>
                      <p style={{ fontSize: "2cqw", color: "rgba(237,238,242,.55)", letterSpacing: "0.32cqw", lineHeight: 1, fontWeight: 700 }}>
                        SIGNATURE DU TITULAIRE
                      </p>
                      <div
                        className="flex items-end relative overflow-hidden"
                        style={{
                          marginTop: "0.7cqw",
                          borderRadius: "0.9cqw",
                          background: "repeating-linear-gradient(135deg, #FAF7F0 0 1.2cqw, #F0EAD8 1.2cqw 2.4cqw)",
                          padding: "1.4cqw 1.8cqw",
                          height: "13cqw",
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,.1)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Brush Script MT', cursive",
                            fontStyle: "italic",
                            fontSize: "3.6cqw",
                            color: "#1B1B1F",
                            lineHeight: 1,
                            opacity: 0.85,
                          }}
                        >
                          {data.fullName?.split(" ")[0] || "Signature"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative" style={{ padding: "0 5cqw 3cqw" }}>
                  <p style={{ fontSize: "1.7cqw", color: "rgba(237,238,242,.5)", lineHeight: 1.3 }}>
                    Cette carte est la propriété de IPPOO et reste sa propriété exclusive. Personnelle et non transférable, elle doit être restituée sur simple demande. Le QR signé n'est valable qu'après vérification biométrique sur l'appareil du titulaire.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 bg-white hover:bg-[#FAF7F2]"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {flipped ? "Voir le recto" : "Voir le verso"}
            </button>
            <p style={{ fontSize: 11, color: "#5A5F6A" }}>
              QR au dos · Touchez pour retourner la carte
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div>
            <p style={{ fontSize: 10, color: "#5A5F6A", letterSpacing: 0.8 }}>NUMÉRO DE COMPTE</p>
            <div className="mt-1 flex items-center gap-2">
              <p
                className="font-mono"
                style={{ fontFamily: "Space Grotesk, ui-monospace, monospace", fontWeight: 700, fontSize: 18 }}
              >
                {formatted}
              </p>
              <button onClick={copyNumber} className="p-1.5 rounded-lg hover:bg-[#FAF7F2]" aria-label="Copier">
                {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#1FB36B" }} /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="mt-3" style={{ fontSize: 12, color: "#5A5F6A" }}>
              Présentez le QR au comptoir, en caisse ou pour vous reconnecter sans saisir vos identifiants.
            </p>
            {data.bioEnabled && (
              <p className="mt-2 inline-flex items-center gap-1" style={{ fontSize: 11, color: "#1FB36B" }}>
                <Fingerprint className="w-3.5 h-3.5" /> Connexion par scan + empreinte active
              </p>
            )}

            <div
              className="mt-4 rounded-xl border p-3"
              style={{
                borderColor: subStatus === "active" ? "#BBF7D0" : subStatus === "expired" ? "#FECACA" : "#E5E7EB",
                background: subStatus === "active" ? "#F0FDF4" : subStatus === "expired" ? "#FEF2F2" : "#F9FAFB",
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12, color: "#374151" }}>
                  Abonnement {data.planName ?? "MEMBRE"}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: subBadge.dot,
                    color: "white",
                    fontFamily: "Poppins",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: 0.4,
                  }}
                >
                  {subBadge.label}
                </span>
              </div>
              {longExpiry ? (
                <p className="mt-1" style={{ fontSize: 12, color: "#5A5F6A" }}>
                  {subStatus === "expired"
                    ? `A expiré le ${longExpiry}.`
                    : daysLeft !== null && daysLeft <= 30
                      ? `Expire le ${longExpiry} (dans ${daysLeft} j).`
                      : `Valable jusqu'au ${longExpiry}.`}
                </p>
              ) : (
                <p className="mt-1" style={{ fontSize: 12, color: "#5A5F6A" }}>
                  Aucun abonnement actif. Activez VIP pour profiter des avantages.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 mb-2 flex flex-wrap gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 hover:bg-[#FAF7F2]"
                style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Régénérer
              </button>
            )}
            <button
              onClick={downloadQrPng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 hover:bg-[#FAF7F2]"
              style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
            >
              <Download className="w-3.5 h-3.5" />
              QR en PNG
            </button>
            <button
              onClick={downloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white disabled:opacity-60"
              style={{
                background: "#FF3B57",
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: 12,
                boxShadow: "0 6px 14px rgba(232,32,42,.3)",
              }}
            >
              <FileDown className="w-3.5 h-3.5" />
              {exporting ? "Préparation…" : "Télécharger la carte PDF"}
            </button>
            {onEnrolBiometric && (
              <button
                onClick={onEnrolBiometric}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 hover:bg-[#FAF7F2]"
                style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12 }}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                {data.bioEnabled ? "Empreinte enregistrée" : "Enrôler mon empreinte"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
