-- Migration V13 : staff bar / sécurité par soirée (modal planning, mode édition)

alter table soirees
  add column if not exists staff_bar integer default null,
  add column if not exists staff_securite integer default null;
