-- In-app match notifications for Riverside Badminton Club.
-- Run once in Supabase SQL Editor.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('match_assigned', 'match_result')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_unread_user_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

drop policy if exists "users_read_own_notifications" on public.notifications;
create policy "users_read_own_notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users_mark_own_notifications_read" on public.notifications;
create policy "users_mark_own_notifications_read"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.notify_match_assignment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select
    profile.id,
    'match_assigned',
    'New match assignment',
    'You have been added to a match. Open Matches to view the details.',
    jsonb_build_object('match_id', new.match_id, 'session_id', m.session_id)
  from public.profiles as profile
  join public.matches as m on m.id = new.match_id
  where profile.id = new.player_id
    and coalesce(profile.notifications_enabled, true);

  return new;
end;
$function$;

revoke execute on function public.notify_match_assignment() from public, anon, authenticated;

drop trigger if exists trg_notify_match_assignment on public.match_players;
create trigger trg_notify_match_assignment
  after insert on public.match_players
  for each row
  execute function public.notify_match_assignment();

create or replace function public.notify_match_result()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if new.status is distinct from 'completed'
     or old.status is not distinct from 'completed' then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  select
    profile.id,
    'match_result',
    'Match result is ready',
    format('Final score: %s – %s.', coalesce(new.team_a_score::text, '—'), coalesce(new.team_b_score::text, '—')),
    jsonb_build_object('match_id', new.id, 'session_id', new.session_id)
  from public.match_players as participant
  join public.profiles as profile on profile.id = participant.player_id
  where participant.match_id = new.id
    and coalesce(profile.notifications_enabled, true);

  return new;
end;
$function$;

revoke execute on function public.notify_match_result() from public, anon, authenticated;

drop trigger if exists trg_notify_match_result on public.matches;
create trigger trg_notify_match_result
  after update of status on public.matches
  for each row
  execute function public.notify_match_result();

-- Make inserts and read-state changes appear in the app's live unread badge.
do $block$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_catalog.pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end;
$block$;
