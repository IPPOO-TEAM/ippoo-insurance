import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save, Camera, Trash2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useApiData } from "../hooks";
import { api } from "../api";
import { MemberIdCard } from "../components/MemberIdCard";
import { BiometricSection } from "../components/BiometricSection";
import { UserAvatar } from "../components/UserAvatar";

export function ProfilPage() {
  const { session, user } = useAuth();
  const meQ = useApiData((t) => api.me(t));
  const [form, setForm] = useState({
    name: "",
    phone: "",
    firstName: "",
    lastName: "",
    profession: "",
    companyName: "",
    country: "",
    department: "",
    city: "",
    quartier: "",
    gender: "",
    birthDate: "",
    birthPlace: "",
    idType: "",
    idNumber: "",
    ifu: "",
    type: "" as "" | "particulier" | "informel" | "salarie",
    sousProfil: "",
    nationality: "",
    address: "",
    activite: "",
    secteur: "",
    entreprise: "",
    statutPro: "",
    couverture: "",
    couvertureAutre: "",
    formule: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (meQ.data?.profile) {
      const p = meQ.data.profile;
      setForm({
        name: p.name ?? "",
        phone: p.phone ?? "",
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        profession: p.profession ?? "",
        companyName: p.companyName ?? "",
        country: p.country ?? "",
        department: p.department ?? "",
        city: p.city ?? "",
        quartier: p.quartier ?? "",
        gender: p.gender ?? "",
        birthDate: p.birthDate ?? "",
        birthPlace: p.birthPlace ?? "",
        idType: p.idType ?? "",
        idNumber: p.idNumber ?? "",
        ifu: p.ifu ?? "",
        type: (p.type as "particulier" | "informel" | "salarie" | undefined) ?? "",
        sousProfil: Array.isArray(p.sousProfil) ? p.sousProfil.join(", ") : "",
        nationality: p.nationality ?? "",
        address: p.address ?? "",
        activite: p.activite ?? "",
        secteur: p.secteur ?? "",
        entreprise: p.entreprise ?? "",
        statutPro: p.statutPro ?? "",
        couverture: Array.isArray(p.couverture) ? p.couverture.join(", ") : "",
        couvertureAutre: p.couvertureAutre ?? "",
        formule: p.formule ?? "",
      });
    }
  }, [meQ.data]);

  const splitList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const trim = (v: string) => v.trim();
      await api.updateMe(session.access_token, {
        name: trim(form.name),
        phone: trim(form.phone),
        firstName: trim(form.firstName) || null,
        lastName: trim(form.lastName) || null,
        profession: trim(form.profession) || null,
        companyName: trim(form.companyName) || null,
        country: trim(form.country) || null,
        department: trim(form.department) || null,
        city: trim(form.city) || null,
        quartier: trim(form.quartier) || null,
        gender: trim(form.gender) || null,
        birthDate: trim(form.birthDate) || null,
        birthPlace: trim(form.birthPlace) || null,
        idType: trim(form.idType) || null,
        idNumber: trim(form.idNumber) || null,
        ifu: trim(form.ifu) || null,
        type: form.type || null,
        sousProfil: form.sousProfil ? splitList(form.sousProfil) : null,
        nationality: trim(form.nationality) || null,
        address: trim(form.address) || null,
        activite: trim(form.activite) || null,
        secteur: trim(form.secteur) || null,
        entreprise: trim(form.entreprise) || null,
        statutPro: trim(form.statutPro) || null,
        couverture: form.couverture ? splitList(form.couverture) : null,
        couvertureAutre: trim(form.couvertureAutre) || null,
        formule: trim(form.formule) || null,
      });
      setSuccess(true);
      await meQ.reload();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="t-title1">Mon profil</h1>
        <p className="mt-1 text-[#666]" style={{ fontSize: "0.9rem" }}>Vos informations personnelles.</p>
      </header>

      <MemberIdCard />
      <BiometricSection />

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-black/5">
          <AvatarUploader
            url={meQ.data?.profile?.avatarUrl ?? null}
            name={meQ.data?.profile?.name}
            email={user?.email}
            onChanged={() => { meQ.reload(); }}
          />
          <div className="min-w-0">
            <p style={{ fontSize: "1rem", fontWeight: 900 }}>{user?.email}</p>
            <p className="text-[#666]" style={{ fontSize: "0.75rem" }}>Compte créé le {meQ.data?.profile?.createdAt?.slice(0, 10) ?? " "}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Nom complet</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Téléphone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Field label="Profession" value={form.profession} onChange={(v) => setForm({ ...form, profession: v })} />
            <Field label="Société" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
            <Field label="Pays" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <Field label="Département" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="Quartier" value={form.quartier} onChange={(v) => setForm({ ...form, quartier: v })} />
            <Field label="Genre" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
            <Field label="Date de naissance" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} type="date" />
            <Field label="Lieu de naissance" value={form.birthPlace} onChange={(v) => setForm({ ...form, birthPlace: v })} />
            <Field label="Type de pièce" value={form.idType} onChange={(v) => setForm({ ...form, idType: v })} />
            <Field label="N° de pièce" value={form.idNumber} onChange={(v) => setForm({ ...form, idNumber: v })} />
            <Field label="IFU" value={form.ifu} onChange={(v) => setForm({ ...form, ifu: v })} />
          </div>

          <div className="pt-4 mt-2 border-t border-black/5">
            <p className="mb-3" style={{ fontSize: "0.85rem", fontWeight: 800 }}>Profil métier &amp; couverture</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>Type de profil</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57] bg-white"
                >
                  <option value="">—</option>
                  <option value="particulier">Particulier</option>
                  <option value="informel">Informel</option>
                  <option value="salarie">Salarié</option>
                </select>
              </div>
              <Field label="Sous-profils (séparés par virgule)" value={form.sousProfil} onChange={(v) => setForm({ ...form, sousProfil: v })} />
              <Field label="Nationalité" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
              <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              <Field label="Activité" value={form.activite} onChange={(v) => setForm({ ...form, activite: v })} />
              <Field label="Secteur" value={form.secteur} onChange={(v) => setForm({ ...form, secteur: v })} />
              <Field label="Entreprise" value={form.entreprise} onChange={(v) => setForm({ ...form, entreprise: v })} />
              <Field label="Statut professionnel" value={form.statutPro} onChange={(v) => setForm({ ...form, statutPro: v })} />
              <Field label="Couvertures souhaitées (séparées par virgule)" value={form.couverture} onChange={(v) => setForm({ ...form, couverture: v })} />
              <Field label="Autre couverture" value={form.couvertureAutre} onChange={(v) => setForm({ ...form, couvertureAutre: v })} />
              <Field label="Formule" value={form.formule} onChange={(v) => setForm({ ...form, formule: v })} />
            </div>
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700" style={{ fontSize: "0.85rem" }}>{error}</div>}
          {success && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700" style={{ fontSize: "0.85rem" }}>Profil mis à jour.</div>}
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white disabled:opacity-60" style={{ background: "#FF3B57", fontWeight: 800 }}>
            <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <ProfileFactsCard profile={meQ.data?.profile} />
    </div>
  );
}

