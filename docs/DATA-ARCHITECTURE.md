# IPPOO — Architecture des données & marche à suivre

Ce document explique comment passer de l'unique table KV
(`kv_store_752d1a39`) à un **schéma normalisé** avec **RLS** + **Realtime**,
et comment connecter le tout. Modèle retenu : **Option A (hybride)**.

> ⚠️ **Sécurité** — Les secrets de `ippoo insurance-supabase-data-env.txt`
> sont apparus en clair (clé `service_role`, mots de passe Postgres,
> `ADMIN_PASSWORD`). **Faites-les tourner (rotate)** dès que possible. Le
> fichier est désormais ignoré par git (jamais poussé).

---

## 1. Principe (Option A)

| Acteur | Écriture | Lecture |
|--------|----------|---------|
| Serveur (Edge Function, `service_role`) | ✅ seule voie d'écriture (contourne le RLS) | ✅ |
| Client utilisateur (anon key + session) | ❌ jamais en direct | ✅ ses propres lignes via RLS + Realtime |
| Admin | via token serveur dédié (jamais lié aux users) | via routes admin |

- **Séparation stricte user/admin** : les identifiants admin sont lus et
  approuvés **uniquement côté serveur** depuis `ADMIN_EMAILS` +
  `ADMIN_PASSWORD`. Un token admin est signé `kind:"admin"` et n'est jamais
  dérivé d'un compte Supabase. Un utilisateur **ne peut donc jamais** obtenir
  l'accès admin.

---

## 2. Variables d'environnement (Edge Function)

À définir dans les **secrets de la fonction** (Supabase → Edge Functions →
Secrets, ou `supabase secrets set`) :

```
SUPABASE_URL=<url de votre instance>            # ex. http://supabasekong-...sslip.io:8000
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
SUPABASE_ANON_KEY=<anon key>

# Admin (séparé des users)
ADMIN_EMAILS=ippooz.up.2@gmail.com              # liste séparée par , ; ou espace
ADMIN_PASSWORD=<mot de passe admin>
# Optionnel : ADMIN_TOTP_SECRET=<base32> pour la 2FA
```

> Le code accepte désormais `ADMIN_EMAILS` (en plus de l'ancien
> `ADMIN_USERNAME` / `ADMIN_ACCOUNTS`, cumulés et dédupliqués). La
> correspondance d'identifiant est insensible à la casse.

---

## 3. Créer les tables

Dans **SQL Editor** de votre Supabase (ou `psql`), exécuter dans l'ordre :

1. **`supabase/migrations/0001_core_schema.sql`**
   → crée toutes les tables, les triggers `updated_at`, active le **RLS** avec
   les politiques (lecture propriétaire / lecture publique pour le catalogue)
   et publie les tables temps réel dans `supabase_realtime`.

2. **`supabase/migrations/0002_migrate_from_kv.sql`** *(si reprise de données)*
   → recopie les données depuis `kv_store_752d1a39` vers les tables. Idempotent
   (`on conflict do nothing`), ne supprime jamais le KV.

### Reprise des données existantes (sans perte)

Les données actuelles vivent dans l'instance Supabase **gérée par Figma Make**
(`kv_store_752d1a39`), pas dans votre instance auto-hébergée. Pour migrer :

```bash
# a) Exporter le KV + les utilisateurs depuis l'instance source
pg_dump "<URL_SOURCE>" -t kv_store_752d1a39 --data-only -Fc -f kv.dump
pg_dump "<URL_SOURCE>" -n auth --data-only -Fc -f auth.dump   # comptes users

# b) Importer dans l'instance cible
pg_restore -d "<URL_CIBLE>" auth.dump        # users d'abord (FK)
pg_restore -d "<URL_CIBLE>" kv.dump          # puis le KV

# c) Lancer les migrations 0001 puis 0002 dans la cible
```

