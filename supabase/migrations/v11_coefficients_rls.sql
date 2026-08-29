-- Migration V11 : verrouiller la RLS sur `coefficients`
--
-- Cette table est utilisée partout (predicteur/v2, assistant, classements)
-- mais n'a jamais été versionnée : elle a été créée directement dans le
-- dashboard Supabase, donc son schéma exact et sa RLS réelle sont inconnus
-- depuis ce repo. Tout est écrit de façon idempotente : si la table/policy
-- existe déjà correctement, ce script ne change rien ; si la RLS manquait
-- ou était mal scopée, il la corrige.
--
-- `create table if not exists` sert uniquement de filet de sécurité pour un
-- environnement neuf — si la table existe déjà (cas de la prod), cette
-- clause ne fait rien et ne touche à aucune colonne existante.
create table if not exists coefficients (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references clubs(id) on delete cascade,
  dimension        text not null,
  valeur           text not null,
  impact_pct_freq  numeric,
  impact_pct_ca    numeric,
  freq_brute_moy   numeric,
  ca_brut_moy      numeric,
  nb_soirees       integer,
  updated_at       timestamptz default now(),
  unique (club_id, dimension, valeur)
);

alter table coefficients enable row level security;

-- Lecture seule pour le propriétaire du club — les écritures ne passent que
-- par la fonction recalcul_coefficients() (SECURITY DEFINER présumé, à
-- vérifier/verser dans une future migration), jamais directement par l'app.
drop policy if exists "coefficients_select" on coefficients;
create policy "coefficients_select" on coefficients
  for select using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );
