-- CardioThoNoa — Fusion de `entitlements` dans `profiles`
-- ============================================================================
-- À exécuter APRÈS 0004_roles_centres_catalog.sql.
--
-- Objectif : un utilisateur = UNE seule ligne (`profiles`), au lieu d'être
-- éclaté entre `profiles` (rôle/centre) et `entitlements` (paiement). On déplace
-- les colonnes de paiement dans `profiles`, on recopie les données existantes,
-- puis on supprime `entitlements`.
--
-- ⚠️ DÉPLOIEMENT — IMPORTANT (sinon les paiements ne se reflètent plus) :
--   1. Exécuter cette migration dans le SQL Editor.
--   2. Redéployer la Edge Function `stripe-webhook` (elle écrit maintenant dans
--      `profiles`).  ➜  `supabase functions deploy stripe-webhook`
--   Si l'ordre est inversé, Stripe ré-essaie automatiquement les webhooks en
--   échec : aucun paiement n'est perdu, il est juste reflété avec un léger délai.
--
-- SÉCURITÉ : `entitlements` n'avait AUCUNE policy d'écriture (seul le service
-- role écrivait). `profiles` a une policy UPDATE own-row → un trigger empêche
-- désormais un utilisateur de s'auto-attribuer is_paid / plan / stripe_*.

-- ── 1. Colonnes de paiement sur profiles ────────────────────────────────────
alter table public.profiles
  add column if not exists is_paid                boolean     not null default false,
  add column if not exists plan                   text        check (plan in ('semester', 'annual', 'lifetime')),
  add column if not exists purchased_at           timestamptz,
  add column if not exists current_period_end     timestamptz,
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_session_id      text,
  add column if not exists stripe_subscription_id text;

-- ── 2. Recopie des données existantes depuis entitlements (si la table existe) ─
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'entitlements'
  ) then
    -- Met à jour les profils déjà créés.
    update public.profiles p
    set is_paid                = coalesce(e.is_paid, false),
        plan                   = e.plan,
        purchased_at           = e.purchased_at,
        current_period_end     = e.current_period_end,
        stripe_customer_id     = e.stripe_customer_id,
        stripe_session_id      = e.stripe_session_id,
        stripe_subscription_id = e.stripe_subscription_id
    from public.entitlements e
    where e.user_id = p.user_id;

    -- Crée une ligne profil pour d'éventuels payeurs sans profil (cas limite).
    insert into public.profiles
      (user_id, role, is_paid, plan, purchased_at, current_period_end,
       stripe_customer_id, stripe_session_id, stripe_subscription_id)
    select e.user_id, 'intern', coalesce(e.is_paid, false), e.plan, e.purchased_at,
           e.current_period_end, e.stripe_customer_id, e.stripe_session_id,
           e.stripe_subscription_id
    from public.entitlements e
    where not exists (select 1 from public.profiles p where p.user_id = e.user_id)
    on conflict (user_id) do nothing;
  end if;
end $$;

-- ── 3. Garde unique : rôle + colonnes de paiement ───────────────────────────
-- Remplace l'ancien trigger anti-escalade de rôle (migration 0004) par un garde
-- élargi qui protège AUSSI les colonnes de paiement. Seul le service role
-- (webhook Stripe / SQL editor → auth.uid() null) peut écrire ces colonnes.
create or replace function public.profiles_guard_protected()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / superuser (webhook Stripe, SQL Editor, backfill) :
  -- auth.uid() est null → on autorise tout. C'est le seul écrivain légitime
  -- des colonnes de rôle et de paiement.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Création par une session authentifiée (1re connexion) : valeurs sûres
    -- forcées. Impossible de naître admin ou avec un accès payant.
    new.role                   := 'intern';
    new.is_paid                := false;
    new.plan                   := null;
    new.purchased_at           := null;
    new.current_period_end     := null;
    new.stripe_customer_id     := null;
    new.stripe_session_id      := null;
    new.stripe_subscription_id := null;
    return new;
  end if;

  -- UPDATE par une session authentifiée :
  -- 1) seul un admin peut changer le rôle (anti-escalade) ;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier le rôle.';
  end if;
  -- 2) personne ne peut modifier manuellement les colonnes de paiement.
  if new.is_paid                is distinct from old.is_paid
     or new.plan                is distinct from old.plan
     or new.purchased_at        is distinct from old.purchased_at
     or new.current_period_end  is distinct from old.current_period_end
     or new.stripe_customer_id  is distinct from old.stripe_customer_id
     or new.stripe_session_id   is distinct from old.stripe_session_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'Les informations de paiement ne peuvent pas être modifiées manuellement.';
  end if;

  return new;
end;
$$;

-- Bascule du trigger : on retire l'ancien (rôle seul) et on pose le nouveau.
drop trigger if exists profiles_guard_role on public.profiles;
drop trigger if exists profiles_guard_protected on public.profiles;
create trigger profiles_guard_protected
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_protected();

-- L'ancienne fonction n'est plus référencée.
drop function if exists public.profiles_guard_role();

-- ── 4. Suppression de entitlements ──────────────────────────────────────────
-- Les données ont été recopiées dans profiles ci-dessus.
drop table if exists public.entitlements cascade;
