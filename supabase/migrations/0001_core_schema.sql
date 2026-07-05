-- =====================================================================
-- IPPOO ASSURANCE — Schéma normalisé (Phase 1)
-- Modèle d'accès : OPTION A (hybride)
--   • Écritures : UNIQUEMENT côté serveur via la clé service_role
--     (l'Edge Function), qui contourne le RLS.
--   • Lectures client : en direct via RLS (auth.uid() = user_id) + Realtime
--     pour les tables temps réel (notifications, messages, sinistres…).
--   • Données publiques (catalogue/tarifs/config) : lecture anon autorisée.
--
-- À exécuter dans le SQL Editor de votre Supabase (ou via psql).
-- Idempotent autant que possible (IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Trigger générique : maintient updated_at à jour.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. PROFILS & PRÉFÉRENCES (1 ligne / utilisateur)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  name           text,
  email          text,
  phone          text,
  member_number  text unique,
  ville          text,
  profile_type   text,             -- informel / particulier / salarié
  secteur        text,             -- primaire / secondaire / tertiaire
  flux           text,             -- producteur / transformateur / distributeur / détaillant
  suspended      boolean not null default false,
  enrolled_by    text,
  enrolled_at    timestamptz,
  extra          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  prefs       jsonb not null default '{}'::jsonb,  -- canaux notif, etc.
  locale      text,
  theme       text,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. CONTRATS / SINISTRES / PAIEMENTS
-- ---------------------------------------------------------------------
create table if not exists public.contracts (
  id                text primary key,            -- conserve les ids existants (c_…)
  user_id           uuid not null references auth.users(id) on delete cascade,
  product           text not null,
  status            text not null default 'active',  -- active | expired | pending | suspended
  start_date        timestamptz,
  end_date          timestamptz,
  premium           numeric not null default 0,
  currency          text not null default 'XOF',
  frequency         text not null default 'mensuel',
  auto_debit        boolean not null default true,
  next_billing_date timestamptz,
  last_paid_at      timestamptz,
  suspended_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_contracts_user on public.contracts(user_id);

create table if not exists public.claims (
  id            text primary key,                -- s_…
  user_id       uuid not null references auth.users(id) on delete cascade,
  contract_id   text references public.contracts(id) on delete set null,
  type          text not null,
  description   text,
  amount        numeric not null default 0,
  status        text not null default 'en_cours', -- soumis|en_cours|en_examen|valide|rejete|regle
  assigned_to   text,
  assigned_at   timestamptz,
  assigned_by   text,
  beneficiary_id text,
  beneficiary   jsonb,
  admin_note    text,
  decided_at    timestamptz,
  decided_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_claims_user on public.claims(user_id);
create index if not exists idx_claims_status on public.claims(status);

create table if not exists public.claim_attachments (
  id          uuid primary key default gen_random_uuid(),
  claim_id    text not null references public.claims(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  path        text not null,
  name        text,
  size        integer,
  created_at  timestamptz not null default now()
);
create index if not exists idx_claim_att_claim on public.claim_attachments(claim_id);

create table if not exists public.payments (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  contract_id   text references public.contracts(id) on delete set null,
  amount        numeric not null default 0,
  currency      text not null default 'XOF',
  method        text,
  status        text not null default 'en_attente', -- confirme|en_attente|echec|rembourse|annule
  purpose       text,
  label         text,
  confirmed_at  timestamptz,
  refunded_at   timestamptz,
  refund_reason text,
  refunded_by   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);

-- ---------------------------------------------------------------------
-- 3. BÉNÉFICIAIRES / DOCUMENTS / KYC
-- ---------------------------------------------------------------------
create table if not exists public.beneficiaries (
  id          text primary key,                 -- conserve les ids KV (b_…)
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  relation    text,
  birth_date  date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_benef_user on public.beneficiaries(user_id);

create table if not exists public.documents (
  id          text primary key,                 -- conserve les ids KV (d_…/uuid)
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text,
  category    text,
  size        integer,
  path        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_documents_user on public.documents(user_id);

create table if not exists public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  path        text not null,
  name        text,
  size        integer,
  status      text not null default 'pending',  -- pending | approved | rejected
  decided_by  text,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_kyc_user on public.kyc_documents(user_id);

-- ---------------------------------------------------------------------
-- 4. NOTIFICATIONS / MESSAGES / CONSENTEMENTS / PUSH
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          text primary key,                 -- conserve les ids KV (n_…)
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  type        text not null default 'info',     -- info | success | warn
  read        boolean not null default false,
  to_url      text,
  tag         text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, read);

create table if not exists public.messages (
  id           text primary key,                 -- conserve les ids KV (m_…)
  user_id      uuid not null references auth.users(id) on delete cascade,
  from_role    text not null,                    -- user | conseiller
  author       text,
  body         text,
  attachment   jsonb,
  reply_to_id  text,
  read         boolean not null default false,
  edited_at    timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_messages_user on public.messages(user_id, created_at);

create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  version     text,
  granted     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_consents_user on public.consents(user_id);

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  keys        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_push_user on public.push_subscriptions(user_id);

-- ---------------------------------------------------------------------
-- 5. CONSEILLERS (AGENTS) — espace séparé, pas d'accès client
-- ---------------------------------------------------------------------
create table if not exists public.agents (
  matricule   text primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  name        text,
  email       text,
  phone       text,
  role        text not null default 'conseiller',
  status      text not null default 'actif',
  profile     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.agent_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  matricule   text,
  body        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_agent_notes_user on public.agent_notes(user_id);

-- ---------------------------------------------------------------------
-- 6. CONFIG PUBLIQUE (catalogue, tarifs, promos, partenaires, site)
-- ---------------------------------------------------------------------
create table if not exists public.pricing (
  product_id     text primary key,
  premium        numeric,
  frequency      text,
  delai_carence  text,
  formules       jsonb not null default '[]'::jsonb,
  garanties      jsonb not null default '[]'::jsonb,
  updated_at     timestamptz not null default now()
);

create table if not exists public.promos (
  id           text primary key,
  image        text not null,
  alt          text,
  to_url       text,
  title        text,
  description  text,
  cta_label    text,
  theme        text not null default 'dark',
  active       boolean not null default true,
  position     integer not null default 0,
  updated_at   timestamptz not null default now()
);

create table if not exists public.partners (
  id           text primary key,
  name         text not null,
  type         text,
  city         text,
  address      text,
  phone        text,
  lat          double precision,
  lng          double precision,
  active       boolean not null default true,
  position     integer not null default 0,
  extra        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create table if not exists public.site_config (
  id          integer primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);

-- ---------------------------------------------------------------------
-- 7. SYSTÈME : AUDIT / WEBHOOKS / SESSIONS ADMIN (service_role only)
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor       text,
  action      text not null,
  meta        jsonb not null default '{}'::jsonb,
  prev_hash   text,
  hash        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

create table if not exists public.webhook_events (
  id          text primary key,
  provider    text,
  payload     jsonb,
  processed   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  jti         text primary key,
  username    text,
  role        text,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. TRIGGERS updated_at
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_settings','contracts','claims','agents',
    'pricing','promos','partners','site_config'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ---------------------------------------------------------------------
-- 9. RLS — activation + politiques (Option A)
-- ---------------------------------------------------------------------
-- Tables possédées par un utilisateur : lecture de SES lignes uniquement.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_settings','contracts','claims','claim_attachments',
    'payments','beneficiaries','documents','kyc_documents','notifications',
    'messages','consents','push_subscriptions'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "owner_select" on public.%I;', t);
    execute format(
      'create policy "owner_select" on public.%I
         for select to authenticated using (auth.uid() = user_id);', t);
    -- Pas de policy insert/update/delete → seules les écritures service_role passent.
  end loop;
end$$;

-- Tables de config publiques : lecture anon + authenticated, écriture service_role.
do $$
declare t text;
begin
  foreach t in array array['pricing','promos','partners','site_config'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "public_select" on public.%I;', t);
    execute format(
      'create policy "public_select" on public.%I
         for select to anon, authenticated using (true);', t);
  end loop;
end$$;

-- Tables système / agents : RLS activé SANS policy → service_role uniquement.
do $$
declare t text;
begin
  foreach t in array array[
    'agents','agent_notes','audit_log','webhook_events','admin_sessions'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end$$;

-- ---------------------------------------------------------------------
-- 10. REALTIME — publication des tables temps réel
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'notifications','messages','claims','contracts','payments',
    'pricing','promos','partners','site_config'
  ] loop
    -- REPLICA IDENTITY FULL : payloads complets sur update/delete.
    execute format('alter table public.%I replica identity full;', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;  -- déjà publiée
    end;
  end loop;
end$$;

-- =====================================================================
-- FIN — schéma prêt. Voir 0002_migrate_from_kv.sql pour la reprise des
-- données existantes depuis kv_store_752d1a39 (sans perte).
-- =====================================================================
