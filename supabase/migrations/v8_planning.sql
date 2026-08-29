-- Migration V8 : page Planning (promotion, prédiction initiale + variation 24h, seuil d'alerte)
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Détail affiché sur la carte planning
alter table soirees
  add column if not exists promotion text;

-- 2. Trace de la prédiction initiale + variation observée depuis
alter table soirees
  add column if not exists prediction_freq_initiale integer,
  add column if not exists prediction_ca_initiale   integer,
  add column if not exists variation_freq_24h        numeric(5,2),
  add column if not exists variation_ca_24h          numeric(5,2);

create or replace function set_prediction_initiale()
returns trigger language plpgsql as $$
begin
  if new.prediction_freq_initiale is null and new.prediction_freq is not null then
    new.prediction_freq_initiale = new.prediction_freq;
  end if;
  if new.prediction_ca_initiale is null and new.prediction_ca is not null then
    new.prediction_ca_initiale = new.prediction_ca;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_prediction_initiale on soirees;
create trigger trigger_prediction_initiale
  before insert on soirees
  for each row execute function set_prediction_initiale();

-- 3. Seuil d'alerte planning, configurable par club
alter table club_settings
  add column if not exists seuil_alerte_variation integer not null default 10;
