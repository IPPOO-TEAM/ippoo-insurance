import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search, X, Loader2, User } from "lucide-react";
import { agentApi } from "../api";

type Result = { userId: string; name: string; email: string; phone: string; memberNumber: string; city: string };

export function GlobalSearch({ token, onClose }: { token: string; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounce 250 ms : on lance la requête seulement quand l'utilisateur arrête
  // de taper, sinon le serveur scannerait la base à chaque frappe.
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setError(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await agentApi.search(token, q.trim());
        setResults(res.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, token]);

  function open(uid: string) {
    onClose();
    navigate(`/agent/clients/${uid}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-8"
      style={{ background: "rgba(14,19,32,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl overflow-hidden"
        style={{ background: "var(--surface-card)", boxShadow: "0 20px 60px rgba(14,19,32,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--line-hairline)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--ippoo-text-muted)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && results[0]) open(results[0].userId); }}
            placeholder="Nom, email, téléphone, n° de membre…"
            className="flex-1 bg-transparent focus:outline-none"
            style={{ fontSize: "16px" }}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--ippoo-text-muted)" }} />}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="px-4 py-3 text-red-700" style={{ fontSize: "0.85rem" }}>{error}</p>
          )}
          {!error && q.trim().length < 2 && (
            <p className="px-4 py-8 text-center" style={{ fontSize: "0.85rem", color: "var(--ippoo-text-muted)" }}>
              Tapez au moins 2 caractères.
            </p>
          )}
          {!error && q.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="px-4 py-8 text-center" style={{ fontSize: "0.85rem", color: "var(--ippoo-text-muted)" }}>
              Aucun client ne correspond.
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.userId}
              onClick={() => open(r.userId)}
              className="w-full text-left px-3 py-3 flex items-center gap-3 active:scale-[0.99] transition"
              style={{ borderBottom: "1px solid var(--line-hairline)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,59,87,0.10)", color: "var(--accent-primary)" }}>
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                  {r.name || r.email || "—"}
                </p>
                <p className="truncate" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>
                  {[r.email, r.phone, r.memberNumber && `#${r.memberNumber}`, r.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
