import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Gauge, KeyRound,
  Loader2, RefreshCw, ShieldAlert, Trash2, Webhook, X, Zap,
} from "lucide-react";
import { useAdminAuth, useAdminData } from "../AdminLayout";
import { api } from "../../espace-client/api";
import { RowSkeleton } from "../../espace-client/Skeleton";
import { formatDate } from "../../espace-client/hooks";

type SectionKey = "health" | "webhooks" | "reconcile" | "roles" | "sessions" | "ratelimit" | "incidents" | "chain" | "erase";
const SECTIONS: { key: SectionKey; label: string; icon: any; supOnly?: boolean }[] = [
  { key: "health", label: "Santé système", icon: Activity },
  { key: "webhooks", label: "Webhooks PSP", icon: Webhook },
  { key: "reconcile", label: "Réconciliation paiements", icon: RefreshCw },
  { key: "sessions", label: "Sessions admin", icon: ShieldAlert },
  { key: "ratelimit", label: "Rate-limit", icon: Gauge },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
  { key: "chain", label: "Chaîne audit", icon: CheckCircle2 },
  { key: "roles", label: "Rôles admin", icon: KeyRound, supOnly: true },
  { key: "erase", label: "Effacement RGPD", icon: Trash2, supOnly: true },
];

export function SystemPage() {
  const { session } = useAdminAuth();
  const [section, setSection] = useState<SectionKey>("health");
  const isSup = session?.role === "superadmin";

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-4">
        <h1 className="t-title1">Opérations système</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.85rem" }}>
          Webhooks PSP, santé, rôles, sessions et outils de réconciliation/effacement.
        </p>
      </header>

      <nav className="bg-white rounded-2xl border border-black/5 p-2 mb-4 flex flex-wrap gap-1">
        {SECTIONS.filter((s) => !s.supOnly || isSup).map((s) => {
          const Icon = s.icon; const on = section === s.key;
          return (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${on ? "bg-[#0E1320] text-white" : "text-[#0E1320] hover:bg-black/5"}`}
              style={{ fontSize: "0.8rem", fontWeight: 700 }}>
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {section === "health" && <HealthSection />}
      {section === "webhooks" && <WebhooksSection />}
      {section === "reconcile" && <ReconcileSection />}
      {section === "sessions" && <SessionsSection />}
      {section === "ratelimit" && <RateLimitSection />}
      {section === "incidents" && <IncidentsSection />}
      {section === "chain" && <ChainSection />}
      {section === "roles" && isSup && <RolesSection />}
      {section === "erase" && isSup && <EraseSection />}
    </div>
  );
}

// ---- D4 — Santé système ----
function HealthSection() {
  const q = useAdminData((t) => api.adminSystemHealth(t));
  const d = q.data;
  if (q.loading && !d) return <RowSkeleton />;
  if (q.error) return <ErrorCard msg={q.error} reload={q.reload} />;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <Header title="Base de données" />
        <div className="flex items-center gap-3">
          <Pill ok={d.db.ok} okLabel="OK" koLabel="KO" />
          <span className="text-[#666]" style={{ fontSize: "0.82rem" }}>Latence {d.db.latencyMs} ms</span>
          <button onClick={q.reload} className="ml-auto text-[#666] hover:text-[#0E1320]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
            <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Rafraîchir
          </button>
        </div>
      </div>
      <Group title="Intégrations">
        {Object.entries(d.integrations).map(([k, v]) => (
          <KvRow key={k} k={labelFor(k)} v={<Pill ok={v} />} />
        ))}
      </Group>
      <Group title="PSP">
        {Object.entries(d.psp).map(([k, v]) => (
          <KvRow key={k} k={k.toUpperCase()} v={<Pill ok={v} okLabel="Configuré" koLabel="Non configuré" />} />
        ))}
      </Group>
      <Group title="Crons">
        {d.crons.map((c) => (
          <KvRow key={c.name} k={c.name} v={
            <span className="text-[#666]" style={{ fontSize: "0.8rem" }}>
              {c.lastRunAt ? formatDate(c.lastRunAt) : "jamais"} {c.lastOk === false ? "⚠️" : c.lastOk ? "✓" : ""}
            </span>
          } />
        ))}
      </Group>
      <Group title="Webhooks PSP (24 h)">
        <KvRow k="Total enregistrés" v={<b>{d.webhooks.total}</b>} />
        <KvRow k="OK" v={<b className="text-[#16B26A]">{d.webhooks.ok24h}</b>} />
        <KvRow k="Échec" v={<b className={d.webhooks.failed24h > 0 ? "text-[#FF3B57]" : ""}>{d.webhooks.failed24h}</b>} />
      </Group>
    </div>
  );
}

function labelFor(k: string) {
  return ({ resend: "Resend (email)", termii: "Termii (SMS)", vapid: "VAPID (push)", adminTotp: "TOTP admin" } as Record<string, string>)[k] ?? k;
}

// ---- D1 — Webhooks PSP ----
function WebhooksSection() {
  const [filter, setFilter] = useState<"all" | "failed" | "ok">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const q = useAdminData(useCallback((t) => api.adminWebhooks(t, { filter, limit: 200 }), [filter]));
  const { session } = useAdminAuth();

  const replay = async (id: string) => {
    if (!session) return;
    if (!confirm("Replayer ce webhook ? Le PSP recevra à nouveau le payload.")) return;
    try {
      const r = await api.adminWebhookReplay(session.token, id);
      toast.success(`Replay envoyé — HTTP ${r.httpStatus}`);
      q.reload();
    } catch (err) {
      toast.error(`Replay échec: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {(["all", "failed", "ok"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg ${filter === f ? "bg-[#0E1320] text-white" : "bg-white border border-black/5"}`}
            style={{ fontSize: "0.78rem", fontWeight: 700 }}>
            {f === "all" ? "Tous" : f === "failed" ? "Échecs" : "Réussis"}
          </button>
        ))}
        <button onClick={q.reload} className="ml-auto text-[#666] hover:text-[#0E1320]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Rafraîchir
        </button>
      </div>
      {q.loading && !q.data && <RowSkeleton />}
      {q.error && <ErrorCard msg={q.error} reload={q.reload} />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {(q.data?.events ?? []).map((e) => (
          <div key={e.id} className="p-3 flex items-start gap-3">
            <Pill ok={e.status === "ok"} okLabel="OK" koLabel={e.status === "failed" ? "ÉCHEC" : "SKIP"} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>{e.provider.toUpperCase()} <span className="text-[#999]" style={{ fontSize: "0.72rem", fontWeight: 600 }}>· {e.path}</span></p>
              <p className="text-[#666] truncate" style={{ fontSize: "0.78rem" }}>
                {formatDate(e.receivedAt)} · HTTP {e.httpStatus} · {e.bytes} octets{e.reason ? ` · ${e.reason}` : ""}
                {e.replayedAt ? ` · replay ${formatDate(e.replayedAt)} par ${e.replayedBy ?? "?"}` : ""}
              </p>
            </div>
            <button onClick={() => setSelected(e.id)} className="px-2 py-1 rounded-lg bg-[#F5F6FA] hover:bg-black/10" style={{ fontSize: "0.72rem", fontWeight: 700 }}>Détails</button>
            {e.status === "failed" && (
              <button onClick={() => replay(e.id)} className="px-2 py-1 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                <Zap className="w-3 h-3 inline mr-1" /> Replay
              </button>
            )}
          </div>
        ))}
        {!q.loading && (q.data?.events ?? []).length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucun webhook enregistré pour ce filtre.</div>
        )}
      </div>
      {selected && <WebhookDetailModal id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function WebhookDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useAdminData(useCallback((t) => api.adminWebhookDetail(t, id), [id]));
  const e = q.data?.event;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
        <div className="p-4 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white z-10">
          <p style={{ fontSize: "0.95rem", fontWeight: 800 }}>Webhook {e?.provider ?? ""}</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {q.loading && <RowSkeleton />}
          {e && (
            <>
              <KvRow k="ID" v={<code style={{ fontSize: "0.74rem" }}>{e.id}</code>} />
              <KvRow k="Reçu le" v={formatDate(e.receivedAt)} />
              <KvRow k="Status" v={<Pill ok={e.status === "ok"} okLabel="OK" koLabel={e.status.toUpperCase()} />} />
              {e.reason && <KvRow k="Raison" v={e.reason} />}
              <KvRow k="HTTP" v={String(e.httpStatus ?? "-")} />
              <details>
                <summary className="cursor-pointer text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Headers</summary>
                <pre className="mt-2 p-2 bg-[#F5F6FA] rounded text-[#222] overflow-x-auto" style={{ fontSize: "0.72rem" }}>{JSON.stringify(e.headers, null, 2)}</pre>
              </details>
              <details open>
                <summary className="cursor-pointer text-[#666]" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Body brut</summary>
                <pre className="mt-2 p-2 bg-[#F5F6FA] rounded text-[#222] overflow-x-auto whitespace-pre-wrap" style={{ fontSize: "0.72rem" }}>{e.body || "(vide)"}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- D2 — Réconciliation ----
function ReconcileSection() {
  const [olderMin, setOlderMin] = useState(10);
  const q = useAdminData(useCallback((t) => api.adminReconcile(t, olderMin), [olderMin]));
  const { session } = useAdminAuth();

  const force = async (userId: string, paymentId: string) => {
    if (!session) return;
    const motif = window.prompt("Motif (5 caractères min) :", "");
    if (!motif || motif.length < 5) { toast.error("Motif trop court"); return; }
    try {
      await api.adminForceConfirmPayment(session.token, userId, paymentId, motif);
      toast.success("Paiement forcé en confirmé");
      q.reload();
    } catch (err) {
      toast.error(`Échec: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 bg-white rounded-2xl border border-black/5 p-3">
        <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Paiements en attente depuis ≥</label>
        <input type="number" min={1} max={1440} value={olderMin} onChange={(e) => setOlderMin(Math.max(1, Number(e.target.value) || 10))}
          className="px-2 py-1 rounded border border-black/10 w-20" />
        <span style={{ fontSize: "0.8rem" }}>min</span>
        <button onClick={q.reload} className="ml-auto px-3 py-1.5 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Réconcilier
        </button>
      </div>
      {q.loading && <RowSkeleton />}
      {q.error && <ErrorCard msg={q.error} reload={q.reload} />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {(q.data?.pending ?? []).map((row) => (
          <div key={`${row.userId}:${row.payment.id}`} className="p-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#FFB020] mt-1" />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>{row.userName || row.userEmail || row.userId.slice(0, 8)}</p>
              <p className="text-[#666] truncate" style={{ fontSize: "0.78rem" }}>
                {row.payment.amount} {row.payment.currency ?? "XOF"} · {row.payment.method ?? "?"} · créé {formatDate(row.payment.createdAt)}
              </p>
            </div>
            <button onClick={() => force(row.userId, row.payment.id)} className="px-2 py-1 rounded-lg bg-[#16B26A] text-white" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
              Forcer confirmé
            </button>
          </div>
        ))}
        {!q.loading && (q.data?.pending ?? []).length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucun paiement à réconcilier.</div>
        )}
      </div>
    </div>
  );
}

// ---- D3 — Rôles admin ----
function RolesSection() {
  const q = useAdminData((t) => api.adminRoles(t));
  const { session } = useAdminAuth();
  const [newU, setNewU] = useState(""); const [newR, setNewR] = useState<"operator" | "support" | "superadmin">("operator"); const [newP, setNewP] = useState("");
  const add = async () => {
    if (!session) return;
    if (!newU.trim() || newP.length < 12) { toast.error("Identifiant requis et mdp ≥12"); return; }
    try {
      await api.adminAddRole(session.token, newU.trim(), newR, newP);
      toast.success("Rôle créé");
      setNewU(""); setNewP("");
      q.reload();
    } catch (err) { toast.error((err as Error).message); }
  };
  const rm = async (u: string) => {
    if (!session) return;
    if (!confirm(`Supprimer ${u} ?`)) return;
    try { await api.adminRemoveRole(session.token, u); toast.success("Supprimé"); q.reload(); }
    catch (err) { toast.error((err as Error).message); }
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <Header title="Ajouter un compte" />
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Identifiant"><input value={newU} onChange={(e) => setNewU(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-48" /></Field>
          <Field label="Rôle">
            <select value={newR} onChange={(e) => setNewR(e.target.value as any)} className="px-2 py-1.5 rounded border border-black/10">
              <option value="operator">operator</option>
              <option value="support">support</option>
              <option value="superadmin">superadmin</option>
            </select>
          </Field>
          <Field label="Mot de passe (≥12)"><input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-56" /></Field>
          <button onClick={add} className="px-3 py-1.5 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Créer</button>
        </div>
      </div>
      {q.loading && <RowSkeleton />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {(q.data?.roles ?? []).map((r) => (
          <div key={r.username} className="p-3 flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-[#666]" />
            <div className="flex-1">
              <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>{r.username} <span className="ml-2 px-1.5 py-0.5 rounded bg-[#F5F6FA] text-[#666]" style={{ fontSize: "0.66rem" }}>{r.role}</span></p>
              <p className="text-[#888]" style={{ fontSize: "0.72rem" }}>créé {formatDate(r.createdAt)} par {r.createdBy}</p>
            </div>
            <button onClick={() => rm(r.username)} className="px-2 py-1 rounded-lg bg-[#FFE5EB] text-[#C0263A]" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
              <Trash2 className="w-3 h-3 inline" />
            </button>
          </div>
        ))}
        {!q.loading && (q.data?.roles ?? []).length === 0 && (
          <div className="p-6 text-center text-[#666]">Aucun rôle additionnel — seuls les comptes ENV ADMIN_ACCOUNTS sont actifs.</div>
        )}
      </div>
    </div>
  );
}

// ---- D9 — Sessions admin ----
function SessionsSection() {
  const q = useAdminData((t) => api.adminSessions(t));
  const { session } = useAdminAuth();
  const isSup = session?.role === "superadmin";
  const revoke = async (jti: string) => {
    if (!session) return;
    if (!confirm("Révoquer cette session ?")) return;
    try { await api.adminRevokeSession(session.token, jti); toast.success("Session révoquée"); q.reload(); }
    catch (err) { toast.error((err as Error).message); }
  };
  return (
    <div>
      {q.loading && !q.data && <RowSkeleton />}
      {q.error && <ErrorCard msg={q.error} reload={q.reload} />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {(q.data?.sessions ?? []).map((s) => (
          <div key={s.jti} className="p-3 flex items-center gap-3">
            <ShieldAlert className={`w-4 h-4 ${s.current ? "text-[#16B26A]" : "text-[#666]"}`} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.86rem", fontWeight: 800 }}>
                {s.username} <span className="ml-2 px-1.5 py-0.5 rounded bg-[#F5F6FA] text-[#666]" style={{ fontSize: "0.66rem" }}>{s.role}</span>
                {s.current && <span className="ml-2 px-1.5 py-0.5 rounded bg-[#E6F9EF] text-[#0F7A47]" style={{ fontSize: "0.66rem", fontWeight: 800 }}>VOUS</span>}
              </p>
              <p className="text-[#888] truncate" style={{ fontSize: "0.72rem" }}>{s.ip} · {formatDate(s.createdAt)} · {s.ua?.slice(0, 80) ?? ""}</p>
            </div>
            {isSup && !s.current && (
              <button onClick={() => revoke(s.jti)} className="px-2 py-1 rounded-lg bg-[#FFE5EB] text-[#C0263A]" style={{ fontSize: "0.72rem", fontWeight: 700 }}>Révoquer</button>
            )}
          </div>
        ))}
        {!q.loading && (q.data?.sessions ?? []).length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucune session enregistrée (sessions pré-D9 invisibles).</div>
        )}
      </div>
    </div>
  );
}

// ---- D10 — Rate-limit ----
function RateLimitSection() {
  const q = useAdminData((t) => api.adminRateLimitStatus(t));
  const { session } = useAdminAuth();
  const clear = async (key: string) => {
    if (!session) return;
    try { await api.adminRateLimitClear(session.token, key); toast.success("Bucket vidé"); q.reload(); }
    catch (err) { toast.error((err as Error).message); }
  };
  return (
    <div>
      {q.loading && !q.data && <RowSkeleton />}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
        {(q.data?.buckets ?? []).map((b) => (
          <div key={b.key} className="p-3 flex items-center gap-3">
            <Gauge className="w-4 h-4 text-[#666]" />
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: "0.84rem", fontWeight: 800 }}>{b.key}</p>
              <p className="text-[#888]" style={{ fontSize: "0.72rem" }}>{b.hits} hits · fenêtre {b.windowSec}s · restant {b.remaining}{b.resetAt ? ` · reset ${formatDate(b.resetAt)}` : ""}</p>
            </div>
            <button onClick={() => clear(b.key)} className="px-2 py-1 rounded-lg bg-[#F5F6FA] hover:bg-black/10" style={{ fontSize: "0.72rem", fontWeight: 700 }}>Vider</button>
          </div>
        ))}
        {!q.loading && (q.data?.buckets ?? []).length === 0 && (
          <div className="p-10 text-center text-[#666]">Aucun bucket actif.</div>
        )}
      </div>
    </div>
  );
}

// ---- D8 — Incidents ----
function IncidentsSection() {
  const q = useAdminData((t) => api.adminIncidentAcks(t));
  const { session } = useAdminAuth();
  const [id, setId] = useState(""); const [note, setNote] = useState("");
  const ack = async () => {
    if (!session || !id.trim()) return;
    try { await api.adminAckIncident(session.token, id.trim(), note); toast.success("Incident acquitté"); setId(""); setNote(""); q.reload(); }
    catch (err) { toast.error((err as Error).message); }
  };
  const entries = useMemo(() => Object.entries(q.data?.acks ?? {}), [q.data]);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <Header title="Acquitter un incident" />
        <div className="flex flex-wrap items-end gap-2">
          <Field label="ID incident"><input value={id} onChange={(e) => setId(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-64" placeholder="ex. PSP-2026-05-30-001" /></Field>
          <Field label="Note (optionnelle)"><input value={note} onChange={(e) => setNote(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-80" /></Field>
          <button onClick={ack} className="px-3 py-1.5 rounded-lg bg-[#0E1320] text-white" style={{ fontSize: "0.78rem", fontWeight: 700 }}>Acquitter</button>
        </div>
      </div>
      <Group title="Acquittements">
        {entries.length === 0 && <p className="p-4 text-center text-[#666]">Aucun incident acquitté.</p>}
        {entries.map(([k, v]) => (
          <KvRow key={k} k={k} v={<span className="text-[#666]" style={{ fontSize: "0.78rem" }}>par <b>{v.by}</b> · {formatDate(v.at)}{v.note ? ` · ${v.note}` : ""}</span>} />
        ))}
      </Group>
    </div>
  );
}

// ---- D11 — Vérification chaîne audit ----
function ChainSection() {
  const [data, setData] = useState<{ ok: boolean; total: number; brokenAt: number | null; tip: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { session } = useAdminAuth();
  const verify = async () => {
    if (!session) return;
    setBusy(true);
    try { setData(await api.adminVerifyAuditChain(session.token)); }
    catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => { verify(); /* eslint-disable-next-line */ }, []);
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Header title="Vérification de l'intégrité du journal" />
        <button onClick={verify} disabled={busy} className="px-3 py-1.5 rounded-lg bg-[#0E1320] text-white disabled:opacity-50" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
          {busy ? <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
          Re-vérifier
        </button>
      </div>
      {!data && busy && <RowSkeleton />}
      {data && (
        <div className="space-y-2">
          <KvRow k="Status" v={data.ok
            ? <span className="text-[#16B26A]" style={{ fontWeight: 800 }}>✓ INTACT</span>
            : <span className="text-[#FF3B57]" style={{ fontWeight: 800 }}>✗ ROMPU à la position {data.brokenAt}</span>} />
          <KvRow k="Entrées vérifiées" v={String(data.total)} />
          <KvRow k="Tip courant" v={<code style={{ fontSize: "0.72rem" }}>{data.tip.slice(0, 32)}…</code>} />
        </div>
      )}
    </div>
  );
}

// ---- D12 — Effacement RGPD ----
function EraseSection() {
  const { session } = useAdminAuth();
  const [uid, setUid] = useState(""); const [confirm, setConfirm] = useState("");
  const erase = async () => {
    if (!session) return;
    if (!uid.trim()) return;
    try {
      const r = await api.adminEraseUser(session.token, uid.trim(), confirm);
      toast.success(`Effacé : ${r.erased} clés`);
      setUid(""); setConfirm("");
    } catch (err) { toast.error((err as Error).message); }
  };
  const prefix = uid.slice(0, 8);
  return (
    <div className="bg-white rounded-2xl border border-[#FFE5EB] p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-[#C0263A]" />
        <Header title="Effacement RGPD irréversible" />
      </div>
      <p className="text-[#666] mb-3" style={{ fontSize: "0.8rem" }}>
        Supprime toutes les clés KV liées à un userId (~20 namespaces) ET le compte Supabase Auth. Action auditée et chaînée.
      </p>
      <Field label="UserId Supabase">
        <input value={uid} onChange={(e) => setUid(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-80" placeholder="uuid…" />
      </Field>
      {uid && (
        <Field label={`Tape EFFACER ${prefix} pour confirmer`}>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="px-2 py-1.5 rounded border border-black/10 w-80" />
        </Field>
      )}
      <button onClick={erase} disabled={!uid || confirm !== `EFFACER ${prefix}`} className="mt-2 px-3 py-1.5 rounded-lg bg-[#C0263A] text-white disabled:opacity-40" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
        Effacer définitivement
      </button>
    </div>
  );
}

// ---- atoms ----
function Group({ title, children }: { title: string; children: any }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-4">
      <Header title={title} />
      <div className="divide-y divide-black/5">{children}</div>
    </div>
  );
}
function Header({ title }: { title: string }) {
  return <p className="mb-2 text-[#666]" style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>{title.toUpperCase()}</p>;
}
function KvRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="py-2 flex items-center gap-3">
      <span className="text-[#666]" style={{ fontSize: "0.8rem" }}>{k}</span>
      <span className="ml-auto" style={{ fontSize: "0.82rem" }}>{v}</span>
    </div>
  );
}
function Pill({ ok, okLabel = "OK", koLabel = "KO" }: { ok: boolean; okLabel?: string; koLabel?: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded" style={{
      fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.04em",
      background: ok ? "#E6F9EF" : "#FFE5EB", color: ok ? "#0F7A47" : "#C0263A",
    }}>{ok ? okLabel : koLabel}</span>
  );
}
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="block">
      <span className="block mb-1 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}
function ErrorCard({ msg, reload }: { msg: string; reload: () => void }) {
  return (
    <div className="bg-[#FFE5EB] text-[#C0263A] rounded-2xl p-4 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <p className="flex-1" style={{ fontSize: "0.82rem" }}>{msg}</p>
      <button onClick={reload} className="px-2 py-1 rounded bg-white" style={{ fontSize: "0.74rem", fontWeight: 700 }}>Réessayer</button>
    </div>
  );
}
