import { useState } from "react";
import { User } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; text: string; icon: string }> = {
  sm: { box: "w-8 h-8 rounded-xl", text: "text-[0.78rem]", icon: "w-4 h-4" },
  md: { box: "w-10 h-10 rounded-2xl", text: "text-[0.92rem]", icon: "w-5 h-5" },
  lg: { box: "w-14 h-14 rounded-2xl", text: "text-[1.05rem]", icon: "w-6 h-6" },
  xl: { box: "w-20 h-20 rounded-3xl", text: "text-[1.4rem]", icon: "w-8 h-8" },
};

export function UserAvatar({
  url,
  name,
  email,
  size = "md",
  className = "",
}: {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: Size;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];
  const label = (name || email || "").trim();
  const initial = label ? label[0].toUpperCase() : "";

  if (url && !failed) {
    return (
      <div
        className={`${s.box} overflow-hidden shrink-0 ${className}`}
        style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
      >
        <img
          src={url}
          alt={label || "Profil"}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`${s.box} shrink-0 flex items-center justify-center text-white shadow-sm ${className}`}
      style={{ background: "linear-gradient(135deg,#FF3B57,#FF7A00)" }}
      aria-label={label || "Profil"}
    >
      {initial ? (
        <span className={`${s.text} font-black`} style={{ letterSpacing: "-0.02em" }}>
          {initial}
        </span>
      ) : (
        <User className={s.icon} />
      )}
    </div>
  );
}
