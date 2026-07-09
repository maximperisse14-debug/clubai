-- Migration V2 : Moteur de scoring ClubAI
-- À exécuter dans l'éditeur SQL Supabase

-- Paramètres du club (saisis par le gérant)
create table if not exists club_settings (
  club_id        uuid primary key references clubs(id) on delete cascade,
  type_etablissement text not null default 'bar'
    check (type_etablissement in ('bar','discotheque')),
  type_lieu      text not null default 'bar_interieur'
    check (type_lieu in ('bar_interieur','bar_avec_terrasse','bar_rooftop','club_interieur','club_avec_terrasse','club_rooftop')),
  accessibilite  text not null default 'centre_ville'
    check (accessibilite in ('centre_ville','hors_centre_ville')),
  region         text not null default 'Île-de-France',
  ville          text,
  adresse        text,
  lat            numeric(9,6),
  lon            numeric(9,6),
  zone_vacances  text check (zone_vacances in ('A','B','C')),
  idx_population numeric(3,2) not null default 1.0,
  pct_etudiants  integer not null default 33,
  pct_jeunes_actifs integer not null default 34,
  pct_adultes    integer not null default 33,
  panier_base    numeric(6,2) not null default 20,
  updated_at     timestamptz default now()
);

alter table club_settings enable row level security;

create policy "club_settings_select" on club_settings
  for select using (club_id in (select id from clubs where owner_id = auth.uid()));

create policy "club_settings_upsert" on club_settings
  for all using (club_id in (select id from clubs where owner_id = auth.uid()));

-- Étude de concurrence (saisie par l'admin ClubAI uniquement)
create table if not exists etudes_concurrence (
  id               uuid primary key default uuid_generate_v4(),
  club_id          uuid references clubs(id) on delete cascade unique,
  directs_petites  integer not null default 0,
  directs_moyennes integer not null default 0,
  directs_grosses  integer not null default 0,
  lointains_petites  integer not null default 0,
  lointains_moyennes integer not null default 0,
  lointains_grosses  integer not null default 0,
  notes            text,
  etudiee_par      uuid references auth.users(id),
  date_etude       date default current_date,
  updated_at       timestamptz default now()
);

alter table etudes_concurrence enable row level security;

-- Le gérant peut lire l'étude de son club
create policy "etudes_concurrence_gerant_read" on etudes_concurrence
  for select using (club_id in (select id from clubs where owner_id = auth.uid()));

-- Mapping événements dérivés → type parent (éditables par gérant ou admin)
create table if not exists mapping_evenements_derives (
  id                         uuid primary key default uuid_generate_v4(),
  club_id                    uuid references clubs(id) on delete cascade,
  nom_evenement_specifique   text not null,
  type_evenement_parent      text not null,
  unique(club_id, nom_evenement_specifique)
);

alter table mapping_evenements_derives enable row level security;

create policy "mapping_select" on mapping_evenements_derives
  for select using (club_id in (select id from clubs where owner_id = auth.uid()));

create policy "mapping_all" on mapping_evenements_derives
  for all using (club_id in (select id from clubs where owner_id = auth.uid()));
