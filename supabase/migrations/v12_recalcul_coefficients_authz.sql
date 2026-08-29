-- Migration V12 : combler le trou d'autorisation dans recalcul_coefficients()
--
-- recalcul_coefficients() est SECURITY DEFINER : elle s'exécute avec des
-- privilèges élevés et contourne la RLS sur toutes les tables qu'elle
-- touche (soirees, resultats, djs, coefficients). Elle ne vérifiait jamais
-- que p_club_id appartenait à l'appelant.
--
-- Les fonctions RPC Postgres exposées par Supabase sont directement
-- appelables via l'API REST (POST /rest/v1/rpc/recalcul_coefficients) par
-- n'importe quel client muni de la clé anon (publique) et d'une session
-- valide — pas seulement via nos routes Next.js. Donc même après avoir
-- corrigé /api/coefficients/recalcul pour dériver le club depuis la
-- session (voir commit précédent), n'importe quel utilisateur connecté
-- pouvait contourner cette vérification en appelant la RPC directement
-- avec le club_id d'un autre club, et déclencher un delete + recalcul
-- complet des coefficients de ce club.
--
-- Le calcul lui-même est inchangé — comportement identique pour tout appel
-- légitime (le propriétaire du club, ou le service_role utilisé par
-- scripts/seed.ts, qui doit rester exempté puisqu'il n'a pas de session
-- utilisateur).
CREATE OR REPLACE FUNCTION public.recalcul_coefficients(p_club_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  base_freq numeric;
  base_ca numeric;
  base_panier numeric;
begin
  -- Garde-fou : l'appelant doit être propriétaire du club ciblé, sauf
  -- appel via la clé service_role (scripts serveur de confiance, ex: seed.ts)
  if auth.role() <> 'service_role' and not exists (
    select 1 from clubs where id = p_club_id and owner_id = auth.uid()
  ) then
    raise exception 'Non autorisé pour ce club';
  end if;

  -- Base = moyennes globales du club
  select
    avg(r.freq_reelle),
    avg(r.ca_total),
    avg(r.panier_moyen)
  into base_freq, base_ca, base_panier
  from soirees s join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null;

  if base_freq is null or base_freq = 0 then return; end if;

  -- Delete existing coefficients for this club
  delete from coefficients where club_id = p_club_id;

  -- DJ coefficients
  insert into coefficients (club_id, dimension, valeur, coef_freq, coef_ca, coef_panier,
    impact_pct_freq, impact_pct_ca, impact_pct_panier,
    freq_brute_moy, ca_brut_moy, panier_brut_moy, nb_soirees, updated_at)
  select
    p_club_id, 'dj', d.nom,
    avg(r.freq_reelle) / base_freq,
    avg(r.ca_total) / nullif(base_ca, 0),
    avg(r.panier_moyen) / nullif(base_panier, 0),
    (avg(r.freq_reelle) / base_freq - 1) * 100,
    (avg(r.ca_total) / nullif(base_ca, 0) - 1) * 100,
    (avg(r.panier_moyen) / nullif(base_panier, 0) - 1) * 100,
    avg(r.freq_reelle), avg(r.ca_total), avg(r.panier_moyen),
    count(*), now()
  from soirees s
  join djs d on s.dj_id = d.id
  join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null
  group by d.nom;

  -- Type coefficients
  insert into coefficients (club_id, dimension, valeur, coef_freq, coef_ca, coef_panier,
    impact_pct_freq, impact_pct_ca, impact_pct_panier,
    freq_brute_moy, ca_brut_moy, panier_brut_moy, nb_soirees, updated_at)
  select
    p_club_id, 'type', s.type_evenement,
    avg(r.freq_reelle) / base_freq,
    avg(r.ca_total) / nullif(base_ca, 0),
    avg(r.panier_moyen) / nullif(base_panier, 0),
    (avg(r.freq_reelle) / base_freq - 1) * 100,
    (avg(r.ca_total) / nullif(base_ca, 0) - 1) * 100,
    (avg(r.panier_moyen) / nullif(base_panier, 0) - 1) * 100,
    avg(r.freq_reelle), avg(r.ca_total), avg(r.panier_moyen),
    count(*), now()
  from soirees s
  join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null
  group by s.type_evenement;

  -- Jour coefficients
  insert into coefficients (club_id, dimension, valeur, coef_freq, coef_ca, coef_panier,
    impact_pct_freq, impact_pct_ca, impact_pct_panier,
    freq_brute_moy, ca_brut_moy, panier_brut_moy, nb_soirees, updated_at)
  select
    p_club_id, 'jour', s.jour,
    avg(r.freq_reelle) / base_freq,
    avg(r.ca_total) / nullif(base_ca, 0),
    avg(r.panier_moyen) / nullif(base_panier, 0),
    (avg(r.freq_reelle) / base_freq - 1) * 100,
    (avg(r.ca_total) / nullif(base_ca, 0) - 1) * 100,
    (avg(r.panier_moyen) / nullif(base_panier, 0) - 1) * 100,
    avg(r.freq_reelle), avg(r.ca_total), avg(r.panier_moyen),
    count(*), now()
  from soirees s
  join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null
  group by s.jour;

  -- Meteo coefficients
  insert into coefficients (club_id, dimension, valeur, coef_freq, coef_ca, coef_panier,
    impact_pct_freq, impact_pct_ca, impact_pct_panier,
    freq_brute_moy, ca_brut_moy, panier_brut_moy, nb_soirees, updated_at)
  select
    p_club_id, 'meteo', s.meteo,
    avg(r.freq_reelle) / base_freq,
    avg(r.ca_total) / nullif(base_ca, 0),
    avg(r.panier_moyen) / nullif(base_panier, 0),
    (avg(r.freq_reelle) / base_freq - 1) * 100,
    (avg(r.ca_total) / nullif(base_ca, 0) - 1) * 100,
    (avg(r.panier_moyen) / nullif(base_panier, 0) - 1) * 100,
    avg(r.freq_reelle), avg(r.ca_total), avg(r.panier_moyen),
    count(*), now()
  from soirees s
  join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null and s.meteo is not null
  group by s.meteo;

  -- Concurrence coefficients
  insert into coefficients (club_id, dimension, valeur, coef_freq, coef_ca, coef_panier,
    impact_pct_freq, impact_pct_ca, impact_pct_panier,
    freq_brute_moy, ca_brut_moy, panier_brut_moy, nb_soirees, updated_at)
  select
    p_club_id, 'concurrence', s.concurrence,
    avg(r.freq_reelle) / base_freq,
    avg(r.ca_total) / nullif(base_ca, 0),
    avg(r.panier_moyen) / nullif(base_panier, 0),
    (avg(r.freq_reelle) / base_freq - 1) * 100,
    (avg(r.ca_total) / nullif(base_ca, 0) - 1) * 100,
    (avg(r.panier_moyen) / nullif(base_panier, 0) - 1) * 100,
    avg(r.freq_reelle), avg(r.ca_total), avg(r.panier_moyen),
    count(*), now()
  from soirees s
  join resultats r on s.id = r.soiree_id
  where s.club_id = p_club_id and r.freq_reelle is not null
  group by s.concurrence;

  -- Update brut ranks
  update coefficients c set brut_rank_freq = ranked.rnk
  from (
    select id, rank() over (partition by club_id, dimension order by freq_brute_moy desc) as rnk
    from coefficients where club_id = p_club_id
  ) ranked where c.id = ranked.id;

  update coefficients c set brut_rank_ca = ranked.rnk
  from (
    select id, rank() over (partition by club_id, dimension order by ca_brut_moy desc) as rnk
    from coefficients where club_id = p_club_id
  ) ranked where c.id = ranked.id;

end;
$function$
