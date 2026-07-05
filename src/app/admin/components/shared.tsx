// Primitives partagés par toutes les pages admin.
import type { ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { Claim, SiteContent } from "../../espace-client/api";

// --- Constants ---------------------------------------------------------------

export const PIE_COLORS = ["#FF3B57", "#FF7A00", "#2A6BFF", "#16B26A", "#8A4BFF", "#FFB020", "#0E1320"];

export const CLAIM_FILTERS: { key: "all" | Claim["status"]; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "en_cours", label: "En cours" },
  { key: "valide", label: "Validés" },
  { key: "regle", label: "Réglés" },
  { key: "rejete", label: "Rejetés" },
];

export const KANBAN_COLS: { status: Claim["status"]; label: string; accent: string; bg: string }[] = [
  { status: "en_cours", label: "En cours", accent: "#FFB020", bg: "#FFF7E5" },
  { status: "valide", label: "Validés", accent: "#2A6BFF", bg: "#E7F0FF" },
  { status: "regle", label: "Réglés", accent: "#0F7A47", bg: "#DBFBE7" },
  { status: "rejete", label: "Rejetés", accent: "#C0263A", bg: "#FFE2E7" },
];

export const ALERT_RULES: { test: (action: string) => boolean; tone: "danger" | "warn" | "info"; label: string }[] = [
  { test: (a) => /payment\.echec|admin\.broadcast|claim\.rejet|account\.delete|admin\.login\.2fa/i.test(a), tone: "danger", label: "Critique" },
  { test: (a) => /payment\.confirme|claim\.declare|signup|subscribe/i.test(a), tone: "info", label: "Activité" },
  { test: (a) => /admin\./i.test(a), tone: "warn", label: "Admin" },
];
export function alertFor(action: string) {
  return ALERT_RULES.find((r) => r.test(action));
}

export const SITE_FIELDS: { key: keyof SiteContent; label: string; type: "text" | "textarea"; hint?: string }[] = [
  { key: "brandName", label: "Nom de marque", type: "text" },
  { key: "tagline", label: "Slogan", type: "text" },
  { key: "heroTitle", label: "Titre principal (accueil)", type: "text" },
  { key: "heroSubtitle", label: "Sous-titre (accueil)", type: "textarea" },
  { key: "aboutShort", label: "À propos (résumé)", type: "textarea" },
  { key: "contactEmail", label: "E-mail de contact", type: "text" },
  { key: "contactPhone", label: "Téléphone", type: "text" },
  { key: "contactAddress", label: "Adresse", type: "text" },
  { key: "whatsapp", label: "WhatsApp", type: "text" },
  { key: "facebook", label: "Facebook (URL)", type: "text" },
  { key: "instagram", label: "Instagram (URL)", type: "text" },
  { key: "linkedin", label: "LinkedIn (URL)", type: "text" },
];

// --- UI atoms ----------------------------------------------------------------

export function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-[#F9FAFC] rounded-xl px-3 py-2.5">
      <p className="text-[#888]" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <p className="mt-0.5" style={{ fontSize: "0.95rem", fontWeight: 900 }}>{value}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[#F9FAFC] rounded-xl p-3">
      <p className="mb-2 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

export function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ fontSize: "0.82rem" }}>
      <span className="text-[#666]">{k}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
}

export function Empty() {
  return <p className="text-[#999]" style={{ fontSize: "0.78rem" }}>Aucun élément.</p>;
}

export function FiltersBar({
  q, setQ, reload, children,
}: { q: string; setQ: (v: string) => void; reload: () => void; children?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-white"
          style={{ fontSize: "0.85rem" }}
        />
      </div>
      {children}
      <button
        onClick={reload}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5"
        style={{ fontSize: "0.78rem", fontWeight: 700 }}
      >
        <RefreshCw className="w-3.5 h-3.5" /> Actualiser
      </button>
    </div>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-black/10 bg-white"
      style={{ fontSize: "0.82rem", fontWeight: 700 }}
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}

export function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: "blue" | "orange" | "green" }) {
  const bg = tone === "blue" ? "#DDE7FF" : tone === "orange" ? "#FFE8D6" : "#D6F5DC";
  const fg = tone === "blue" ? "#2A6BFF" : tone === "orange" ? "#FF7A00" : "#1E9E4A";
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color: fg }} />
      </div>
      <div className="min-w-0">
        <p className="text-[#666]" style={{ fontSize: "0.78rem" }}>{label}</p>
        <p className="truncate" style={{ fontSize: "1.1rem", fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  );
}

export function ActionBtn({ label, tone, onClick, disabled }: { label: string; tone: "green" | "red" | "blue" | "gray"; onClick: () => void; disabled?: boolean }) {
  const bg = tone === "green" ? "#1E9E4A" : tone === "red" ? "#FF3B57" : tone === "blue" ? "#2A6BFF" : "#0E1320";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg, fontSize: "0.8rem", fontWeight: 700 }}
    >
      {label}
    </button>
  );
}

export function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block mb-1 text-[#666]" style={{ fontSize: "0.74rem", fontWeight: 700 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-black/10"
        style={{ fontSize: "0.85rem" }}
      />
    </label>
  );
}
