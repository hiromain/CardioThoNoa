# CardioThoNoa — Notes pour Claude

## Contexte
Application web mono-utilisateur de suivi de formation chirurgicale pour une
interne en chirurgie cardio-thoracique (CTCV). L'état est persisté en
localStorage (export/import JSON toujours disponible) **et** synchronisé dans le
cloud via Supabase, derrière une authentification obligatoire par code OTP email.

**Important (RGPD) :** seules les statistiques de formation sont synchronisées
(services, chirurgiens, semestres, types de gestes, interventions, profil). Les
**données patient ne quittent jamais l'appareil** — elles sont volontairement
exclues du payload de sync (voir `src/lib/syncEngine.js` et la table
`app_data`).

**Statut : prototype fonctionnel terminé.** On entre maintenant dans une phase
d'affinage (UX, bugs, fonctionnalités manquantes, polish visuel) sur la base
existante.

## Où se trouve le code
- `src/` → **application réelle** (Vite + React 18, montée via `src/main.jsx` /
  `index.html`). C'est ici qu'il faut faire toutes les modifications.
- `Claude Design/` → maquettes/prototype de référence visuelle (ancien style
  "globals" sans imports ES, IOSDevice frame). Sert d'inspiration pour le style
  iOS/Liquid Glass mais n'est **pas** branché sur le build Vite. Ne pas y
  travailler sauf demande explicite de comparaison de design.
- `Untitled-1.md` → spec fonctionnelle d'origine (modèle de données, routes,
  fonctionnalités attendues). Document de référence pour vérifier que le
  prototype couvre bien le périmètre prévu.

## Stack
- React 18 + Vite, React Router v6
- Zustand (`src/store/useStore.js`, `src/store/hooks.js`) pour l'état global
  + persistance localStorage ; `src/store/useAuthStore.js` pour l'auth Supabase
- Supabase (`@supabase/supabase-js`) : auth OTP email + sync cloud
  (`src/lib/supabaseClient.js`, `src/lib/syncEngine.js`)
- Tailwind CSS v3
- Recharts (statistiques), date-fns, lucide-react

## Configuration Supabase
- Copier `.env.example` → `.env.local` et renseigner `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` (sinon l'écran de connexion affiche un message de
  config et l'app ne démarre pas).
- Exécuter `supabase/migrations/0001_app_data.sql` dans le projet Supabase
  (table `app_data` + RLS par `user_id`).
- Exécuter aussi `0002`, `0003` (entitlements/paywall), puis
  `0004_roles_centres_catalog.sql` (rôles admin/interne, centres, catalogue de
  gestes partagé) et enfin `0005_merge_entitlements_into_profiles.sql`.
- **Migration 0005** : la table `entitlements` a fusionné dans `profiles`
  (un utilisateur = une seule ligne). Les colonnes de paiement
  (`is_paid`, `plan`, `current_period_end`, `stripe_*`) sont protégées par le
  trigger `profiles_guard_protected` (seul le service role du webhook écrit).
  **Après 0005, redéployer la Edge Function `stripe-webhook`** (elle écrit
  désormais dans `profiles`) : `supabase functions deploy stripe-webhook`.
- Activer le provider Email dans Supabase Auth (mode OTP / code à 6 chiffres).

## Rôles & supervision (migration 0004)
- Deux rôles dans la table `profiles` : `intern` (par défaut) et `admin`
  (super-admin global). Le rôle est chargé après connexion dans
  `useAuthStore` (`role`, `isAdmin`, `centreId` via `refreshProfile`).
- **Catalogue de gestes PARTAGÉ** : la table `procedure_types` est désormais la
  source unique du catalogue (lue par tous, écrite par les admins). Elle n'est
  **plus** synchronisée par-utilisateur (`procedureTypes` retiré de
  `CLOUD_FIELDS`/`SYNC_FIELDS`). Chargement via `src/lib/catalog.js` +
  `setCatalog`. Un interne peut ajouter un geste **personnel local**
  (`local: true`, jamais synchronisé) à la volée dans NewIntervention ; le
  catalogue officiel se gère dans l'espace admin (`/admin/catalogue`).
- **Centres** : table `centres` ; chaque interne se rattache via
  `profiles.centre_id` (Réglages + onboarding). Sert aux stats par centre.
- **Espace admin** : routes `/admin/*` (gardées par `RequireAdmin` ET la RLS),
  pages dans `src/pages/admin/`, accès données dans `src/lib/adminQueries.js`.
- **Sécurité** : tout est appliqué côté serveur via RLS + fonctions
  `SECURITY DEFINER` (`is_admin()`, `admin_list_interns()`). Le gating client
  n'est qu'une commodité. Un interne ne peut pas se promouvoir (trigger
  anti-escalade sur `profiles.role`).
- **Bootstrap** : le 1er admin se pose une fois en SQL
  (`update public.profiles set role='admin' where email='…'`), ensuite la
  gestion des rôles se fait dans `/admin/comptes`.
- **RGPD inchangé** : les admins ne voient que les stats de formation déjà
  synchronisées ; aucune donnée patient n'est lue (jamais dans `app_data`).

## Structure src/
- `src/data/` → constantes + données de seed (premier lancement)
- `src/lib/` → helpers (id, dates, queries, stats, export JSON)
- `src/components/ui/` → primitives UI (Button, Card, Modal, Chip, etc.)
- `src/components/forms/` → modales de formulaire (CRUD semestres, patients,
  services, chirurgiens, types de gestes)
- `src/components/layout/` → AppLayout, TopBar, BottomNav
- `src/pages/` → écrans (Dashboard, Semestres, SemestreDetail, NewIntervention,
  InterventionDetail, Patients, PatientDetail, Statistics, Settings)
- `src/pages/admin/` → espace d'administration (AdminDashboard, InternDetail,
  CatalogManage, UserManage, CentreStats, RequireAdmin)

## Commandes
- `npm run dev` — serveur de dev (port 5173)
- `npm run build` / `npm run preview`

## Git & Synchronisation GitHub
**Flux de travail :**
- Claude **committe** régulièrement (après chaque modif importante)
- Tu **pushes** toi-même au rythme que tu préfères (1x/semaine, ou quand c'est stable)

**Commit** = sauvegarde locale (sur ton PC)
**Push** = envoi sur GitHub (sauvegarde cloud)

**Bonnes pratiques pour ton push :**
- Au minimum 1x/semaine (sauvegarde cloud)
- Avant de fermer le laptop pour plusieurs jours
- Quand tu as fait plusieurs modifs et que tu veux les archiver

**Commande simple pour tout pousser :**
```bash
git push
```
(Elle envoie tous les commits locaux qui n'ont pas encore été pushés)

## Points d'attention pour la suite
- Vérifier la cohérence avec `Untitled-1.md` (filtres contextuels par
  service/semestre actif, listes filtrées selon le type de chirurgie, etc.)
- Application pensée mobile-first (saisie en salle d'opération) : tout
  changement UI doit rester utilisable sur petit écran.
- Toute donnée patient reste locale (RGPD) — ne jamais ajouter `patients` au
  payload de sync ni introduire d'appel réseau qui enverrait des données
  personnelles. La liste des champs synchronisés est `CLOUD_FIELDS` dans
  `useStore.js` / `SYNC_FIELDS` dans `syncEngine.js`.
- Sync « instantané » (whole-state upsert, debounce 4 s) : pas de merge
  champ-à-champ. Le dernier appareil qui écrit gagne. À garder en tête avant
  d'ajouter du multi-appareil simultané.
