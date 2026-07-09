-- Migration V4 : Remplace etudes_concurrence par concurrence_calendrier (par date)
-- À exécuter dans l'éditeur SQL Supabase

-- Supprimer l'ancienne table (plus utilisée)
drop table if exists etudes_concurrence;

-- Nouvelle table : un jeu de coefficients par (club, date)
create table if not exists concurrence_calendrier (
  id                 uuid primary key default uuid_generate_v4(),
  club_id            uuid references clubs(id) on delete cascade,
  date               date not null,
  directs_petites    integer not null default 0,
  directs_moyennes   integer not null default 0,
  directs_grosses    integer not null default 0,
  lointains_petites  integer not null default 0,
  lointains_moyennes integer not null default 0,
  lointains_grosses  integer not null default 0,
  notes              text,
  updated_by         uuid references auth.users(id),
  updated_at         timestamptz default now(),
  unique(club_id, date)
);

alter table concurrence_calendrier enable row level security;

-- Seul l'admin peut écrire
create policy "cc_admin_all" on concurrence_calendrier
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Le gérant peut lire en lecture seule les données de son club
create policy "cc_gerant_read" on concurrence_calendrier
  for select using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );
