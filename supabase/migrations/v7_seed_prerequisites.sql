-- Migration V7 : Pré-requis seed — colonnes manquantes + DJs pilote
-- À exécuter dans l'éditeur SQL Supabase AVANT de lancer pnpm seed

-- ─── 1. Colonnes potentiellement manquantes sur soirees ─────────────────────

alter table soirees
  add column if not exists semaine          integer,
  add column if not exists evenement_local  boolean default false,
  add column if not exists heure_ouverture  text,
  add column if not exists heure_fermeture  text,
  add column if not exists canal_acquisition text;

-- ─── 2. Colonnes potentiellement manquantes sur resultats ───────────────────

alter table resultats
  add column if not exists nb_stories_ig  integer default 0,
  add column if not exists reach_ig       integer default 0;

-- ─── 3. DJs pilote pour le club 68da695d-71a8-4689-b59c-9ae127da9999 ────────
-- Colonnes minimales garanties : id, club_id, nom, cout_base
-- Si ta table djs a d'autres colonnes NOT NULL, ajoute-les ici.

do $$
declare
  cid     uuid := '68da695d-71a8-4689-b59c-9ae127da9999';
  noms    text[] := array['DJ Martin','DJ Sarah','DJ Clara','DJ Emma','DJ Alex','DJ Lucas','DJ Noé'];
  couts   int[]  := array[400, 350, 380, 300, 280, 260, 290];
  i       int;
begin
  for i in 1..array_length(noms, 1) loop
    if not exists (select 1 from public.djs where club_id = cid and nom = noms[i]) then
      insert into public.djs (id, club_id, nom, cout_base)
      values (gen_random_uuid(), cid, noms[i], couts[i]);
    end if;
  end loop;
end;
$$;

-- Vérification : tu dois voir 7 DJs
select nom, cout_base from djs where club_id = '68da695d-71a8-4689-b59c-9ae127da9999' order by nom;
