-- CardioThoNoa — Droits d'accès (achat unique)
-- =================================================
-- À exécuter dans le SQL Editor du dashboard Supabase (ou via la CLI), APRÈS
-- 0001_app_data.sql.
--
-- Une ligne par utilisateur indiquant s'il a payé (achat unique, à vie). Cette
-- table est la SOURCE DE VÉRITÉ du paywall : seul le webhook Stripe (service
-- role) y écrit. Le client peut uniquement LIRE sa propre ligne — il ne peut
-- jamais s'auto-attribuer `is_paid`.

create table if not exists public.entitlements (
  user_id             uuid        primary key references auth.users (id) on delete cascade,
  is_paid             boolean     not null default false,
  purchased_at        timestamptz,
  stripe_customer_id  text,
  stripe_session_id   text,
  updated_at          timestamptz not null default now()
);

-- Réutilise la fonction set_updated_at() créée par 0001_app_data.sql.
drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────────
-- Lecture seule de sa propre ligne. AUCUNE policy insert/update/delete : le
-- service role (utilisé par la fonction Edge `stripe-webhook`) contourne la RLS
-- et reste le seul à pouvoir écrire.
alter table public.entitlements enable row level security;

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);
