-- CardioThoNoa — Rôles (admin/interne), centres et catalogue de gestes partagé
-- ============================================================================
-- À exécuter dans le SQL Editor du dashboard Supabase (ou via la CLI), APRÈS
-- 0001_app_data.sql, 0002_entitlements.sql, 0003_entitlements_plans.sql.
--
-- Cette migration fait passer l'app du modèle strictement mono-utilisateur à un
-- modèle supervisé :
--   - `centres`         : référentiel des centres hospitaliers.
--   - `profiles`        : 1 ligne / compte → rôle ('intern' | 'admin') + centre.
--   - `procedure_types` : catalogue de gestes PARTAGÉ (lu par tous, écrit par
--                         les admins) — remplace la copie par-utilisateur.
--   - is_admin()        : helper SECURITY DEFINER (évite la récursion RLS).
--   - app_data          : lecture additionnelle pour les admins (supervision).
--
-- RGPD : aucune donnée patient ici. Les admins ne voient que les statistiques
-- de formation déjà synchronisées (cf. app_data, sans la colonne `patients`).

-- ── 1. Centres ──────────────────────────────────────────────────────────────
create table if not exists public.centres (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  city        text,
  created_at  timestamptz not null default now()
);

-- ── 2. Profiles (rôle + rattachement centre) ────────────────────────────────
create table if not exists public.profiles (
  user_id       uuid        primary key references auth.users (id) on delete cascade,
  role          text        not null default 'intern' check (role in ('intern', 'admin')),
  centre_id     uuid        references public.centres (id) on delete set null,
  display_name  text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Réutilise set_updated_at() (créée par 0001_app_data.sql).
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── 3. Helper is_admin() ────────────────────────────────────────────────────
-- SECURITY DEFINER → contourne la RLS de `profiles` (sinon récursion infinie
-- quand une policy de `profiles` interroge `profiles`). search_path verrouillé.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── 4. Garde anti-escalade de privilège ─────────────────────────────────────
-- Un interne ne peut JAMAIS se promouvoir : seul un admin peut modifier `role`.
create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() est null quand exécuté en superuser (SQL Editor, service role,
  -- bootstrap du premier admin) → on laisse passer. La protection ne s'applique
  -- qu'aux sessions utilisateur authentifiées.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier le rôle.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.profiles_guard_role();

-- ── 5. Catalogue de gestes partagé ──────────────────────────────────────────
create table if not exists public.procedure_types (
  id            text        primary key,
  name          text        not null,
  abbr          text,
  scope         text        not null check (scope in ('patient', 'intern', 'both')),
  service_type  text        not null,
  intern_steps  jsonb       not null default '[]'::jsonb,
  is_step       boolean     not null default false,
  sort_order    int         not null default 0,
  archived      boolean     not null default false,
  updated_at    timestamptz not null default now()
);

drop trigger if exists procedure_types_set_updated_at on public.procedure_types;
create trigger procedure_types_set_updated_at
  before update on public.procedure_types
  for each row execute function public.set_updated_at();

-- ── 6. Row Level Security ───────────────────────────────────────────────────

-- centres : lecture pour tout authentifié ; écriture réservée aux admins.
alter table public.centres enable row level security;

drop policy if exists "centres_select_all" on public.centres;
create policy "centres_select_all"
  on public.centres for select
  to authenticated using (true);

drop policy if exists "centres_admin_write" on public.centres;
create policy "centres_admin_write"
  on public.centres for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles : chacun lit/écrit SA ligne (le trigger bloque l'auto-promotion) ;
-- un admin lit et écrit toutes les lignes (interface de gestion des comptes).
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
  on public.profiles for delete
  to authenticated using (public.is_admin());

-- procedure_types : lecture pour tout authentifié ; écriture réservée aux admins.
alter table public.procedure_types enable row level security;

drop policy if exists "procedure_types_select_all" on public.procedure_types;
create policy "procedure_types_select_all"
  on public.procedure_types for select
  to authenticated using (true);

drop policy if exists "procedure_types_admin_write" on public.procedure_types;
create policy "procedure_types_admin_write"
  on public.procedure_types for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- app_data : un admin peut LIRE toutes les lignes (supervision). Les écritures
-- restent strictement own-row (un admin ne modifie jamais les données d'un
-- interne). On remplace la policy SELECT de 0001 par une version élargie.
drop policy if exists "app_data_select_own" on public.app_data;
create policy "app_data_select_own_or_admin"
  on public.app_data for select
  using (auth.uid() = user_id or public.is_admin());

-- ── 7. RPC supervision : liste agrégée des internes (admin uniquement) ───────
create or replace function public.admin_list_interns()
returns table (
  user_id            uuid,
  display_name       text,
  email              text,
  role               text,
  centre_id          uuid,
  centre_name        text,
  intervention_count int,
  last_activity      timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.display_name,
    p.email,
    p.role,
    p.centre_id,
    c.name as centre_name,
    coalesce(jsonb_array_length(d.interventions), 0) as intervention_count,
    d.updated_at as last_activity
  from public.profiles p
  left join public.centres c on c.id = p.centre_id
  left join public.app_data d on d.user_id = p.user_id
  where public.is_admin()
  order by p.display_name nulls last;
$$;

-- ── 8. Seed du catalogue de gestes (source : src/data/procedureTypes.js) ─────
-- Idempotent : on n'écrase pas d'éventuelles personnalisations admin.
insert into public.procedure_types
  (id, name, abbr, scope, service_type, intern_steps, is_step, sort_order)
values
  ('pt-cabg', 'Pontage aorto-coronarien', 'CABG', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-prelev-saphene","pt-prelev-mammaire"]'::jsonb, false, 0),
  ('pt-rva', 'Remplacement valvulaire aortique', 'RVA', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-resection-valve","pt-remplacement-valve","pt-fermeture-aortotomie"]'::jsonb, false, 1),
  ('pt-rvm', 'Remplacement valvulaire mitral', 'RVM', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-atriotomie","pt-resection-valve","pt-remplacement-valve","pt-fermeture-atriotomie"]'::jsonb, false, 2),
  ('pt-plastie', 'Plastie mitrale', 'Plastie M.', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-atriotomie","pt-resection-valve","pt-remplacement-valve","pt-fermeture-atriotomie","pt-reparation-mitrale"]'::jsonb, false, 3),
  ('pt-plastie-tricuspide', 'Plastie tricuspide', 'Plastie T.', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-reparation-tricuspide","pt-fermeture-atrium-droit"]'::jsonb, false, 4),
  ('pt-aorte', 'Remplacement aorte ascendante', 'Aorte asc.', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-anastomose-aortique"]'::jsonb, false, 5),
  ('pt-bentall', 'Intervention de Bentall', 'Bentall', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-prepa-culot-aortique","pt-reimplant-coronaires","pt-resection-valve","pt-remplacement-valve","pt-fermeture-aortotomie","pt-anastomose-aortique"]'::jsonb, false, 6),
  ('pt-tirone-david', 'Intervention de Tirone David', 'Tirone David', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-reimplant-coronaires","pt-anastomose-aortique"]'::jsonb, false, 7),
  ('pt-ross', 'Intervention de Ross', 'Ross', 'both', 'cardiaque', '["pt-abord-scarpa"]'::jsonb, false, 8),
  ('pt-dissection-aortique', 'Dissection aortique (Type A)', 'Dissection aortique', 'both', 'cardiaque', '["pt-abord-scarpa","pt-reparation-femorale"]'::jsonb, false, 9),
  ('pt-civ', 'Fermeture CIV', 'CIV', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 10),
  ('pt-cia', 'Fermeture CIA', 'CIA', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 11),
  ('pt-ecmo', 'Pose ECMO', 'ECMO', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 12),
  ('pt-ablation-ecmo', 'Ablation de l''ECMO', 'Ablation ECMO', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 13),
  ('pt-lvad', 'Pose LVAD / BiVAD', 'LVAD', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 14),
  ('pt-greffe-cardiaque', 'Transplantation cardiaque', 'Greffe cardiaque', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout","pt-prelev-cardiaque"]'::jsonb, false, 15),
  ('pt-reprise-sternale', 'Reprise chirurgicale (resternotomie)', 'Reprise sternale', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-fermeture","pt-tout"]'::jsonb, false, 16),
  ('pt-drain-pericarde', 'Drainage péricardique', 'Drain péricarde', 'both', 'cardiaque', '["pt-sterno","pt-abord-scarpa","pt-canul","pt-decanul","pt-fermeture","pt-tout"]'::jsonb, false, 17),
  ('pt-abord-scarpa', 'Abord fémoral (Scarpa)', 'Abord Scarpa', 'intern', 'cardiaque', '[]'::jsonb, true, 18),
  ('pt-decanul', 'Décanulation / sevrage de CEC', 'Décanulation', 'intern', 'cardiaque', '[]'::jsonb, true, 19),
  ('pt-prelev-saphene', 'Prélèvement de la veine saphène', 'Prélèv. saphène', 'intern', 'cardiaque', '[]'::jsonb, true, 20),
  ('pt-prelev-mammaire', 'Prélèvement de l''artère mammaire interne', 'Prélèv. AMI', 'intern', 'cardiaque', '[]'::jsonb, true, 21),
  ('pt-resection-valve', 'Résection valvulaire', 'Résection valve', 'intern', 'cardiaque', '[]'::jsonb, true, 22),
  ('pt-remplacement-valve', 'Remplacement valvulaire (implantation prothèse)', 'Remplacement valve', 'intern', 'cardiaque', '[]'::jsonb, true, 23),
  ('pt-fermeture-aortotomie', 'Fermeture de l''aortotomie', 'Fermeture aortotomie', 'intern', 'cardiaque', '[]'::jsonb, true, 24),
  ('pt-atriotomie', 'Atriotomie', 'Atriotomie', 'intern', 'cardiaque', '[]'::jsonb, true, 25),
  ('pt-fermeture-atriotomie', 'Fermeture de l''atriotomie', 'Fermeture atriotomie', 'intern', 'cardiaque', '[]'::jsonb, true, 26),
  ('pt-reparation-mitrale', 'Réparation valvulaire mitrale (plastie)', 'Plastie mitrale', 'intern', 'cardiaque', '[]'::jsonb, true, 27),
  ('pt-reparation-tricuspide', 'Réparation valvulaire tricuspide (plastie)', 'Plastie tricuspide', 'intern', 'cardiaque', '[]'::jsonb, true, 28),
  ('pt-fermeture-atrium-droit', 'Fermeture de l''atriotomie droite', 'Fermeture AD', 'intern', 'cardiaque', '[]'::jsonb, true, 29),
  ('pt-anastomose-aortique', 'Anastomose aortique (greffon / tube)', 'Anastomose aortique', 'intern', 'cardiaque', '[]'::jsonb, true, 30),
  ('pt-prepa-culot-aortique', 'Préparation du culot aortique', 'Culot aortique', 'intern', 'cardiaque', '[]'::jsonb, true, 31),
  ('pt-reimplant-coronaires', 'Réimplantation des coronaires', 'Réimplant. coronaires', 'intern', 'cardiaque', '[]'::jsonb, true, 32),
  ('pt-reparation-femorale', 'Réparation de l''artère fémorale', 'Réparation fémorale', 'intern', 'cardiaque', '[]'::jsonb, true, 33),
  ('pt-prelev-cardiaque', 'Prélèvement du greffon cardiaque', 'Prélèv. cardiaque', 'intern', 'cardiaque', '[]'::jsonb, true, 34),
  ('pt-lob', 'Lobectomie', 'Lobectomie', 'both', 'thoracique', '["pt-thoraco","pt-trocarts","pt-explo-pleurale","pt-dissection-hile","pt-agraf-vasc","pt-agraf-bronch","pt-curage","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 35),
  ('pt-seg', 'Segmentectomie', 'Segmentectomie', 'both', 'thoracique', '["pt-thoraco","pt-trocarts","pt-explo-pleurale","pt-dissection-hile","pt-agraf-vasc","pt-agraf-bronch","pt-curage","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 36),
  ('pt-pneumo', 'Pneumonectomie', 'Pneumonectomie', 'both', 'thoracique', '["pt-thoraco","pt-explo-pleurale","pt-dissection-hile","pt-agraf-vasc","pt-agraf-bronch","pt-curage","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 37),
  ('pt-resec', 'Résection atypique', 'Résection at.', 'both', 'thoracique', '["pt-thoraco","pt-trocarts","pt-explo-pleurale","pt-agraf-parenchyme","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 38),
  ('pt-pleur', 'Pleurectomie', 'Pleurectomie', 'both', 'thoracique', '["pt-thoraco","pt-trocarts","pt-explo-pleurale","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 39),
  ('pt-decort', 'Décortication pleurale', 'Décortication', 'both', 'thoracique', '["pt-thoraco","pt-explo-pleurale","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 40),
  ('pt-thym', 'Thymectomie', 'Thymectomie', 'both', 'thoracique', '["pt-sterno","pt-trocarts","pt-explo-pleurale","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 41),
  ('pt-oeso', 'Œsophagectomie', 'Œsophagectomie', 'both', 'thoracique', '["pt-thoraco","pt-trocarts","pt-dissection-hile","pt-curage","pt-tube-gastrique","pt-anastomose-oeso","pt-abord-cervical","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 42),
  ('pt-vats', 'Chirurgie thoracoscopique vidéo-assistée', 'VATS', 'both', 'thoracique', '["pt-trocarts","pt-explo-pleurale","pt-drain","pt-fermeture","pt-tout"]'::jsonb, false, 43),
  ('pt-drain', 'Pose de drain thoracique', 'Drain', 'both', 'thoracique', '["pt-tout"]'::jsonb, false, 44),
  ('pt-medias', 'Médiastinoscopie', 'Médiastinoscopie', 'both', 'thoracique', '["pt-abord-cervical","pt-biopsie-gg","pt-fermeture","pt-tout"]'::jsonb, false, 45),
  ('pt-trocarts', 'Mise en place des trocarts (VATS)', 'Trocarts', 'intern', 'thoracique', '[]'::jsonb, true, 46),
  ('pt-explo-pleurale', 'Exploration pleurale', 'Explo. pleurale', 'intern', 'thoracique', '[]'::jsonb, true, 47),
  ('pt-dissection-hile', 'Dissection hilaire (artère, veines, bronche)', 'Dissection hile', 'intern', 'thoracique', '[]'::jsonb, true, 48),
  ('pt-agraf-vasc', 'Section / agrafage vasculaire (artère ou veines pulmonaires)', 'Agrafage vasc.', 'intern', 'thoracique', '[]'::jsonb, true, 49),
  ('pt-agraf-bronch', 'Section / agrafage bronchique', 'Agrafage bronch.', 'intern', 'thoracique', '[]'::jsonb, true, 50),
  ('pt-agraf-parenchyme', 'Agrafage parenchymateux (résection cunéiforme)', 'Agrafage parench.', 'intern', 'thoracique', '[]'::jsonb, true, 51),
  ('pt-curage', 'Curage ganglionnaire médiastinal', 'Curage gg', 'intern', 'thoracique', '[]'::jsonb, true, 52),
  ('pt-tube-gastrique', 'Confection du tube gastrique', 'Tube gastrique', 'intern', 'thoracique', '[]'::jsonb, true, 53),
  ('pt-anastomose-oeso', 'Anastomose œso-gastrique', 'Anastomose', 'intern', 'thoracique', '[]'::jsonb, true, 54),
  ('pt-abord-cervical', 'Abord cervical (cervicotomie)', 'Abord cervical', 'intern', 'thoracique', '[]'::jsonb, true, 55),
  ('pt-biopsie-gg', 'Biopsie ganglionnaire', 'Biopsie gg', 'intern', 'thoracique', '[]'::jsonb, true, 56),
  ('pt-cong-fallot', 'Correction tétralogie de Fallot', 'Fallot', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-resec-infund","pt-cong-patch-civ","pt-cong-recon-vd"]'::jsonb, false, 57),
  ('pt-cong-civ', 'Fermeture CIV (congénitale)', 'CIV cong.', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-patch-civ"]'::jsonb, false, 58),
  ('pt-cong-cia', 'Fermeture CIA (congénitale)', 'CIA cong.', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-patch-cia"]'::jsonb, false, 59),
  ('pt-cong-switch', 'Switch artériel (transposition des grands vaisseaux)', 'Switch artériel', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-reimplant-cor","pt-cong-anastomose-ao","pt-cong-anastomose-pulm"]'::jsonb, false, 60),
  ('pt-cong-cav', 'Correction canal atrio-ventriculaire (CAV)', 'CAV', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-patch-civ","pt-cong-patch-cia","pt-cong-recon-valves-av"]'::jsonb, false, 61),
  ('pt-cong-coarct', 'Correction de coarctation de l''aorte', 'Coarctation', 'both', 'congenitale', '["pt-thoraco","pt-fermeture","pt-tout","pt-cong-resec-coarct","pt-cong-anastomose-ao"]'::jsonb, false, 62),
  ('pt-cong-fontan', 'Opération de Fontan (anastomose cavo-pulmonaire totale)', 'Fontan', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-anastomose-cavo-pulm"]'::jsonb, false, 63),
  ('pt-cong-norwood', 'Opération de Norwood (hypoplasie du ventricule gauche)', 'Norwood', 'both', 'congenitale', '["pt-sterno","pt-canul","pt-cong-decanul","pt-fermeture","pt-tout","pt-cong-neo-aorte","pt-cong-shunt-pall"]'::jsonb, false, 64),
  ('pt-cong-blalock', 'Shunt de Blalock-Taussig modifié', 'BT Shunt', 'both', 'congenitale', '["pt-thoraco","pt-fermeture","pt-tout","pt-cong-shunt-pall"]'::jsonb, false, 65),
  ('pt-cong-banding', 'Cerclage de l''artère pulmonaire (banding)', 'Banding AP', 'both', 'congenitale', '["pt-sterno","pt-fermeture","pt-tout","pt-cong-cerclage-ap"]'::jsonb, false, 66),
  ('pt-cong-decanul', 'Décanulation / sevrage de CEC', 'Décanulation', 'intern', 'congenitale', '[]'::jsonb, true, 67),
  ('pt-cong-resec-infund', 'Résection infundibulaire', 'Résection infund.', 'intern', 'congenitale', '[]'::jsonb, true, 68),
  ('pt-cong-patch-civ', 'Fermeture de la CIV par patch', 'Patch CIV', 'intern', 'congenitale', '[]'::jsonb, true, 69),
  ('pt-cong-patch-cia', 'Fermeture de la CIA par patch ou suture directe', 'Patch CIA', 'intern', 'congenitale', '[]'::jsonb, true, 70),
  ('pt-cong-recon-vd', 'Reconstruction de la voie d''éjection du ventricule droit (RVOT)', 'Recon. RVOT', 'intern', 'congenitale', '[]'::jsonb, true, 71),
  ('pt-cong-anastomose-pulm', 'Anastomose pulmonaire', 'Anastomose pulm.', 'intern', 'congenitale', '[]'::jsonb, true, 72),
  ('pt-cong-anastomose-ao', 'Anastomose aortique (congénitale)', 'Anastomose ao.', 'intern', 'congenitale', '[]'::jsonb, true, 73),
  ('pt-cong-reimplant-cor', 'Réimplantation des artères coronaires', 'Réimplant. coronaires', 'intern', 'congenitale', '[]'::jsonb, true, 74),
  ('pt-cong-anastomose-cavo-pulm', 'Anastomose cavo-pulmonaire totale (TCPC)', 'TCPC', 'intern', 'congenitale', '[]'::jsonb, true, 75),
  ('pt-cong-neo-aorte', 'Construction de la néo-aorte', 'Néo-aorte', 'intern', 'congenitale', '[]'::jsonb, true, 76),
  ('pt-cong-shunt-pall', 'Anastomose palliative / shunt systémico-pulmonaire', 'Shunt palliatif', 'intern', 'congenitale', '[]'::jsonb, true, 77),
  ('pt-cong-cerclage-ap', 'Cerclage de l''artère pulmonaire', 'Cerclage AP', 'intern', 'congenitale', '[]'::jsonb, true, 78),
  ('pt-cong-resec-coarct', 'Résection de la coarctation', 'Résection coarct.', 'intern', 'congenitale', '[]'::jsonb, true, 79),
  ('pt-cong-recon-valves-av', 'Reconstruction des valves atrio-ventriculaires', 'Recon. valves AV', 'intern', 'congenitale', '[]'::jsonb, true, 80),
  ('pt-sterno', 'Sternotomie', 'Sternotomie', 'both', 'autre', '[]'::jsonb, false, 81),
  ('pt-thoraco', 'Thoracotomie', 'Thoracotomie', 'both', 'autre', '[]'::jsonb, false, 82),
  ('pt-canul', 'Canulation', 'Canulation', 'both', 'autre', '[]'::jsonb, false, 83),
  ('pt-fermeture', 'Fermeture pariétale', 'Fermeture', 'intern', 'autre', '[]'::jsonb, true, 84),
  ('pt-tout', 'Intervention principale réalisée en totalité par l''interne', 'Tout', 'intern', 'autre', '[]'::jsonb, true, 85)
on conflict (id) do nothing;

-- ── 9. Bootstrap du premier administrateur ──────────────────────────────────
-- Le rôle se gère ensuite via l'interface d'admin de l'app. Pour le TOUT
-- premier admin, exécuter une fois (en remplaçant l'adresse) :
--
--   update public.profiles set role = 'admin'
--   where email = 'adresse-admin@example.com';
--
-- (La ligne `profiles` est créée automatiquement à la première connexion.)
