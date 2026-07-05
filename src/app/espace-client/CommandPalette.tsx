import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, ArrowRight, LayoutDashboard, FileText, AlertTriangle, CreditCard, Users, FolderOpen, MessageCircle, Bell, Sparkles, CreditCard as CardIcon, User as UserIcon, Settings, MapPin, ShieldCheck } from "lucide-react";
import { useAuthedQuery } from "./hooks";
import { qk } from "./queryClient";
import { api } from "./api";

interface Item { id: string; title: string; subtitle?: string; to: string; icon: any; group: string; }

const PAGES: Item[] = [
  { id: "p-dash", title: "Tableau de bord", to: "/espace-client", icon: LayoutDashboard, group: "Pages" },
  { id: "p-contracts", title: "Mes contrats", to: "/espace-client/contrats", icon: FileText, group: "Pages" },
  { id: "p-sinistres", title: "Sinistres", to: "/espace-client/sinistres", icon: AlertTriangle, group: "Pages" },
  { id: "p-cotis", title: "Cotisations", to: "/espace-client/cotisations", icon: CreditCard, group: "Pages" },
  { id: "p-benef", title: "Bénéficiaires", to: "/espace-client/beneficiaires", icon: Users, group: "Pages" },
  { id: "p-docs", title: "Documents", to: "/espace-client/documents", icon: FolderOpen, group: "Pages" },
  { id: "p-msg", title: "Messagerie", to: "/espace-client/messagerie", icon: MessageCircle, group: "Pages" },
  { id: "p-notif", title: "Notifications", to: "/espace-client/notifications", icon: Bell, group: "Pages" },
  { id: "p-sub", title: "Souscrire", to: "/espace-client/souscription", icon: Sparkles, group: "Pages" },
  { id: "p-carte", title: "Ma carte IPPOO", to: "/espace-client/carte", icon: CardIcon, group: "Pages" },
  { id: "p-profil", title: "Profil", to: "/espace-client/profil", icon: UserIcon, group: "Pages" },
  { id: "p-kyc", title: "Vérification d'identité", to: "/espace-client/verification-identite", icon: ShieldCheck, group: "Pages" },
  { id: "p-prefs", title: "Paramètres", to: "/espace-client/parametres", icon: Settings, group: "Pages" },
  { id: "p-partners", title: "Partenaires santé", to: "/espace-client/partenaires", icon: MapPin, group: "Pages" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const contractsQ = useAuthedQuery(qk.contracts, (t) => api.contracts(t));
  const claimsQ = useAuthedQuery(qk.claims, (t) => api.claims(t));
  const docsQ = useAuthedQuery(qk.documents, (t) => api.documents(t));
  const benefQ = useAuthedQuery(qk.beneficiaries, (t) => api.beneficiaries(t));

  const items: Item[] = useMemo(() => {
    const dyn: Item[] = [
      ...(contractsQ.data?.contracts ?? []).map((c) => ({ id: `c-${c.id}`, title: c.product, subtitle: `Contrat · ${c.status}`, to: "/espace-client/contrats", icon: FileText, group: "Contrats" })),
      ...(claimsQ.data?.claims ?? []).map((c) => ({ id: `s-${c.id}`, title: c.type, subtitle: `Sinistre · ${c.status}`, to: "/espace-client/sinistres", icon: AlertTriangle, group: "Sinistres" })),
      ...(docsQ.data?.documents ?? []).map((d) => ({ id: `d-${d.id}`, title: d.name, subtitle: `Document · ${d.category}`, to: "/espace-client/documents", icon: FolderOpen, group: "Documents" })),
      ...(benefQ.data?.beneficiaries ?? []).map((b) => ({ id: `b-${b.id}`, title: b.name, subtitle: `Bénéficiaire · ${b.relation}`, to: "/espace-client/beneficiaires", icon: Users, group: "Bénéficiaires" })),
    ];
    const all = [...PAGES, ...dyn];
    if (!query.trim()) return all.slice(0, 12);
    const q = query.toLowerCase();
    return all.filter((it) => it.title.toLowerCase().includes(q) || (it.subtitle ?? "").toLowerCase().includes(q)).slice(0, 12);
  }, [query, contractsQ.data, claimsQ.data, docsQ.data, benefQ.data]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else setQuery(""); }, [open]);

  function pick(it: Item) {
    onClose();
    navigate(it.to);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === "Enter" && items[active]) { e.preventDefault(); pick(items[active]); }
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] bg-black/50" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5">
          <Search className="w-5 h-5 text-[#888]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Rechercher pages, contrats, sinistres..."
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: "0.95rem" }}
          />
          <kbd className="px-2 py-1 rounded bg-[#F0F1F5] text-[#666]" style={{ fontSize: "0.7rem" }}>ESC</kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-4 py-6 text-center text-[#666]" style={{ fontSize: "0.85rem" }}>Aucun résultat</li>
          )}
          {items.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            const Icon = it.icon;
            return (
              <div key={it.id}>
                {showGroup && (
                  <li className="px-3 pt-3 pb-1 text-[#888]" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", fontWeight: 800 }}>
                    {it.group.toUpperCase()}
                  </li>
                )}
                <li>
                  <button
                    onClick={() => pick(it)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${i === active ? "bg-[#FFF1F4]" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F5F6FA] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{it.title}</p>
                      {it.subtitle && <p className="text-[#666] truncate" style={{ fontSize: "0.75rem" }}>{it.subtitle}</p>}
                    </div>
                    {i === active && <ArrowRight className="w-4 h-4 text-[#FF3B57]" />}
                  </button>
                </li>
              </div>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
