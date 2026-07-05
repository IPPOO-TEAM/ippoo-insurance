import type { ReactNode } from "react";

// Skeletons + empty states partagés des trois listes conseiller (Inbox,
// Sinistres, KYC). On reste sur des primitives Tailwind + tokens IPPOO pour
// rester cohérent avec le reste de l'app — pas de librairie externe.

export function RowSkeleton({ withAvatar = true }: { withAvatar?: boolean }) {
  return (
    <div className="w-full px-4 py-3 border-b border-black/5 flex items-start gap-3 animate-pulse">
      {withAvatar && (
        <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(14,19,32,0.06)" }} />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 rounded-md" style={{ width: "62%", background: "rgba(14,19,32,0.08)" }} />
        <div className="h-2.5 rounded-md" style={{ width: "88%", background: "rgba(14,19,32,0.05)" }} />
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-3 w-12 rounded-full" style={{ background: "rgba(14,19,32,0.06)" }} />
          <div className="h-3 w-16 rounded-full" style={{ background: "rgba(14,19,32,0.04)" }} />
        </div>
      </div>
      <div className="h-3 w-10 rounded-md shrink-0" style={{ background: "rgba(14,19,32,0.05)" }} />
    </div>
  );
}

export function ListSkeleton({ rows = 6, withAvatar = true }: { rows?: number; withAvatar?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} withAvatar={withAvatar} />
      ))}
    </div>
  );
}

// Visuels d'état vide — SVG simples, monochromes IPPOO, pas d'asset externe.

export function EmptyInboxArt({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ippoo-grad-inbox" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF3B57" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#ippoo-grad-inbox)" />
      <rect x="28" y="42" width="64" height="40" rx="10" fill="#fff" stroke="#FF3B57" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M30 46l30 22 30-22" stroke="#FF3B57" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="92" cy="44" r="8" fill="#FF3B57" />
      <text x="92" y="48" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">0</text>
    </svg>
  );
}

export function EmptyClaimsArt({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ippoo-grad-claims" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FFB020" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#ippoo-grad-claims)" />
      <rect x="36" y="32" width="48" height="58" rx="8" fill="#fff" stroke="#FF7A00" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M44 48h32M44 58h32M44 68h22" stroke="#FF7A00" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="78" cy="78" r="12" fill="#16B26A" />
      <path d="M73 78l4 4 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function EmptyKycArt({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ippoo-grad-kyc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF3B57" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#5B34D4" stopOpacity="0.10" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#ippoo-grad-kyc)" />
      <path d="M60 26l28 10v22c0 18-12 30-28 36-16-6-28-18-28-36V36l28-10z" fill="#fff" stroke="#FF3B57" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M48 62l8 8 16-18" stroke="#16B26A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function EmptyState({
  art,
  title,
  hint,
  action,
}: {
  art: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-10 text-center flex flex-col items-center">
      <div className="mb-3">{art}</div>
      <p className="text-[#0E1320]" style={{ fontSize: "0.92rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 max-w-xs text-[#888888]" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
