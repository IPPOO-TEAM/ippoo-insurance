import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router";
import { RefreshCw, Search, Users, UserPlus, Copy, Check, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../espace-client/AuthContext";
import { getSupabase } from "../../espace-client/supabaseClient";
import { agentApi } from "../api";
import { ListSkeleton } from "../components/ListStates";

type Client = Awaited<ReturnType<typeof agentApi.portfolio>>["clients"][number];

export function AgentPortfolioPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const { me } = useOutletContext<{ me: { matricule?: string } | null }>() ?? { me: null };
  const myMatricule = me?.matricule ?? "";
  const inviteLink = useMemo(() => {
    if (!myMatricule || typeof window === "undefined") return "";
    return `${window.location.origin}/inscription?ref=${encodeURIComponent(myMatricule)}`;
  }, [myMatricule]);
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  async function reload() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agentApi.portfolio(token);
      setItems(res.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token]);

  // Realtime : si un autre conseiller (ré)assigne un client, ou si une nouvelle
  // conversation est routée vers ce conseiller, on rafraîchit le portefeuille.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let t: any = null;
    const ch = sb.channel("assignments:live")
      .on("broadcast", { event: "assignments:dirty" }, () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => reloadRef.current(), 1500);
      })
      .subscribe();
    return () => { if (t) clearTimeout(t); sb.removeChannel(ch); };
  }, []);

  const s = q.trim().toLowerCase();
  const mineCount = myMatricule ? items.filter((c) => c.enrolledBy === myMatricule).length : 0;
  const filtered = items.filter((c) => {
    if (mineOnly && myMatricule && c.enrolledBy !== myMatricule) return false;
    if (!s) return true;
    return `${c.userName} ${c.userEmail} ${c.memberNumber}`.toLowerCase().includes(s);
  });

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.025em" }}>
            Mon portefeuille
          </h1>
          <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ippoo-text-muted)" }}>
            {items.length} client(s) attribué(s)
          </p>
        </div>
        <button
          onClick={reload}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ border: "1px solid var(--line-hairline)", background: "var(--surface-card)" }}
          aria-label="Recharger"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div
        className="flex items-center gap-2 px-3 rounded-2xl mb-3"
        style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", minHeight: 44 }}
      >
        <Search className="w-[18px] h-[18px]" style={{ color: "var(--ippoo-text-muted)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="flex-1 bg-transparent focus:outline-none"
          style={{ fontSize: "16px" }}
        />
      </div>

      {myMatricule && (
        <div className="flex items-center gap-2 mb-3" style={{ fontSize: "0.78rem" }}>
          <button
            onClick={() => setMineOnly(false)}
            className="px-3 py-1.5 rounded-full active:scale-95 transition"
            style={{
              background: !mineOnly ? "var(--accent-primary)" : "var(--surface-card)",
              color: !mineOnly ? "white" : "var(--ippoo-text)",
              border: "1px solid " + (!mineOnly ? "transparent" : "var(--line-hairline)"),
              fontWeight: 800,
            }}
          >
            Tous ({items.length})
          </button>
          <button
            onClick={() => setMineOnly(true)}
            className="px-3 py-1.5 rounded-full active:scale-95 transition"
            style={{
              background: mineOnly ? "var(--accent-primary)" : "var(--surface-card)",
              color: mineOnly ? "white" : "var(--ippoo-text)",
              border: "1px solid " + (mineOnly ? "transparent" : "var(--line-hairline)"),
              fontWeight: 800,
            }}
          >
            Mes filleuls ({mineCount})
          </button>
        </div>
      )}

      {myMatricule && (
        <div className="rounded-2xl p-3.5 mb-3" style={{ background: "linear-gradient(135deg, rgba(255,59,87,0.06), rgba(255,122,0,0.06))", border: "1px solid rgba(255,59,87,0.20)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-primary)", color: "white" }}>
              <UserPlus className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--ippoo-text)" }}>Enrôler un nouveau client</p>
              <p className="mt-0.5" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)", lineHeight: 1.4 }}>
                Le client est rattaché à votre matricule {myMatricule} (commissions + portefeuille).
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white active:scale-95 transition"
                  style={{ background: "var(--accent-primary)", fontSize: "0.78rem", fontWeight: 800 }}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Créer un compte
                </button>
                <button
                  onClick={async () => {
                    if (!inviteLink) return;
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      setCopied(true);
                      toast.success("Lien d'invitation copié");
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      toast.error("Impossible de copier — copiez à la main");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", fontSize: "0.78rem", fontWeight: 800, color: "var(--ippoo-text)" }}
                  title={inviteLink}
                >
                  {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#0F7A47" }} /> : <Copy className="w-3.5 h-3.5" />}
                  Copier le lien
                </button>
              </div>
              {inviteLink && (
                <p className="mt-1.5 inline-flex items-center gap-1 truncate max-w-full" style={{ fontSize: "0.66rem", color: "var(--ippoo-text-muted)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                  <LinkIcon className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{inviteLink}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-3" style={{ fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-3xl" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}>
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--ippoo-text-muted)", opacity: 0.4 }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ippoo-text-muted)" }}>
            Aucun client attribué pour l'instant.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.userId}>
              <Link
                to={`/agent/clients/${c.userId}`}
                className="block px-4 py-3 rounded-2xl active:scale-[0.99] transition"
                style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)" }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="truncate" style={{ fontSize: "0.92rem", fontWeight: 800 }}>
                    {c.userName || c.userEmail || "—"}
                  </p>
                  {myMatricule && c.enrolledBy === myMatricule && (
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,59,87,0.12)", color: "var(--accent-primary)", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.04em" }}>
                      FILLEUL
                    </span>
                  )}
                  {!c.assigned && (
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "var(--ippoo-text-muted)", fontSize: "0.62rem", fontWeight: 800 }}>
                      non assigné
                    </span>
                  )}
                </div>
                <p className="truncate" style={{ fontSize: "0.75rem", color: "var(--ippoo-text-muted)" }}>
                  {c.memberNumber ? `${c.memberNumber} · ` : ""}
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "Aucun message"}
                </p>
                {c.lastMessagePreview && (
                  <p className="truncate mt-1" style={{ fontSize: "0.78rem", color: "var(--ippoo-text-muted)" }}>
                    « {c.lastMessagePreview} »
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {createOpen && (
        <CreateClientModal
          token={token}
          matricule={myMatricule}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// Modale d'enrôlement client par le conseiller. Le mot de passe est généré ou
// fourni — le client le réinitialisera de son côté via le flow standard. Email
// auto-confirmé côté serveur (pas de serveur SMTP) donc le client peut se
// connecter immédiatement.
function CreateClientModal({ token, matricule, onClose, onCreated }: { token: string; matricule: string; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(() => {
    // Mot de passe initial aléatoire de 10 chars (chiffres + lettres). Le
    // conseiller peut le modifier avant envoi et doit le transmettre au client
    // de vive voix — il pourra le changer après la 1ère connexion.
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await agentApi.createClient(token, { email: email.trim().toLowerCase(), name: name.trim(), phone: phone.trim() || undefined, password });
      toast.success("Compte client créé", { description: `${res.email} · n° ${res.memberNumber}` });
      onCreated();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4" style={{ background: "rgba(14,19,32,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "var(--surface-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--line-hairline)" }}>
          <div className="min-w-0">
            <p style={{ fontSize: "1.05rem", fontWeight: 900 }}>Créer un compte client</p>
            <p className="mt-0.5" style={{ fontSize: "0.74rem", color: "var(--ippoo-text-muted)" }}>Attribué à {matricule}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--line-hairline)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
          <Field label="Nom complet" required>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Awa Sokpa" className="w-full px-3 py-3 rounded-xl focus:outline-none" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }} />
          </Field>
          <Field label="Email" required>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" className="w-full px-3 py-3 rounded-xl focus:outline-none" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }} />
          </Field>
          <Field label="Téléphone (optionnel)">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 …" className="w-full px-3 py-3 rounded-xl focus:outline-none" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px" }} />
          </Field>
          <Field label="Mot de passe temporaire" required hint="À transmettre au client. Il pourra le modifier après connexion.">
            <input required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-3 rounded-xl focus:outline-none" style={{ background: "var(--surface-app)", border: "1px solid var(--line-hairline)", fontSize: "16px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }} />
          </Field>
          {err && <p className="px-3 py-2 rounded-lg" style={{ background: "#FFE2E7", color: "#C0263A", fontSize: "0.82rem", fontWeight: 700 }}>{err}</p>}
          <button type="submit" disabled={submitting} className="w-full px-4 py-3 rounded-xl text-white disabled:opacity-50" style={{ background: "var(--accent-primary)", fontSize: "0.92rem", fontWeight: 800 }}>
            {submitting ? "Création…" : "Créer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1" style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--ippoo-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "var(--accent-primary)" }}> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block" style={{ fontSize: "0.7rem", color: "var(--ippoo-text-muted)" }}>{hint}</span>}
    </label>
  );
}
