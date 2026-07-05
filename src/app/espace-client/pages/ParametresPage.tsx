import { useState, useEffect, type FormEvent } from "react";
import { Bell, Lock, Globe, Check, BellRing, BellOff, Mail, MessageSquare, Smartphone, Inbox, CalendarClock, Clock, XCircle, RefreshCw, Megaphone, FileText, Wallet, Settings, Gift, Copy, Download, Loader2, Database } from "lucide-react";
import type { NotifChannel, NotifPrefs, NotifTypeKey } from "../api";
import { useAuth } from "../AuthContext";
import { useApiData } from "../hooks";
import { api } from "../api";
import { toast } from "sonner";
import { useI18n, type Lang } from "../i18n";
import { pushStatus, isSubscribed, subscribeToPush, unsubscribeFromPush } from "../push";

export function ParametresPage() {
  const { session } = useAuth();
  const q = useApiData((tk) => api.settings(tk));
  const { lang: uiLang, setLang: setUiLang, t } = useI18n();
  const [lang, setLang] = useState("fr");
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    if (q.data?.settings) {
      setLang(q.data.settings.lang);
      setNotifySms(q.data.settings.notifySms);
      setNotifyEmail(q.data.settings.notifyEmail);
      if (["fr", "en", "fon"].includes(q.data.settings.lang) && q.data.settings.lang !== uiLang) {
        setUiLang(q.data.settings.lang as Lang);
      }
    }
  }, [q.data, uiLang, setUiLang]);

  async function saveSettings(updates: Partial<{ lang: string; notifySms: boolean; notifyEmail: boolean }>) {
    if (!session?.access_token) return;
    try {
      await api.updateSettings(session.access_token, updates);
      setSavedAt(Date.now());
      toast.success("Préférences enregistrées");
    } catch (err) {
      console.error("Save settings failed:", err);
      toast.error("Sauvegarde impossible");
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setPwdMsg(null);
    if (pwd.length < 8) { setPwdMsg({ type: "err", text: "8 caractères minimum." }); return; }
    if (pwd !== pwd2) { setPwdMsg({ type: "err", text: "Les mots de passe ne correspondent pas." }); return; }
    setPwdBusy(true);
    try {
      await api.changePassword(session.access_token, pwd);
      setPwd(""); setPwd2("");
      setPwdMsg({ type: "ok", text: "Mot de passe mis à jour." });
      toast.success("Mot de passe mis à jour");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setPwdMsg({ type: "err", text: msg });
      toast.error("Échec du changement", { description: msg });
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="t-title1">{t("settings.title")}</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>{t("settings.subtitle")}</p>
      </header>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#DDE7FF] flex items-center justify-center"><Bell className="w-5 h-5 text-[#2A6BFF]" /></div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>{t("settings.notifications")}</h2>
            <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>{t("settings.notifications.desc")}</p>
          </div>
        </div>
        <Toggle label={t("settings.sms")} checked={notifySms} onChange={(v) => { setNotifySms(v); saveSettings({ notifySms: v }); }} />
        <Toggle label={t("settings.email")} checked={notifyEmail} onChange={(v) => { setNotifyEmail(v); saveSettings({ notifyEmail: v }); }} />
        <PushToggle />
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EFE3FF] flex items-center justify-center"><Globe className="w-5 h-5 text-[#8A4BFF]" /></div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>{t("settings.lang")}</h2>
            <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>{t("settings.lang.desc")}</p>
          </div>
        </div>
        <select
          value={lang}
          onChange={(e) => {
            const v = e.target.value;
            setLang(v);
            saveSettings({ lang: v });
            if (v === "fr" || v === "en" || v === "fon") setUiLang(v);
          }}
          className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="fon">Fon</option>
        </select>
        {savedAt && (
          <p className="mt-3 text-[#0F7A47] flex items-center gap-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            <Check className="w-4 h-4" /> {t("settings.saved")}
          </p>
        )}
      </section>

      <NotifPrefsSection />

      <ReferralSection />

      <ExportSection />

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FFDDE2] flex items-center justify-center"><Lock className="w-5 h-5 text-[#C0263A]" /></div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>{t("settings.security")}</h2>
            <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>{t("settings.security.desc")}</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-3">
          <input type="password" placeholder="Nouveau mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
          <input type="password" placeholder="Confirmer le mot de passe" value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
          {pwdMsg && (
            <div className={`px-4 py-3 rounded-xl ${pwdMsg.type === "ok" ? "bg-[#DBFBE7] text-[#0F7A47]" : "bg-red-50 text-red-700 border border-red-200"}`} style={{ fontSize: "0.85rem" }}>
              {pwdMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwdBusy} className="w-full px-6 py-3 rounded-xl text-white disabled:opacity-60" style={{ background: "#FF3B57", fontWeight: 800 }}>
            {pwdBusy ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </form>
      </section>

    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ background: checked ? "#16B26A" : "#D1D5DB" }}
        aria-pressed={checked}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "1.4rem" : "0.125rem" }}
        />
      </button>
    </label>
  );
}