function AvatarUploader({
  url,
  name,
  email,
  onChanged,
}: {
  url: string | null;
  name?: string | null;
  email?: string | null;
  onChanged: () => void;
}) {
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session?.access_token) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { setErr("Format accepté : JPG, PNG ou WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Image trop volumineuse (max 2 Mo)."); return; }
    setErr(null);
    setBusy("upload");
    try {
      await api.uploadAvatar(session.access_token, file);
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Échec du téléversement.");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!session?.access_token || !url) return;
    setBusy("delete");
    setErr(null);
    try {
      await api.deleteAvatar(session.access_token);
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <UserAvatar url={url} name={name} email={email} size="lg" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy !== null}
        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition disabled:opacity-60"
        style={{ background: "#FF3B57", border: "2px solid #fff" }}
        aria-label="Changer la photo de profil"
        title="Changer la photo"
      >
        <Camera className="w-4 h-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />
      {url && (
        <button
          type="button"
          onClick={onDelete}
          disabled={busy !== null}
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition disabled:opacity-60"
          style={{ background: "rgba(14,19,32,0.75)", border: "2px solid #fff" }}
          aria-label="Supprimer la photo"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {err && (
        <p className="absolute left-0 top-full mt-1 whitespace-nowrap" style={{ fontSize: "0.7rem", color: "#B42318", fontWeight: 700 }}>
          {err}
        </p>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-[#FF3B57]"
      />
    </div>
  );
}

function ProfileFactsCard({ profile }: { profile: import("../api").Profile | null | undefined }) {
  if (!profile) return null;
  const listToStr = (v: unknown) => Array.isArray(v) && v.length ? v.join(" · ") : null;
  const facts: { label: string; value?: string | null }[] = [
    { label: "Type de profil", value: profile.type ? profile.type[0].toUpperCase() + profile.type.slice(1) : null },
    { label: "Sous-profils", value: listToStr(profile.sousProfil) },
    { label: "Prénom", value: profile.firstName },
    { label: "Nom", value: profile.lastName },
    { label: "Genre", value: profile.gender },
    { label: "Date de naissance", value: profile.birthDate },
    { label: "Lieu de naissance", value: profile.birthPlace },
    { label: "Nationalité", value: profile.nationality },
    { label: "Activité", value: profile.activite },
    { label: "Secteur", value: profile.secteur },
    { label: "Entreprise", value: profile.entreprise ?? profile.companyName },
    { label: "Statut pro.", value: profile.statutPro },
    { label: "Profession", value: profile.profession },
    { label: "IFU", value: profile.ifu },
    { label: "Pièce", value: profile.idType && profile.idNumber ? `${profile.idType} · ${profile.idNumber}` : profile.idType ?? profile.idNumber },
    { label: "Adresse", value: profile.address },
    { label: "Pays", value: profile.country },
    { label: "Département", value: profile.department },
    { label: "Ville", value: profile.city },
    { label: "Quartier", value: profile.quartier },
    { label: "Couvertures souhaitées", value: listToStr(profile.couverture) },
    { label: "Autre couverture", value: profile.couvertureAutre },
    { label: "Formule", value: profile.formule },
    { label: "Documents déclarés", value: listToStr(profile.documentsDeclares) },
    { label: "Autre document", value: profile.documentAutre },
  ].filter((f) => f.value);

  if (facts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 sm:p-7">
        <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Informations d'inscription</p>
        <p className="text-[#666] mt-1" style={{ fontSize: "0.85rem" }}>
          Aucune information détaillée n'a été renseignée à l'inscription.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 sm:p-7">
      <p style={{ fontSize: "0.95rem", fontWeight: 900 }}>Informations d'inscription</p>
      <p className="text-[#666] mt-1 mb-4" style={{ fontSize: "0.78rem" }}>
        Données saisies lors de votre parcours d'inscription. Contactez votre conseiller pour toute modification.
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-[#888]" style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {f.label}
            </dt>
            <dd style={{ fontSize: "0.88rem", fontWeight: 700 }}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

