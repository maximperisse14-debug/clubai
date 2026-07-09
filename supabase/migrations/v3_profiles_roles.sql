-- Migration V3 : Table profiles + rôles admin/gérant
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Table profiles
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'gerant' check (role in ('admin', 'gerant')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

-- 2. Créer automatiquement un profil 'gerant' à chaque inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role) values (new.id, 'gerant')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 3. Mettre à jour la policy clubs pour que l'admin voie tous les clubs
-- (supprimer l'ancienne policy si elle existe)
drop policy if exists "clubs_select" on clubs;

create policy "clubs_select" on clubs
  for select using (
    owner_id = auth.uid()
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- 4. Insérer l'admin ClubAI
-- ÉTAPE MANUELLE : récupère ton UUID dans Supabase > Authentication > Users,
-- puis exécute :
--
--   insert into profiles (id, role)
--   values ('REMPLACE_PAR_TON_UUID', 'admin')
--   on conflict (id) do update set role = 'admin';
--
-- Ou via l'interface Supabase > Table Editor > profiles > Insert row.
