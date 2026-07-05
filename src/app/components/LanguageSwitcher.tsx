import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLang } from "../lib/LanguageContext";
import { locales } from "../lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t.switchLang}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-border/50 hover:border-foreground transition-all text-muted-foreground hover:text-foreground ${compact ? "px-2.5 h-9" : "px-3 h-10"}`}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {locale.code === "fr" ? "FR" : locale.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] border border-border/40 p-2 z-50 max-h-[70vh] overflow-y-auto">
          <p className="px-3 py-2 text-muted-foreground" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t.switchLang}
          </p>
          <ul>
            {locales.map((l) => {
              const active = l.code === locale.code;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => { setLocale(l.code); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? "bg-ippoo-green/10" : "hover:bg-[#f7f8fa]"}`}
                  >
                    <span style={{ fontSize: "1rem" }}>{l.country}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: "0.875rem", fontWeight: active ? 800 : 600, color: active ? "#0B6E4F" : undefined }}>{l.name}</p>
                      <p className="text-muted-foreground truncate" style={{ fontSize: "0.6875rem" }}>{l.french} • {l.hello}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-ippoo-green shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
