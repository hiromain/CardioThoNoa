-- CardioThoNoa — Schéma de synchronisation cloud
-- =================================================
-- À exécuter dans le SQL Editor du dashboard Supabase (ou via la CLI).
--
-- Modèle « instantané » : une seule ligne par utilisateur contenant tout l'état
-- synchronisable sous forme de colonnes JSON. Les données patient ne sont JAMAIS
-- stockées ici (aucune colonne `patients`) — elles restent locales (RGPD).

create table if not exists public.app_data (
  user_id              uuid        primary key references auth.users (id) on delete cascade,
  services             jsonb       not null default '[]'::jsonb,
  surgeons             jsonb       not null default '[]'::jsonb,
  semesters            jsonb       not null default '[]'::jsonb,
  procedure_types      jsonb       not null default '[]'::jsonb,
  interventions        jsonb       not null default '[]'::jsonb,
  current_semester_id  text,
  profile              jsonb,
  updated_at           timestamptz not null default now()
);

-- Met à jour updated_at à chaque écriture.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_data_set_updated_at on public.app_data;
create trigger app_data_set_updated_at
  before update on public.app_data
  for each row execute function public.set_updated_at();

-- ── Row Level Security : chaque utilisateur ne voit que sa propre ligne ──────────
alter table public.app_data enable row level security;

drop policy if exists "app_data_select_own" on public.app_data;
create policy "app_data_select_own"
  on public.app_data for select
  using (auth.uid() = user_id);

drop policy if exists "app_data_insert_own" on public.app_data;
create policy "app_data_insert_own"
  on public.app_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "app_data_update_own" on public.app_data;
create policy "app_data_update_own"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "app_data_delete_own" on public.app_data;
create policy "app_data_delete_own"
  on public.app_data for delete
  using (auth.uid() = user_id);
