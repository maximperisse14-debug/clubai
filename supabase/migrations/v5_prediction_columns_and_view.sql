-- Migration V5 : colonnes prédiction sur soirees + vue soirees_completes

-- 1. Colonnes prédiction figées sur soirees (trace de la prédiction initiale)
alter table soirees
  add column if not exists prediction_freq        integer,
  add column if not exists prediction_ca          integer,
  add column if not exists prediction_score_global numeric(5,2),
  add column if not exists prediction_calculee_le  timestamptz;

-- 2. Vue soirees_completes (jointure soirees + djs + resultats)
-- security_invoker = true → applique les RLS des tables sous-jacentes
create or replace view soirees_completes with (security_invoker = true) as
select
  s.id,
  s.club_id,
  s.dj_id,
  s.date,
  s.jour,
  s.mois,
  s.semaine,
  s.type_evenement,
  s.nom_evenement,
  s.meteo,
  s.temperature_c,
  s.concurrence,
  s.vacances_scolaires,
  s.veille_ferie,
  s.evenement_local,
  s.prix_entree,
  s.budget_com,
  s.staff,
  s.heure_ouverture,
  s.heure_fermeture,
  s.canal_acquisition,
  s.prediction_freq,
  s.prediction_ca,
  s.prediction_score_global,
  s.prediction_calculee_le,
  s.created_at,
  d.nom        as dj_nom,
  d.cout_base  as dj_cout_base,
  r.freq_reelle,
  r.taux_remplissage,
  r.ca_bar,
  r.ca_entrees,
  r.ca_total,
  r.panier_moyen,
  r.charges_variables,
  r.marge_nette,
  r.satisfaction,
  r.nb_avis_google,
  r.nb_stories_ig,
  r.reach_ig
from soirees s
left join djs d on d.id = s.dj_id
left join resultats r on r.soiree_id = s.id;
