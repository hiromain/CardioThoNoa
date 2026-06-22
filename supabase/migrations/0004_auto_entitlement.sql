-- CardioThoNoa — Accès automatique à la création du compte
-- =========================================================
-- Dès qu'un nouvel utilisateur s'inscrit, il reçoit automatiquement
-- is_paid=TRUE (plan lifetime) sans passer par Stripe.
-- Le trigger s'exécute avec les droits service role (security definer)
-- pour contourner la RLS en écriture sur entitlements.

create or replace function public.handle_new_user_entitlement()
returns trigger language plpgsql security definer as $$
begin
  insert into public.entitlements (user_id, is_paid, purchased_at, plan)
  values (new.id, true, now(), 'lifetime')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_entitlement on auth.users;
create trigger on_auth_user_created_entitlement
  after insert on auth.users
  for each row execute function public.handle_new_user_entitlement();

-- Backfill : accès complet pour les utilisateurs déjà inscrits sans ligne entitlements.
insert into public.entitlements (user_id, is_paid, purchased_at, plan)
select id, true, now(), 'lifetime'
from auth.users
where id not in (select user_id from public.entitlements)
on conflict (user_id) do nothing;
