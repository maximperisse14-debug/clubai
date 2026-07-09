-- Migration V6 : correctifs RLS pour soirees, resultats, djs
-- À exécuter dans l'éditeur SQL Supabase si les données n'apparaissent pas

-- ================================================================
-- soirees
-- ================================================================
alter table soirees enable row level security;

drop policy if exists "soirees_select" on soirees;
create policy "soirees_select" on soirees
  for select using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

drop policy if exists "soirees_insert" on soirees;
create policy "soirees_insert" on soirees
  for insert with check (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

drop policy if exists "soirees_update" on soirees;
create policy "soirees_update" on soirees
  for update using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

drop policy if exists "soirees_delete" on soirees;
create policy "soirees_delete" on soirees
  for delete using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

-- ================================================================
-- djs
-- ================================================================
alter table djs enable row level security;

drop policy if exists "djs_select" on djs;
create policy "djs_select" on djs
  for select using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

drop policy if exists "djs_all" on djs;
create policy "djs_all" on djs
  for all using (
    club_id in (select id from clubs where owner_id = auth.uid())
  );

-- ================================================================
-- resultats (accès via soiree_id → soirees → clubs)
-- ================================================================
alter table resultats enable row level security;

drop policy if exists "resultats_select" on resultats;
create policy "resultats_select" on resultats
  for select using (
    soiree_id in (
      select s.id from soirees s
      join clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );

drop policy if exists "resultats_all" on resultats;
create policy "resultats_all" on resultats
  for all using (
    soiree_id in (
      select s.id from soirees s
      join clubs c on c.id = s.club_id
      where c.owner_id = auth.uid()
    )
  );

-- ================================================================
-- clubs : policy select (si pas déjà existante)
-- ================================================================
drop policy if exists "clubs_select" on clubs;
create policy "clubs_select" on clubs
  for select using (owner_id = auth.uid());
