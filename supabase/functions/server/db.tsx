// =====================================================================
// Couche relationnelle (Phase 2) — tables normalisées.
//
// Stratégie de migration sans rupture :
//   • MIROIR (double-écriture) : à chaque écriture KV d'une liste
//     (notifications, messages), on synchronise aussi la table relationnelle.
//   • LECTURE : on lit la table en priorité ; en cas d'absence de table
//     (non encore migrée) ou d'erreur, on retourne null → le caller retombe
//     sur le KV. Aucune donnée perdue, aucune route cassée.
//
// Toutes les fonctions sont "best-effort" : elles n'élèvent jamais d'erreur
// qui pourrait tuer le worker — on log et on dégrade proprement.
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// -----------------------------------------------------------------------
// INSTANCE UNIQUE : Supabase auto-hébergée IPPOO ASSURANCE
// SUPABASE_URL = https://insurancedatabase.ippoo-aptdc.com
// SUPABASE_SERVICE_ROLE_KEY = SERVICE_SUPABASESERVICE_KEY du fichier env
// Toutes les tables (normalisées + kv_store_752d1a39) sont sur cette instance.
// -----------------------------------------------------------------------
const svc = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

// ---------------------------------------------------------------------
// Mapping array KV  <->  lignes relationnelles
// ---------------------------------------------------------------------
function notifToRow(uid: string, n: any) {
  return {
    id: String(n.id),
    user_id: uid,
    title: n.title ?? "",
    body: n.body ?? null,
    type: n.type ?? "info",
    read: !!n.read,
    to_url: n.to ?? null,
    tag: n.tag ?? null,
    created_at: n.createdAt ?? new Date().toISOString(),
  };
}
function rowToNotif(r: any) {
  return {
    id: r.id,
    title: r.title,
    body: r.body ?? "",
    type: r.type ?? "info",
    read: !!r.read,
    ...(r.to_url ? { to: r.to_url } : {}),
    ...(r.tag ? { tag: r.tag } : {}),
    createdAt: r.created_at,
  };
}

function msgToRow(uid: string, m: any) {
  return {
    id: String(m.id),
    user_id: uid,
    from_role: m.from ?? "user",
    author: m.author ?? null,
    body: m.body ?? null,
    attachment: m.attachment ?? null,
    reply_to_id: m.replyToId ?? null,
    read: !!m.read,
    edited_at: m.editedAt ?? null,
    deleted_at: m.deletedAt ?? null,
    created_at: m.createdAt ?? new Date().toISOString(),
  };
}
function rowToMsg(r: any) {
  const m: any = {
    id: r.id,
    from: r.from_role,
    author: r.author ?? "",
    body: r.body ?? "",
    read: !!r.read,
    createdAt: r.created_at,
  };
  if (r.attachment) m.attachment = r.attachment;
  if (r.reply_to_id) m.replyToId = r.reply_to_id;
  if (r.edited_at) m.editedAt = r.edited_at;
  if (r.deleted_at) m.deletedAt = r.deleted_at;
  return m;
}

// ---------------------------------------------------------------------
// Synchronisation générique liste KV -> table (upsert + purge des absents)
// ---------------------------------------------------------------------
async function mirrorList(table: string, uid: string, rows: any[]) {
  if (!rows.length) return; // sécurité : ne jamais vider la table sur liste vide
  try {
    const db = svc();
    const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
    if (error) { console.log(`[db] mirror ${table} upsert: ${error.message}`); return; }
    const ids = rows.map((r) => r.id);
    // Purge les lignes de cet utilisateur qui ne sont plus dans la liste KV.
    await db.from(table).delete().eq("user_id", uid).not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
  } catch (err) {
    console.log(`[db] mirror ${table} skipped: ${err}`);
  }
}

