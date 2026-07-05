-- =====================================================================
-- IPPOO ASSURANCE — Reprise des données KV → tables normalisées
--
-- PRÉREQUIS (sinon les FK échouent / données ignorées) :
--   1) La table `kv_store_752d1a39` (clé/valeur jsonb) doit être présente
--      dans CE projet avec les données exportées depuis l'instance actuelle.
--   2) Les utilisateurs (auth.users) doivent déjà exister dans CE projet
--      (sinon les lignes utilisateur sont ignorées par sécurité FK).
--
-- Ce script est IDEMPOTENT (on conflict do nothing) : ré-exécutable sans
-- créer de doublons. Il ne supprime jamais le KV (rollback possible).
-- =====================================================================
do $$
begin
  if to_regclass('public.kv_store_752d1a39') is null then
    raise notice 'kv_store_752d1a39 absente : importez d''abord le dump KV. Migration ignorée.';
    return;
  end if;

  -- ---------- PROFILS ----------
  insert into public.profiles (user_id, name, email, phone, member_number, ville, profile_type, secteur, flux, extra)
  select (split_part(k.key,':',2))::uuid,
         v->>'name', v->>'email', v->>'phone', v->>'memberNumber',
         v->>'ville', v->>'profileType', v->>'secteur', v->>'flux', v
  from public.kv_store_752d1a39 k
  cross join lateral (select k.value as v) s
  where k.key like 'profile:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (user_id) do nothing;

  -- ---------- CONTRATS ----------
  insert into public.contracts (id,user_id,product,status,start_date,end_date,premium,currency,frequency,auto_debit,next_billing_date,last_paid_at)
  select e->>'id', (split_part(k.key,':',2))::uuid, e->>'product', coalesce(e->>'status','active'),
         nullif(e->>'startDate','')::timestamptz, nullif(e->>'endDate','')::timestamptz,
         coalesce((e->>'premium')::numeric,0), coalesce(e->>'currency','XOF'),
         coalesce(e->>'frequency','mensuel'), coalesce((e->>'autoDebit')::boolean,true),
         nullif(e->>'nextBillingDate','')::timestamptz, nullif(e->>'lastPaidAt','')::timestamptz
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'contracts:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- SINISTRES ----------
  insert into public.claims (id,user_id,contract_id,type,description,amount,status,assigned_to,assigned_at,beneficiary_id,beneficiary,admin_note,decided_at,decided_by,created_at)
  select e->>'id', (split_part(k.key,':',2))::uuid, nullif(e->>'contractId',''),
         e->>'type', e->>'description', coalesce((e->>'amount')::numeric,0),
         coalesce(e->>'status','en_cours'), e->>'assignedTo', nullif(e->>'assignedAt','')::timestamptz,
         e->>'beneficiaryId', e->'beneficiary', e->>'adminNote',
         nullif(e->>'decidedAt','')::timestamptz, e->>'decidedBy',
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'claims:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- PAIEMENTS ----------
  insert into public.payments (id,user_id,contract_id,amount,currency,method,status,purpose,label,confirmed_at,created_at)
  select e->>'id', (split_part(k.key,':',2))::uuid, nullif(e->>'contractId',''),
         coalesce((e->>'amount')::numeric,0), coalesce(e->>'currency','XOF'),
         e->>'method', coalesce(e->>'status','en_attente'), e->>'purpose', e->>'label',
         nullif(e->>'confirmedAt','')::timestamptz,
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'payments:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- BÉNÉFICIAIRES ----------
  insert into public.beneficiaries (id,user_id,name,relation,birth_date,created_at)
  select coalesce(nullif(e->>'id',''), 'b_'||md5(e::text)), (split_part(k.key,':',2))::uuid,
         e->>'name', e->>'relation', nullif(e->>'birthDate','')::date,
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'beneficiaries:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- DOCUMENTS ----------
  insert into public.documents (id,user_id,name,type,category,size,created_at)
  select coalesce(nullif(e->>'id',''), 'd_'||md5(e::text)), (split_part(k.key,':',2))::uuid,
         e->>'name', e->>'type', e->>'category', nullif(e->>'size','')::integer,
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'documents:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- NOTIFICATIONS ----------
  insert into public.notifications (id,user_id,title,body,type,read,to_url,tag,created_at)
  select coalesce(nullif(e->>'id',''), 'n_'||md5(e::text)), (split_part(k.key,':',2))::uuid,
         e->>'title', e->>'body', coalesce(e->>'type','info'),
         coalesce((e->>'read')::boolean,false), e->>'to', e->>'tag',
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'notifications:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- MESSAGES ----------
  insert into public.messages (id,user_id,from_role,author,body,attachment,reply_to_id,read,edited_at,deleted_at,created_at)
  select coalesce(nullif(e->>'id',''), 'm_'||md5(e::text)), (split_part(k.key,':',2))::uuid,
         coalesce(e->>'from','user'), e->>'author', e->>'body', e->'attachment',
         nullif(e->>'replyToId',''), coalesce((e->>'read')::boolean,false),
         nullif(e->>'editedAt','')::timestamptz, nullif(e->>'deletedAt','')::timestamptz,
         coalesce(nullif(e->>'createdAt','')::timestamptz, now())
  from public.kv_store_752d1a39 k, jsonb_array_elements(k.value) e
  where k.key like 'messages:%'
    and exists (select 1 from auth.users u where u.id = (split_part(k.key,':',2))::uuid)
  on conflict (id) do nothing;

  -- ---------- TARIFS (system:pricing = map productId -> override) ----------
  insert into public.pricing (product_id, premium, frequency, delai_carence, formules, garanties)
  select kvp.key,
         nullif(kvp.value->>'premium','')::numeric, kvp.value->>'frequency',
         kvp.value->>'delaiCarence',
         coalesce(kvp.value->'formules','[]'::jsonb),
         coalesce(kvp.value->'garanties','[]'::jsonb)
  from public.kv_store_752d1a39 k,
       lateral jsonb_each(k.value) as kvp(key, value)
  where k.key = 'system:pricing'
  on conflict (product_id) do nothing;

  -- ---------- PROMOS (system:promos = array) ----------
  insert into public.promos (id,image,alt,to_url,title,description,cta_label,theme,active,position)
  select coalesce(nullif(e->>'id',''), 'promo_'||ord), e->>'image', e->>'alt', e->>'to',
         e->>'title', e->>'description', e->>'ctaLabel', coalesce(e->>'theme','dark'),
         coalesce((e->>'active')::boolean,true), ord::int
  from public.kv_store_752d1a39 k,
       jsonb_array_elements(k.value) with ordinality as t(e, ord)
  where k.key = 'system:promos'
  on conflict (id) do nothing;

  -- ---------- PARTENAIRES (system:partners = array) ----------
  insert into public.partners (id,name,type,city,address,phone,lat,lng,active,position,extra)
  select coalesce(nullif(e->>'id',''), 'partner_'||ord), e->>'name', e->>'type',
         e->>'city', e->>'address', e->>'phone',
         nullif(e->>'lat','')::double precision, nullif(e->>'lng','')::double precision,
         coalesce((e->>'active')::boolean,true), ord::int, e
  from public.kv_store_752d1a39 k,
       jsonb_array_elements(k.value) with ordinality as t(e, ord)
  where k.key = 'system:partners'
  on conflict (id) do nothing;

  -- ---------- SITE CONFIG (system:site = object) ----------
  insert into public.site_config (id, data)
  select 1, k.value
  from public.kv_store_752d1a39 k
  where k.key = 'system:site'
  on conflict (id) do update set data = excluded.data, updated_at = now();

  raise notice 'Migration KV → tables terminée.';
end$$;
