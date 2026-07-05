-- =====================================================================
-- IPPOO ASSURANCE — Table KV store (compatible Figma Make)
-- À exécuter EN PREMIER sur votre instance auto-hébergée.
--
-- Cette table est le store clé-valeur utilisé par l'Edge Function
-- pour toutes les données opérationnelles (profils, contrats, sinistres,
-- notifications, messages, config système…).
-- Elle doit exister sur votre instance pour que la fonction fonctionne.
-- =====================================================================

create table if not exists public.kv_store_752d1a39 (
  key   text not null primary key,
  value jsonb not null
);

-- RLS : accessible uniquement via service_role (l'Edge Function).
-- Aucun accès client direct.
alter table public.kv_store_752d1a39 enable row level security;
alter table public.kv_store_752d1a39 force row level security;
-- Pas de policy → seul service_role bypass le RLS.

comment on table public.kv_store_752d1a39 is
  'Store clé-valeur principal de l''Edge Function IPPOO. '
  'Toutes les lectures/écritures passent par service_role. '
  'Les tables normalisées (0003_realtime_rls_all_tables.sql) '
  'reçoivent un miroir de cette data en temps réel.';