async function readList<T>(table: string, uid: string, map: (r: any) => T): Promise<T[] | null> {
  try {
    const db = svc();
    const { data, error } = await db.from(table).select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (error) return null;                 // table absente / erreur → fallback KV
    if (!data) return null;
    return data.map(map);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------
export const mirrorNotifications = (uid: string, list: any[]) =>
  mirrorList("notifications", uid, list.map((n) => notifToRow(uid, n)));

export const readNotifications = (uid: string) =>
  readList("notifications", uid, rowToNotif);

export const mirrorMessages = (uid: string, list: any[]) =>
  mirrorList("messages", uid, list.map((m) => msgToRow(uid, m)));

export async function readMessages(uid: string) {
  // Messages affichés en ordre chronologique croissant côté client.
  const rows = await readList("messages", uid, rowToMsg);
  if (!rows) return null;
  return rows.slice().reverse();
}

// ---------------------------------------------------------------------
// CONTRATS / SINISTRES / PAIEMENTS — même patron de miroir (Phase 2 étendue)
// ---------------------------------------------------------------------
function contractToRow(uid: string, ct: any) {
  return {
    id: String(ct.id),
    user_id: uid,
    product: ct.product ?? "",
    status: ct.status ?? "active",
    start_date: ct.startDate ?? null,
    end_date: ct.endDate ?? null,
    premium: Number(ct.premium ?? 0),
    currency: ct.currency ?? "XOF",
    frequency: ct.frequency ?? "mensuel",
    auto_debit: ct.autoDebit !== false,
    next_billing_date: ct.nextBillingDate ?? null,
    last_paid_at: ct.lastPaidAt ?? null,
    suspended_at: ct.suspendedAt ?? null,
  };
}
function rowToContract(r: any) {
  return {
    id: r.id, product: r.product, status: r.status,
    startDate: r.start_date, endDate: r.end_date,
    premium: Number(r.premium ?? 0), currency: r.currency, frequency: r.frequency,
    autoDebit: !!r.auto_debit, nextBillingDate: r.next_billing_date,
    lastPaidAt: r.last_paid_at, suspendedAt: r.suspended_at,
  };
}

function claimToRow(uid: string, cl: any) {
  return {
    id: String(cl.id),
    user_id: uid,
    contract_id: cl.contractId ?? null,
    type: cl.type ?? "",
    description: cl.description ?? null,
    amount: Number(cl.amount ?? 0),
    status: cl.status ?? "en_cours",
    assigned_to: cl.assignedTo ?? null,
    assigned_at: cl.assignedAt ?? null,
    assigned_by: cl.assignedBy ?? null,
    beneficiary_id: cl.beneficiaryId ?? null,
    beneficiary: cl.beneficiary ?? null,
    admin_note: cl.adminNote ?? null,
    decided_at: cl.decidedAt ?? null,
    decided_by: cl.decidedBy ?? null,
    created_at: cl.createdAt ?? new Date().toISOString(),
  };
}
function rowToClaim(r: any) {
  const out: any = {
    id: r.id, contractId: r.contract_id, type: r.type, description: r.description ?? "",
    amount: Number(r.amount ?? 0), status: r.status, createdAt: r.created_at,
  };
  if (r.assigned_to) out.assignedTo = r.assigned_to;
  if (r.assigned_at) out.assignedAt = r.assigned_at;
  if (r.assigned_by) out.assignedBy = r.assigned_by;
  if (r.beneficiary_id) out.beneficiaryId = r.beneficiary_id;
  if (r.beneficiary) out.beneficiary = r.beneficiary;
  if (r.admin_note) out.adminNote = r.admin_note;
  if (r.decided_at) out.decidedAt = r.decided_at;
  if (r.decided_by) out.decidedBy = r.decided_by;
  return out;
}

function paymentToRow(uid: string, p: any) {
  return {
    id: String(p.id),
    user_id: uid,
    contract_id: p.contractId ?? null,
    amount: Number(p.amount ?? 0),
    currency: p.currency ?? "XOF",
    method: p.method ?? null,
    status: p.status ?? "en_attente",
    purpose: p.purpose ?? null,
    label: p.label ?? null,
    confirmed_at: p.confirmedAt ?? null,
    refunded_at: p.refundedAt ?? null,
    refund_reason: p.refundReason ?? null,
    refunded_by: p.refundedBy ?? null,
    created_at: p.createdAt ?? new Date().toISOString(),
  };
}
function rowToPayment(r: any) {
  const out: any = {
    id: r.id, contractId: r.contract_id,
    amount: Number(r.amount ?? 0), currency: r.currency,
    method: r.method ?? "", status: r.status, createdAt: r.created_at,
  };
  if (r.purpose) out.purpose = r.purpose;
  if (r.label) out.label = r.label;
  if (r.confirmed_at) out.confirmedAt = r.confirmed_at;
  if (r.refunded_at) out.refundedAt = r.refunded_at;
  if (r.refund_reason) out.refundReason = r.refund_reason;
  if (r.refunded_by) out.refundedBy = r.refunded_by;
  return out;
}

export const mirrorContracts = (uid: string, list: any[]) =>
  mirrorList("contracts", uid, list.map((c) => contractToRow(uid, c)));
export const readContracts = (uid: string) => readList("contracts", uid, rowToContract);

export const mirrorClaims = (uid: string, list: any[]) =>
  mirrorList("claims", uid, list.map((c) => claimToRow(uid, c)));
export const readClaims = (uid: string) => readList("claims", uid, rowToClaim);

export const mirrorPayments = (uid: string, list: any[]) =>
  mirrorList("payments", uid, list.map((p) => paymentToRow(uid, p)));
export const readPayments = (uid: string) => readList("payments", uid, rowToPayment);

// ---------------------------------------------------------------------
// BÉNÉFICIAIRES & DOCUMENTS — même patron
// ---------------------------------------------------------------------
function benefToRow(uid: string, b: any) {
  return {
    id: String(b.id),
    user_id: uid,
    name: b.name ?? "",
    relation: b.relation ?? null,
    birth_date: b.birthDate ?? null,
    created_at: b.createdAt ?? new Date().toISOString(),
  };
}
function rowToBenef(r: any) {
  return {
    id: r.id, name: r.name, relation: r.relation ?? "",
    birthDate: r.birth_date, createdAt: r.created_at,
  };
}

function docToRow(uid: string, d: any) {
  return {
    id: String(d.id),
    user_id: uid,
    name: d.name ?? "",
    type: d.type ?? null,
    category: d.category ?? null,
    size: typeof d.size === "number" ? d.size : null,
    path: d.path ?? null,
    created_at: d.createdAt ?? new Date().toISOString(),
  };
}
function rowToDoc(r: any) {
  return {
    id: r.id, name: r.name, type: r.type ?? "", category: r.category ?? "",
    size: r.size ?? 0, ...(r.path ? { path: r.path } : {}), createdAt: r.created_at,
  };
}

export const mirrorBeneficiaries = (uid: string, list: any[]) =>
  mirrorList("beneficiaries", uid, list.map((b) => benefToRow(uid, b)));
export const readBeneficiaries = (uid: string) => readList("beneficiaries", uid, rowToBenef);

export const mirrorDocuments = (uid: string, list: any[]) =>
  mirrorList("documents", uid, list.map((d) => docToRow(uid, d)));
export const readDocuments = (uid: string) => readList("documents", uid, rowToDoc);

// ---------------------------------------------------------------------
// PROFILS — 1 ligne / utilisateur (upsert simple, pas de purge)
// ---------------------------------------------------------------------
function profileToRow(uid: string, p: any) {
  return {
    user_id: uid,
    name: p.name ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    member_number: p.memberNumber ?? null,
    ville: p.ville ?? p.city ?? null,
    profile_type: p.type ?? p.profileType ?? null,
    secteur: p.secteur ?? null,
    flux: p.flux ?? null,
    suspended: !!p.suspended,
    card_active: !!p.cardActive,
    card_issued_at: p.cardIssuedAt ?? null,
    enrolled_by: p.enrolledBy ?? null,
    enrolled_at: p.enrolledAt ?? null,
    enrolled_source: p.enrolledSource ?? null,
    referral_code: p.referralCode ?? null,
    // La colonne `extra` conserve l'objet profil complet (aucune perte de
    // champ métier même si le schéma relationnel évolue).
    extra: p ?? {},
    updated_at: new Date().toISOString(),
  };
}
export async function mirrorProfile(uid: string, profile: any) {
  if (!profile || typeof profile !== "object") return;
  try {
    const db = svc();
    const { error } = await db.from("profiles").upsert(profileToRow(uid, profile), { onConflict: "user_id" });
    if (error) console.log(`[db] mirror profiles: ${error.message}`);
  } catch (err) {
    console.log(`[db] mirror profiles skipped: ${err}`);
  }
}

// ---------------------------------------------------------------------
// CONFIG SYSTÈME (back office) — pricing / promos / partners / site
// Ces données n'appartiennent pas à un utilisateur : upsert global.
// ---------------------------------------------------------------------

/** Remplace intégralement le contenu d'une table de config (liste). */
async function replaceTable(table: string, rows: any[], idKey = "id") {
  try {
    const db = svc();
    if (rows.length) {
      const { error } = await db.from(table).upsert(rows, { onConflict: idKey });
      if (error) { console.log(`[db] mirror ${table} upsert: ${error.message}`); return; }
      const ids = rows.map((r) => r[idKey]);
      await db.from(table).delete().not(idKey, "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
    } else {
      // Liste vide = purge complète (config effacée depuis l'admin).
      await db.from(table).delete().not(idKey, "is", null);
    }
  } catch (err) {
    console.log(`[db] mirror ${table} skipped: ${err}`);
  }
}

// pricing : map { productId -> override } → lignes
export async function mirrorPricing(pricing: Record<string, any>) {
  const rows = Object.entries(pricing ?? {}).map(([product_id, o]: [string, any]) => ({
    product_id,
    premium: typeof o?.premium === "number" ? o.premium : null,
    frequency: o?.frequency ?? null,
    delai_carence: o?.delaiCarence ?? null,
    formules: o?.formules ?? [],
    garanties: o?.garanties ?? [],
    extra: o ?? {},
    updated_at: new Date().toISOString(),
  }));
  await replaceTable("pricing", rows, "product_id");
}

// promos : array → lignes
export async function mirrorPromos(promos: any[]) {
  const rows = (promos ?? []).map((p: any, i: number) => ({
    id: String(p?.id ?? `promo_${i}`),
    image: p?.image ?? "",
    alt: p?.alt ?? null,
    to_url: p?.to ?? null,
    title: p?.title ?? null,
    description: p?.description ?? null,
    cta_label: p?.ctaLabel ?? null,
    theme: p?.theme ?? "dark",
    active: p?.active !== false,
    position: i,
    updated_at: new Date().toISOString(),
  }));
  await replaceTable("promos", rows, "id");
}

// partners : array → lignes
export async function mirrorPartners(partners: any[]) {
  const rows = (partners ?? []).map((p: any, i: number) => ({
    id: String(p?.id ?? `partner_${i}`),
    name: p?.name ?? "",
    type: p?.type ?? null,
    city: p?.city ?? null,
    address: p?.address ?? null,
    phone: p?.phone ?? null,
    lat: typeof p?.lat === "number" ? p.lat : null,
    lng: typeof p?.lng === "number" ? p.lng : null,
    active: p?.active !== false,
    position: i,
    extra: p ?? {},
    updated_at: new Date().toISOString(),
  }));
  await replaceTable("partners", rows, "id");
}

// site_config : singleton (id = 1)
export async function mirrorSiteConfig(site: any) {
  try {
    const db = svc();
    const { error } = await db.from("site_config").upsert(
      { id: 1, data: site ?? {}, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
    if (error) console.log(`[db] mirror site_config: ${error.message}`);
  } catch (err) {
    console.log(`[db] mirror site_config skipped: ${err}`);
  }
}
