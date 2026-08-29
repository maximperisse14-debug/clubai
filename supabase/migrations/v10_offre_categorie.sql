-- Migration V10 : catégorisation automatique des offres/promotions

-- 1. Catégorie normalisée de l'offre (générée automatiquement)
alter table soirees
  add column if not exists offre_categorie text;

-- 2. Trigger : catégoriser automatiquement l'offre au save
create or replace function categoriser_offre()
returns trigger language plpgsql as $$
declare
  p text;
begin
  p := lower(coalesce(NEW.promotion, ''));
  if p = '' or p is null then
    NEW.offre_categorie := null;
  elsif p like '%gratuit%fille%' or p like '%ladies%' or p like '%girl%' then
    NEW.offre_categorie := 'Gratuit pour les filles';
  elsif p like '%gratuit%avant%' or p like '%free before%' then
    NEW.offre_categorie := 'Gratuit avant heure limite';
  elsif p like '%open bar%' then
    NEW.offre_categorie := 'Open bar';
  elsif p like '%shot%offert%' or p like '%shot%gratuit%' then
    NEW.offre_categorie := 'Shot offert';
  elsif p like '%-50%' or p like '%moitié%' or p like '%étudiant%' then
    NEW.offre_categorie := 'Réduction étudiants';
  elsif p like '%vip%' then
    NEW.offre_categorie := 'Accès VIP';
  elsif p like '%before%' or p like '%prévente%' then
    NEW.offre_categorie := 'Prévente / Before';
  else
    NEW.offre_categorie := 'Autre offre';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_categoriser_offre on soirees;
create trigger trigger_categoriser_offre
  before insert or update on soirees
  for each row execute function categoriser_offre();

-- 3. Rejouer le trigger sur les soirées existantes qui ont déjà une promotion
update soirees set promotion = promotion where promotion is not null;

-- 4. Étendre la vue soirees_completes : exposer promotion + offre_categorie
--    (drop + create plutôt que "create or replace" : l'ordre réel des colonnes
--    en base a dérivé du fichier v5 versionné, et "or replace" exige un ordre
--    identique pour les colonnes existantes — voir erreur 42P16)
drop view if exists soirees_completes;

create view soirees_completes with (security_invoker = true) as
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
  s.promotion,
  s.offre_categorie,
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
