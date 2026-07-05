-- =====================================================================
-- IPPOO ASSURANCE — Configuration COMPLETE : RLS + Realtime sur toutes
-- les tables. À exécuter APRÈS 0001_core_schema.sql.
--
-- Ce script est IDEMPOTENT (drop + recreate policies, begin/exception).
-- Copiez-le en entier dans le SQL Editor de votre Supabase et exécutez.
--
-- Modèle d'accès (Option A hybride) :
--   • Écritures : UNIQUEMENT via service_role (Edge Function) → bypass RLS
--   • Lectures user  : client avec JWT Supabase Auth → RLS auth.uid()=user_id
--   • Lectures agent : aucun accès direct aux tables user (routes serveur)
--   • Lectures public : anon pour les tables de config (pricing, promos…)
--   • Tables système : RLS activé sans policy → service_role UNIQUEMENT
-- =====================================================================

-- Extension cryptographique (nécessaire pour gen_random_uuid)
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. HELPER : trigger updated_at générique
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 2. TABLES PROPRIÉTAIRE (user_id = auth.uid())
--    RLS : SELECT propre utilisateur | INSERT/UPDATE/DELETE : service_role
-- =====================================================================

-- ── PROFILES ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  name           text,
  email          text,
  phone          text,
  member_number  text unique,
  ville          text,
  profile_type   text,
  secteur        text,
  flux           text,
  suspended      boolean not null default false,
  card_active    boolean not null default false,
  card_issued_at timestamptz,
  enrolled_by    text,
  enrolled_at    timestamptz,
  enrolled_source text,
  referral_code  text,
  extra          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── USER_SETTINGS ──────────────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  prefs       jsonb not null default '{}'::jsonb,
  locale      text,
  theme       text,
  updated_at  timestamptz not null default now()
);