function PushToggle() {
  const { session } = useAuth();
  const [state, setState] = useState<"loading" | "off" | "on" | "denied" | "unsupported">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await pushStatus();
      if (s === "unsupported") return setState("unsupported");
      if (s === "denied") return setState("denied");
      setState((await isSubscribed()) ? "on" : "off");
    })();
  }, []);

  async function toggle() {
    if (!session?.access_token || busy) return;
    setBusy(true);
    try {
      if (state === "on") {
        await unsubscribeFromPush(session.access_token);
        setState("off");
        toast.success("Notifications push désactivées");
      } else {
        await subscribeToPush(session.access_token);
        setState("on");
        toast.success("Notifications push activées");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-3 py-3 t-subhead t-muted">
        <BellOff className="w-[18px] h-[18px]" /> Push non supporté sur cet appareil
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="flex items-center gap-3 py-3 t-subhead t-muted">
        <BellOff className="w-[18px] h-[18px]" /> Permission refusée — modifiez dans les réglages du navigateur
      </div>
    );
  }
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="flex items-center gap-2 t-body" style={{ color: "var(--ippoo-text)" }}>
        <BellRing className="w-[18px] h-[18px]" style={{ color: "var(--accent-primary)" }} />
        Notifications push
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={state === "on"}
        className="relative transition-colors disabled:opacity-60"
        style={{
          width: "48px", height: "28px", borderRadius: "9999px",
          background: state === "on" ? "var(--accent-primary)" : "var(--surface-sunken)",
        }}
      >
        <span
          className="absolute top-[3px] transition-all"
          style={{
            left: state === "on" ? "23px" : "3px",
            width: "22px", height: "22px", borderRadius: "9999px",
            background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </label>
  );
}

// Préférences avancées : matrice canaux × opt-out par type de rappel.
// Les changements sont enregistrés à la volée (PATCH partiel). Désactiver
// un type fait que le serveur saute simplement ce rappel lors du cycle —
// la clé d'idempotence est tout de même enregistrée pour ne pas retenter le
// lendemain.

const CHANNELS: { key: NotifChannel; label: string; Icon: typeof Inbox; hint: string }[] = [
  { key: "in_app", label: "Application", Icon: Inbox,       hint: "Toasts & cloche dans l'app" },
  { key: "push",   label: "Push",        Icon: BellRing,    hint: "Notifications du navigateur / mobile" },
  { key: "email",  label: "E-mail",      Icon: Mail,        hint: "Reçu sur votre adresse e-mail" },
  { key: "sms",    label: "SMS",         Icon: MessageSquare, hint: "Texto sur votre numéro mobile" },
];

const TYPES: { key: NotifTypeKey; label: string; Icon: typeof CalendarClock; hint: string }[] = [
  { key: "upcoming",  label: "Prélèvement à venir",     Icon: CalendarClock, hint: "Rappels J-3, J-1 et le jour J" },
  { key: "pending",   label: "Paiement en attente",     Icon: Clock,         hint: "Si un paiement reste en attente > 24h" },
  { key: "failed",    label: "Paiement échoué",         Icon: XCircle,       hint: "Si un prélèvement n'aboutit pas" },
  { key: "renewal",   label: "Renouvellement contrat",  Icon: RefreshCw,     hint: "Rappels J-7, J-1 et le jour J" },
  { key: "claim",     label: "Mise à jour sinistre",    Icon: FileText,      hint: "Changement de statut d'un sinistre" },
  { key: "payment",   label: "Confirmation paiement",   Icon: Wallet,        hint: "Reçu après un règlement validé" },
  { key: "broadcast", label: "Diffusion IPPOO",         Icon: Megaphone,     hint: "Messages de l'équipe IPPOO" },
  { key: "system",    label: "Système & sécurité",      Icon: Settings,      hint: "Activité de compte importante" },
];

function NotifPrefsSection() {
  const { session } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getNotifPrefs(session.access_token);
        if (!cancelled) setPrefs(res.prefs);
      } catch (err) {
        console.error("Load notif prefs failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.access_token]);

  async function update(patch: Partial<NotifPrefs>, key: string) {
    if (!session?.access_token || !prefs) return;
    // Optimistic update so the UI feels instant.
    const optimistic: NotifPrefs = {
      channels: { ...prefs.channels, ...(patch.channels ?? {}) },
      types:    { ...prefs.types,    ...(patch.types ?? {}) },
    };
    setPrefs(optimistic);
    setBusy(key);
    try {
      const res = await api.updateNotifPrefs(session.access_token, patch);
      setPrefs(res.prefs);
    } catch (err) {
      toast.error("Sauvegarde impossible", { description: err instanceof Error ? err.message : "Erreur" });
      // Rollback on error.
      setPrefs(prefs);
    } finally {
      setBusy(null);
    }
  }

  if (loading || !prefs) {
    return (
      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="h-5 w-48 bg-black/5 rounded animate-pulse mb-3" />
        <div className="h-32 bg-black/5 rounded animate-pulse" />
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FFE2CC] flex items-center justify-center">
          <BellRing className="w-5 h-5 text-[#B85400]" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Préférences avancées</h2>
          <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>
            Choisissez les canaux et les types de rappels que vous souhaitez recevoir.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em" }}>
          CANAUX DE RÉCEPTION
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CHANNELS.map(({ key, label, Icon, hint }) => {
            const on = prefs.channels[key] !== false;
            const k = `ch:${key}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => update({ channels: { [key]: !on } as any }, k)}
                disabled={busy === k}
                className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition disabled:opacity-60"
                style={{
                  border: `1.5px solid ${on ? "var(--accent-primary)" : "rgba(0,0,0,0.08)"}`,
                  background: on ? "rgba(255,59,87,0.06)" : "#fff",
                }}
                aria-pressed={on}
                title={hint}
              >
                <span className="flex items-center justify-between w-full">
                  <Icon className="w-4 h-4" style={{ color: on ? "var(--accent-primary)" : "#666" }} />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: on ? "#16B26A" : "#D1D5DB" }}
                  />
                </span>
                <span style={{ fontSize: "0.84rem", fontWeight: 800 }}>{label}</span>
                <span className="text-[#666]" style={{ fontSize: "0.7rem" }}>{hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[#666]" style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em" }}>
          TYPES DE RAPPELS
        </p>
        <ul className="divide-y divide-black/5">
          {TYPES.map(({ key, label, Icon, hint }) => {
            const on = prefs.types[key] !== false;
            const k = `ty:${key}`;
            return (
              <li key={key} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: on ? "rgba(255,59,87,0.10)" : "rgba(0,0,0,0.04)", color: on ? "var(--accent-primary)" : "#666" }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "0.88rem", fontWeight: 700 }}>{label}</p>
                    <p className="truncate text-[#666]" style={{ fontSize: "0.74rem" }}>{hint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => update({ types: { [key]: !on } as any }, k)}
                  disabled={busy === k}
                  className="relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60"
                  style={{ background: on ? "#16B26A" : "#D1D5DB" }}
                  aria-pressed={on}
                  aria-label={`${label} ${on ? "activé" : "désactivé"}`}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ left: on ? "1.4rem" : "0.125rem" }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ReferralSection() {
  const { session } = useAuth();
  const [data, setData] = useState<{ code: string; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.referral(session.access_token);
        if (!cancelled) setData(res);
      } catch (err) {
        console.error("Load referral failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.access_token]);

  async function copy() {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      toast.success("Code copié");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  }

  async function share() {
    if (!data?.code) return;
    const text = `Rejoignez-moi sur IPPOO Assurance avec mon code de parrainage : ${data.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: "IPPOO Assurance", text }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Message copié — partagez-le où vous voulez");
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FFDCEE] flex items-center justify-center">
          <Gift className="w-5 h-5 text-[#FF4FAE]" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Parrainage</h2>
          <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>Partagez votre code à vos proches.</p>
        </div>
      </div>
      {loading || !data ? (
        <div className="h-24 bg-black/5 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="flex items-center gap-2 p-4 rounded-xl bg-[#F5F6FA] border border-black/5">
            <code className="flex-1 truncate tracking-widest" style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.18em" }}>
              {data.code}
            </code>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-black/10 hover:border-[#FF3B57]"
              style={{ fontSize: "0.78rem", fontWeight: 700 }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#0F7A47]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 800, color: "#0E1320" }}>{data.count}</span> filleul{data.count > 1 ? "s" : ""} déjà inscrit{data.count > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white"
              style={{ background: "#FF3B57", fontSize: "0.78rem", fontWeight: 800 }}
            >
              <Smartphone className="w-3.5 h-3.5" /> Partager
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ExportSection() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  async function doExport() {
    if (!session?.access_token || busy) return;
    setBusy(true);
    try {
      const data = await api.exportAccountData(session.access_token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `ippoo-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch (err) {
      toast.error("Export impossible", { description: err instanceof Error ? err.message : "" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#DDE7FF] flex items-center justify-center">
          <Database className="w-5 h-5 text-[#2A6BFF]" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Mes données</h2>
          <p className="text-[#666]" style={{ fontSize: "0.8rem" }}>
            Téléchargez l'intégralité de vos données IPPOO (RGPD / loi béninoise 2017-20).
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={doExport}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-black/10 hover:border-[#2A6BFF] hover:bg-[#DDE7FF]/40 disabled:opacity-60"
        style={{ fontWeight: 800 }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? "Préparation..." : "Télécharger mes données (JSON)"}
      </button>
      <p className="mt-3 text-[#666]" style={{ fontSize: "0.74rem" }}>
        Inclus : profil, contrats, sinistres, paiements, bénéficiaires, documents, notifications, journal d'audit, code de parrainage.
      </p>
    </section>
  );
}
