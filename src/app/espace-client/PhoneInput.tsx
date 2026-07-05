import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { AFRICAN_COUNTRIES, DEFAULT_COUNTRY, expectedDigits, formatNational, type AfricanCountry } from "./africanCountries";

interface Props {
  country: AfricanCountry;
  onCountryChange: (c: AfricanCountry) => void;
  digits: string;
  onDigitsChange: (d: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
}

export function PhoneInput({ country = DEFAULT_COUNTRY, onCountryChange, digits, onDigitsChange, label, required, id }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const expected = expectedDigits(country);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AFRICAN_COUNTRIES;
    return AFRICAN_COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  function handleInput(v: string) {
    const onlyDigits = v.replace(/\D/g, "").slice(0, expected);
    onDigitsChange(onlyDigits);
  }

  const formatted = formatNational(country, digits);
  const placeholder = country.example;

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label htmlFor={id} className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {label}{required && <span className="text-[#FF3B57]"> *</span>}
        </label>
      )}
      <div className="flex items-stretch rounded-xl border-2 border-black/10 focus-within:border-[#8A4BFF] transition-colors overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 border-r border-black/10 hover:bg-black/5"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span style={{ fontSize: "1.15rem" }}>{country.flag}</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>+{country.dial}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#666]" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          value={formatted}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 outline-none bg-transparent"
          style={{ fontSize: "0.95rem", letterSpacing: "0.02em" }}
        />
      </div>
      <p className="mt-1 text-[#888]" style={{ fontSize: "0.7rem" }}>
        Format attendu : +{country.dial} {country.example} ({expected} chiffres)
      </p>

      {open && (
        <div
          className="absolute z-50 mt-1.5 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-black/5 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-[#8A4BFF]"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {list.map((c) => {
              const selected = c.code === country.code;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => { onCountryChange(c); setOpen(false); setQuery(""); onDigitsChange(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 text-left"
                  >
                    <span style={{ fontSize: "1.15rem" }}>{c.flag}</span>
                    <span className="flex-1 truncate" style={{ fontSize: "0.88rem", fontWeight: 600 }}>{c.name}</span>
                    <span className="text-[#666]" style={{ fontSize: "0.8rem", fontWeight: 700 }}>+{c.dial}</span>
                    {selected && <Check className="w-4 h-4 text-[#8A4BFF]" />}
                  </button>
                </li>
              );
            })}
            {list.length === 0 && (
              <li className="px-4 py-6 text-center text-[#888]" style={{ fontSize: "0.85rem" }}>Aucun pays trouvé</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
