-- =====================================================================
-- IPPOO ASSURANCE — Correctifs de types de colonnes
--
-- Contexte : certaines tables ont pu être créées avec id=uuid avant
-- nos migrations (ids KV du format b_…, m_…, n_… qui sont du texte).
-- Ce script recrée les colonnes id en TEXT de façon idempotente.
--
-- À exécuter APRÈS 0003_realtime_rls_all_tables.sql
-- =====================================================================

-- ── beneficiaries : id text (était uuid dans la version Figma Make) ──
do $$
begin
  if (
    select data_type from information_schema.columns
    where table_schema='public' and table_name='beneficiaries' and column_name='id'
  ) = 'uuid' then
    -- Drop contrainte PK, recréer en text
    alter table public.beneficiaries drop constraint if exists beneficiaries_pkey cascade;
    alter table public.beneficiaries alter column id type text using id::text;
    alter table public.beneficiaries add primary key (id);
    raise notice 'beneficiaries.id converti uuid → text';
  else
    raise notice 'beneficiaries.id est déjà text, rien à faire';
  end if;
end$$;

-- ── documents : id text (était uuid) ─────────────────────────────────
do $$
begin
  if (
    select data_type from information_schema.columns
    where table_schema='public' and table_name='documents' and column_name='id'
  ) = 'uuid' then
    alter table public.documents drop constraint if exists documents_pkey cascade;
    alter table public.documents alter column id type text using id::text;
    alter table public.documents add primary key (id);
    raise notice 'documents.id converti uuid → text';
  else
    raise notice 'documents.id est déjà text, rien à faire';
  end if;
end$$;

-- ── notifications : id text (était uuid) ─────────────────────────────
do $$
begin
  if (
    select data_type from information_schema.columns
    where table_schema='public' and table_name='notifications' and column_name='id'
  ) = 'uuid' then
    alter table public.notifications drop constraint if exists notifications_pkey cascade;
    alter table public.notifications alter column id type text using id::text;
    alter table public.notifications add primary key (id);
    raise notice 'notifications.id converti uuid → text';
  else
    raise notice 'notifications.id est déjà text, rien à faire';
  end if;
end$$;

-- ── messages : id text (était uuid) ──────────────────────────────────
do $$
begin
  if (
    select data_type from information_schema.columns
    where table_schema='public' and table_name='messages' and column_name='id'
  ) = 'uuid' then
    alter table public.messages drop constraint if exists messages_pkey cascade;
    alter table public.messages drop constraint if exists messages_reply_to_id_fkey cascade;
    alter table public.messages alter column id type text using id::text;
    alter table public.messages alter column reply_to_id type text using reply_to_id::text;
    alter table public.messages add primary key (id);
    raise notice 'messages.id converti uuid → text';
  else
    raise notice 'messages.id est déjà text, rien à faire';
  end if;
end$$;

-- ── consents : id peut rester uuid (gen_random_uuid) ─────────────────
-- (les ids de consentements ne viennent pas du KV, pas de problème)

-- ── Vérification finale ───────────────────────────────────────────────
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and column_name = 'id'
  and table_name in ('beneficiaries','documents','notifications','messages',
                     'contracts','claims','payments','promos','partners',
                     'pricing','site_config','kv_store_752d1a39')
order by table_name;