> Sans les `auth.users` importés au préalable, le script 0002 **ignore** par
> sécurité les lignes utilisateur (pas d'erreur FK, mais pas de reprise). Les
> tables de config (pricing/promos/partners/site) se migrent, elles, sans
> dépendance.

---

## 4. Vérifier la santé de la base (depuis le back office)

Ouvrir `/admin` (Vue d'ensemble) : le widget **Santé de la base de données**
appelle `GET /admin/db-health` et affiche pour chaque table attendue :

- existence (✓ verte / ✗ rouge si la migration 0001 n'a pas tourné),
- comptage de lignes (la persistance se vérifie d'un coup d'œil),
- état Realtime (publication `supabase_realtime`),
- l'URL Supabase active (alerte rouge si ce n'est pas l'instance IPPOO).

C'est le contrôle visuel unique pour valider que (a) les 22 tables existent,
(b) les données persistent, (c) le Realtime est bien câblé sur les tables
abonnées côté client.

## 4 bis. Vérifier RLS & Realtime côté SQL

```sql
-- RLS actif partout ?
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind='r' order by relname;

-- Politiques en place ?
select tablename, policyname, cmd, roles from pg_policies
where schemaname='public' order by tablename;

-- Tables publiées en Realtime ?
select tablename from pg_publication_tables where pubname='supabase_realtime';
```

Côté client, l'abonnement se fait via `src/app/espace-client/realtime.ts` :

```ts
import { subscribeUserTable } from "./realtime";
useEffect(() => subscribeUserTable("notifications", userId, (chg) => {
  // chg.eventType, chg.new, chg.old → mettre à jour l'état local
}), [userId]);
```

---

## 5. Connecter l'application à VOTRE instance

Le front lit désormais la connexion depuis des **variables d'env Vite**
(surcharge propre, sans toucher au fichier autogénéré `utils/supabase/info`).
Définir au build/déploiement (Cloudflare / `.env`) :

```
VITE_SUPABASE_URL=https://insurancedatabase.ippoo-aptdc.com
VITE_SUPABASE_ANON_KEY=<anon key de l'instance auto-hébergée>
```

À défaut, l'app retombe sur l'instance managée par défaut. `supabaseClient.ts`
expose `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE` (tous dérivés de ces
variables) — utilisés par le client Supabase, `apiFetch`, le Realtime et les
pages santé (`/health`).

> **Instance unique** : pour le développement local, un fichier `.env.local`
> (gitignoré) est prêt et force ces deux variables vers IPPOO. Pour les
> environnements distants (Cloudflare Pages/Workers), définir ces variables
> dans les secrets du projet. Le serveur Edge logge un avertissement au
> démarrage si `SUPABASE_URL` ne contient pas `ippoo-aptdc.com` — règle
> « instance unique IPPOO ».

- **Edge Function** : variables du §2 (déployez la fonction `make-server-752d1a39`
  sur votre instance, ou pointez son `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
  vers elle).
- L'instance dispose maintenant d'un domaine **HTTPS**
  (`https://insurancedatabase.ippoo-aptdc.com`) → pas de souci mixed-content/PWA.

---

## 6. Audit / contrôle « pas de données mortes »

```sql
-- Comptages par table
select 'contracts' t, count(*) from public.contracts
union all select 'claims', count(*) from public.claims
union all select 'payments', count(*) from public.payments
union all select 'profiles', count(*) from public.profiles
union all select 'notifications', count(*) from public.notifications;

-- Lignes orphelines éventuelles (ne devrait rien renvoyer)
select c.id from public.claims c
left join auth.users u on u.id = c.user_id where u.id is null;
```

---

## 7. Phase 2 — bascule serveur vers les tables (en cours)

Stratégie : **double-écriture KV + table**, **lecture table prioritaire avec
fallback KV**, **miroir best-effort** (si la table n'existe pas encore, aucune
route ne casse — on reste sur le KV). Voir `supabase/functions/server/db.tsx`.

| Domaine | Statut | Détail |
|---------|--------|--------|
| `notifications` | ✅ fait | `setNotifications()` miroite ; `GET /notifications` lit la table d'abord |
| `messages` | ✅ fait | `setMessages()` centralise + miroite ; `GET /messages` lit la table d'abord |
| `contracts` | ✅ fait | `setContracts()` miroite ; `GET /contracts` lit la table d'abord |
| `claims` | ✅ fait | `setClaims()` miroite ; `GET /claims` lit la table d'abord |
| `payments` | ✅ fait | `setPayments()` miroite ; `GET /payments` lit la table d'abord |
| `beneficiaries` | ✅ fait | `setBeneficiaries()` miroite ; `GET /beneficiaries` lit la table d'abord |
| `documents` | ✅ fait | `setDocuments()` miroite ; `GET /documents` lit la table d'abord |
| `kyc` | ⚠️ KV uniquement | structure `{current, history}` — refonte schéma dédiée à prévoir |

> Tant que les tables ne sont pas créées (migration 0001) sur l'instance que
> vise l'Edge Function, le miroir échoue silencieusement et le KV reste la
> source — **zéro régression**. Dès que `notifications`/`messages` existent et
> sont en Realtime, le client peut s'abonner via `realtime.ts`.

### Activer la lecture Realtime côté client (exemple)

```ts
import { subscribeUserTable } from "../espace-client/realtime";
useEffect(() => subscribeUserTable("notifications", userId, () => reload()), [userId]);
```

**Pages branchées en Realtime** :
- `NotificationsPage` → abonnement sur `notifications` (recharge automatique).
- `MessageriePage` → abonnement sur `messages` (recharge automatique).

Les autres pages (Contrats, Sinistres, Paiements, etc.) peuvent être branchées
selon le même patron — les tables sont déjà publiées en Realtime (cf. widget
de santé DB pour vérifier).

---

## Récapitulatif des fichiers livrés

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/0001_core_schema.sql` | Tables + RLS + Realtime + triggers |
| `supabase/migrations/0002_migrate_from_kv.sql` | Reprise des données KV → tables |
| `src/app/espace-client/realtime.ts` | Abonnements Realtime côté client |
| `supabase/functions/server/db.tsx` | Couche relationnelle + miroir KV→table (Phase 2) |
| `supabase/functions/server/index.tsx` | Auth `ADMIN_EMAILS`/`ADMIN_PASSWORD` + double-écriture notif/messages |
| `src/app/espace-client/supabaseClient.ts` | Connexion surchargeable `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` |
