import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "rose",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "rose" | "blue" | "purple" | "amber" | "green";
}) {
  const TONES = {
    rose:   { soft: "#FFE2E7", ring: "#FFB7C2", icon: "#FF3B57", grad: "linear-gradient(135deg,#FF3B57,#FF7A00)" },
    blue:   { soft: "#DDE7FF", ring: "#A8C0FF", icon: "#2A6BFF", grad: "linear-gradient(135deg,#2A6BFF,#8A4BFF)" },
    purple: { soft: "#EFE3FF", ring: "#C9A8FF", icon: "#8A4BFF", grad: "linear-gradient(135deg,#8A4BFF,#FF4FAE)" },
    amber:  { soft: "#FFF1D9", ring: "#FFD27A", icon: "#FF7A00", grad: "linear-gradient(135deg,#FF7A00,#FFC54B)" },
    green:  { soft: "#DBFBE7", ring: "#9AE7BC", icon: "#0F7A47", grad: "linear-gradient(135deg,#16B26A,#0F7A47)" },
  } as const;
  const t = TONES[tone];

  return (
    <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-black/5">
      <div className="relative w-24 h-24 mx-auto mb-5">
        <div className="absolute inset-0 rounded-full opacity-60" style={{ background: t.soft }} />
        <div className="absolute inset-2 rounded-full opacity-50 animate-pulse" style={{ background: t.ring }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: t.grad }}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.01em" }}>{title}</h3>
      {description && (
        <p className="text-[#666] mt-1.5 max-w-sm mx-auto" style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
