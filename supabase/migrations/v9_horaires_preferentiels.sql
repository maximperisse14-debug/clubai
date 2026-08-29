-- Migration V9 : horaires préférentiels du club (page Réglages + Planifier)
-- À exécuter dans l'éditeur SQL Supabase

alter table club_settings
  add column if not exists horaires_preferentiels jsonb not null default '[]';