-- ── CONTRACTS ──────────────────────────────────────────────────────────
create table if not exists public.contracts (
  id                 text primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  product            text not null,
  status             text not null default 'active',
  start_date         timestamptz,
  end_date           timestamptz,
  premium            numeric not null default 0,
  currency           text not null default 'XOF',
  frequency          text not null default 'mensuel',
  auto_debit         boolean not null default true,
  next_billing_date  timestamptz,
  last_paid_at       timestamptz,
  suspended_at       timestamptz,
  extra              jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_contracts_user   on public.contracts(user_id);
create index if not exists idx_contracts_status on public.contracts(status);

-- ── CLAIMS ─────────────────────────────────────────────────────────────
create table if not exists public.claims (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  contract_id    text references public.contracts(id) on delete set null,
  type           text not null,
  description    text,
  amount         numeric not null default 0,
  status         text not null default 'en_cours',
  assigned_to    text,
  assigned_at    timestamptz,
  assigned_by    text,
  beneficiary_id text,
  beneficiary    jsonb,
  admin_note     text,
  decided_at     timestamptz,
  decided_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_claims_user   on public.claims(user_id);
create index if not exists idx_claims_status on public.claims(status);

-- ── CLAIM_ATTACHMENTS ──────────────────────────────────────────────────
create table if not exists public.claim_attachments (
  id         uuid primary key default gen_random_uuid(),
  claim_id   text not null references public.claims(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  path       text not null,
  name       text,
  size       integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_claim_att_claim on public.claim_attachments(claim_id);
create index if not exists idx_claim_att_user  on public.claim_attachments(user_id);

-- ── PAYMENTS ───────────────────────────────────────────────────────────
create table if not exists public.payments (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  contract_id   text references public.contracts(id) on delete set null,
  amount        numeric not null default 0,
  currency      text not null default 'XOF',
  method        text,
  status        text not null default 'en_attente',
  purpose       text,
  label         text,
  confirmed_at  timestamptz,
  refunded_at   timestamptz,
  refund_reason text,
  refunded_by   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_payments_user   on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);

-- ── BENEFICIARIES ──────────────────────────────────────────────────────
create table if not exists public.beneficiaries (
  id         text primary key,          -- conserve les ids KV (b_…)
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  relation   text,
  birth_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_benef_user on public.beneficiaries(user_id);

-- ── DOCUMENTS ──────────────────────────────────────────────────────────
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  type       text,
  category   text,
  size       integer,
  path       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_documents_user on public.documents(user_id);

-- ── KYC_DOCUMENTS ──────────────────────────────────────────────────────
create table if not exists public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  path        text not null,
  name        text,
  size        integer,
  status      text not null default 'pending',
  decided_by  text,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_kyc_user on public.kyc_documents(user_id);

-- ── NOTIFICATIONS ──────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         text primary key,          -- ids KV : n_…
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info',
  read       boolean not null default false,
  to_url     text,
  tag        text,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, read);
create index if not exists idx_notif_created on public.notifications(user_id, created_at desc);

-- ── MESSAGES ───────────────────────────────────────────────────────────
create table if not exists public.messages (
  id          text primary key,         -- ids KV : m_…
  user_id     uuid not null references auth.users(id) on delete cascade,
  from_role   text not null default 'user',
  author      text,
  body        text,
  attachment  jsonb,
  reply_to_id text,
  read        boolean not null default false,
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_messages_user    on public.messages(user_id, created_at);
create index if not exists idx_messages_unread  on public.messages(user_id, read);

-- ── CONSENTS ───────────────────────────────────────────────────────────
create table if not exists public.consents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  version    text,
  granted    boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_consents_user on public.consents(user_id);

-- ── PUSH_SUBSCRIPTIONS ─────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_user on public.push_subscriptions(user_id);

-- =====================================================================
-- 3. TABLES AGENTS (accès serveur uniquement — pas d'accès client direct)
-- =====================================================================

create table if not exists public.agents (
  matricule    text primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  name         text,
  email        text,
  phone        text,
  role         text not null default 'conseiller',
  status       text not null default 'actif',
  profile      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.agent_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  matricule  text,
  body       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_agent_notes_user on public.agent_notes(user_id);

create table if not exists public.conversation_meta (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  status     text not null default 'ouvert',
  assignee   text,
  tags       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 4. TABLES CONFIG PUBLIQUE (lecture anon/authenticated, écriture service_role)
-- =====================================================================

create table if not exists public.pricing (
  product_id    text primary key,
  premium       numeric,
  frequency     text,
  delai_carence text,
  formules      jsonb not null default '[]'::jsonb,
  garanties     jsonb not null default '[]'::jsonb,
  extra         jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

create table if not exists public.promos (
  id          text primary key,
  image       text not null,
  alt         text,
  to_url      text,
  title       text,
  description text,
  cta_label   text,
  theme       text not null default 'dark',
  active      boolean not null default true,
  position    integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists public.partners (
  id         text primary key,
  name       text not null,
  type       text,
  city       text,
  address    text,
  phone      text,
  lat        double precision,
  lng        double precision,
  active     boolean not null default true,
  position   integer not null default 0,
  extra      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_config (
  id         integer primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);

-- =====================================================================
-- 5. TABLES SYSTÈME (service_role uniquement, sans policy explicite)
-- =====================================================================

create table if not exists public.audit_log (
  id         bigserial primary key,
  actor      text,
  action     text not null,
  meta       jsonb not null default '{}'::jsonb,
  prev_hash  text,
  hash       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log(created_at desc);
create index if not exists idx_audit_actor   on public.audit_log(actor);

create table if not exists public.webhook_events (
  id         text primary key,
  provider   text,
  payload    jsonb,
  processed  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_webhook_processed on public.webhook_events(processed, created_at);

create table if not exists public.admin_sessions (
  jti        text primary key,
  username   text,
  role       text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_phone (
  phone      text primary key,
  code       text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  key        text primary key,
  hits       integer not null default 0,
  reset_at   timestamptz,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 6. TRIGGERS updated_at
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_settings','contracts','claims','agents',
    'conversation_meta','pricing','promos','partners','site_config'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;
       create trigger trg_%1$s_updated
         before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- =====================================================================
-- 7. ROW LEVEL SECURITY — activation + politiques
-- =====================================================================

-- ── A) Tables propriétaire : SELECT propre utilisateur ────────────────
-- On supprime la policy par son nom connu (idempotent) puis on la recrée.
-- Pas de do imbriqué : PostgreSQL ne permet pas les blocs anonymes imbriqués.

-- profiles
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
drop policy if exists "user_select_own" on public.profiles;
create policy "user_select_own" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

-- user_settings
alter table public.user_settings enable row level security;
alter table public.user_settings force row level security;
drop policy if exists "user_select_own" on public.user_settings;
create policy "user_select_own" on public.user_settings
  for select to authenticated using (auth.uid() = user_id);

-- contracts
alter table public.contracts enable row level security;
alter table public.contracts force row level security;
drop policy if exists "user_select_own" on public.contracts;
create policy "user_select_own" on public.contracts
  for select to authenticated using (auth.uid() = user_id);

-- claims
alter table public.claims enable row level security;
alter table public.claims force row level security;
drop policy if exists "user_select_own" on public.claims;
create policy "user_select_own" on public.claims
  for select to authenticated using (auth.uid() = user_id);

-- claim_attachments
alter table public.claim_attachments enable row level security;
alter table public.claim_attachments force row level security;
drop policy if exists "user_select_own" on public.claim_attachments;
create policy "user_select_own" on public.claim_attachments
  for select to authenticated using (auth.uid() = user_id);

-- payments
alter table public.payments enable row level security;
alter table public.payments force row level security;
drop policy if exists "user_select_own" on public.payments;
create policy "user_select_own" on public.payments
  for select to authenticated using (auth.uid() = user_id);

-- beneficiaries
alter table public.beneficiaries enable row level security;
alter table public.beneficiaries force row level security;
drop policy if exists "user_select_own" on public.beneficiaries;
create policy "user_select_own" on public.beneficiaries
  for select to authenticated using (auth.uid() = user_id);

-- documents
alter table public.documents enable row level security;
alter table public.documents force row level security;
drop policy if exists "user_select_own" on public.documents;
create policy "user_select_own" on public.documents
  for select to authenticated using (auth.uid() = user_id);

-- kyc_documents
alter table public.kyc_documents enable row level security;
alter table public.kyc_documents force row level security;
drop policy if exists "user_select_own" on public.kyc_documents;
create policy "user_select_own" on public.kyc_documents
  for select to authenticated using (auth.uid() = user_id);

-- notifications
alter table public.notifications enable row level security;
alter table public.notifications force row level security;
drop policy if exists "user_select_own" on public.notifications;
create policy "user_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

-- messages
alter table public.messages enable row level security;
alter table public.messages force row level security;
drop policy if exists "user_select_own" on public.messages;
create policy "user_select_own" on public.messages
  for select to authenticated using (auth.uid() = user_id);

-- consents
alter table public.consents enable row level security;
alter table public.consents force row level security;
drop policy if exists "user_select_own" on public.consents;
create policy "user_select_own" on public.consents
  for select to authenticated using (auth.uid() = user_id);

-- push_subscriptions
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
drop policy if exists "user_select_own" on public.push_subscriptions;
create policy "user_select_own" on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- ── B) Tables config publiques : lecture anon + authenticated ──────────

-- pricing
alter table public.pricing enable row level security;
alter table public.pricing force row level security;
drop policy if exists "public_read" on public.pricing;
create policy "public_read" on public.pricing
  for select to anon, authenticated using (true);

-- promos
alter table public.promos enable row level security;
alter table public.promos force row level security;
drop policy if exists "public_read" on public.promos;
create policy "public_read" on public.promos
  for select to anon, authenticated using (true);

-- partners
alter table public.partners enable row level security;
alter table public.partners force row level security;
drop policy if exists "public_read" on public.partners;
create policy "public_read" on public.partners
  for select to anon, authenticated using (true);

-- site_config
alter table public.site_config enable row level security;
alter table public.site_config force row level security;
drop policy if exists "public_read" on public.site_config;
create policy "public_read" on public.site_config
  for select to anon, authenticated using (true);

-- ── C) Tables agents / système : RLS activé SANS policy (service_role only)
-- Aucune policy → seul service_role (bypass RLS) peut lire/écrire.

alter table public.agents enable row level security;
alter table public.agents force row level security;

alter table public.agent_notes enable row level security;
alter table public.agent_notes force row level security;

alter table public.conversation_meta enable row level security;
alter table public.conversation_meta force row level security;

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

alter table public.webhook_events enable row level security;
alter table public.webhook_events force row level security;

alter table public.admin_sessions enable row level security;
alter table public.admin_sessions force row level security;

alter table public.otp_phone enable row level security;
alter table public.otp_phone force row level security;

alter table public.rate_limits enable row level security;
alter table public.rate_limits force row level security;

-- =====================================================================
-- 8. REALTIME — publication de toutes les tables pertinentes
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    -- Temps réel utilisateur
    'notifications','messages','claims','contracts','payments',
    -- Config publique (diffusion admin → clients)
    'pricing','promos','partners','site_config'
  ] loop
    -- REPLICA IDENTITY FULL : payloads complets sur UPDATE/DELETE
    execute format('alter table public.%I replica identity full;', t);
    -- Ajout à la publication (silencieux si déjà présente)
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end$$;

-- =====================================================================
-- 9. VÉRIFICATION FINALE — doit retourner 0 tables sans RLS activé
-- =====================================================================
do $$
declare cnt integer;
begin
  select count(*) into cnt
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity
    and c.relname not in ('kv_store_752d1a39')  -- table KV Figma : hors scope
    and c.relname not like 'schema_%';           -- tables système
  if cnt > 0 then
    raise warning 'ATTENTION : % table(s) sans RLS activé dans le schéma public', cnt;
  else
    raise notice 'OK : RLS activé sur toutes les tables applicatives';
  end if;

  -- Vérification Realtime
  select count(*) into cnt
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public';
  raise notice 'Tables publiées en Realtime : %', cnt;
end$$;

-- =====================================================================
-- RÉSUMÉ DES TABLES CRÉÉES/CONFIGURÉES
-- =====================================================================
-- Propriétaire (RLS auth.uid() = user_id, lecture Realtime pour certaines) :
--   profiles, user_settings, contracts, claims, claim_attachments,
--   payments, beneficiaries, documents, kyc_documents,
--   notifications ★, messages ★, consents, push_subscriptions
-- Agents (service_role only) :
--   agents, agent_notes, conversation_meta
-- Config publique (lecture anon, Realtime) :
--   pricing ★, promos ★, partners ★, site_config ★
-- Système (service_role only) :
--   audit_log, webhook_events, admin_sessions, otp_phone, rate_limits
-- ★ = publié en Realtime (replica identity full)
-- =====================================================================
