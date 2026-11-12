-- SpotLa : préparation de la bêta (2026-11-12)
-- Mesure d'audience, suivi des bugs, modération et tableau de bord admin.
-- À exécuter une fois dans Supabase → SQL Editor (après les autres fichiers). Sans danger si relancé.

-- 0. Droits d'admin et bannissement — et FAILLE CORRIGÉE : un membre ne peut plus se donner lui-même les droits d'admin.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists banned boolean not null default false;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;
create or replace function public.is_banned() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select banned from public.profiles where id = auth.uid()), false) $$;

-- is_admin ne change que depuis le SQL Editor ; banned seulement par un admin.
create or replace function public.protect_roles() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_admin := false; new.banned := false;
    else
      new.is_admin := old.is_admin;
      if not public.is_admin() then new.banned := old.banned; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_roles on public.profiles;
create trigger profiles_protect_roles before insert or update on public.profiles
  for each row execute function public.protect_roles();

-- Un admin peut modifier n'importe quel profil (pour bannir) ; le trigger ci-dessus protège le reste.
drop policy if exists "admin modifie les profils" on public.profiles;
create policy "admin modifie les profils" on public.profiles for update to authenticated using (public.is_admin());

-- Un membre banni ne peut plus rien publier (règles « restrictives » : elles s'ajoutent aux autres).
do $$
declare t text;
begin
  foreach t in array array['events', 'posts', 'comments', 'stories', 'attendances', 'event_messages'] loop
    continue when to_regclass('public.' || t) is null;
    execute format('drop policy if exists "pas de publication si banni" on public.%I', t);
    execute format('create policy "pas de publication si banni" on public.%I as restrictive for insert to authenticated with check (not public.is_banned())', t);
  end loop;
end $$;

-- Les admins peuvent retirer n'importe quel contenu.
drop policy if exists "admin retire une sortie" on public.events;
create policy "admin retire une sortie" on public.events for update to authenticated using (public.is_admin());
drop policy if exists "admin supprime une sortie" on public.events;
create policy "admin supprime une sortie" on public.events for delete to authenticated using (public.is_admin());
drop policy if exists "admin voit les sorties masquées" on public.events;
create policy "admin voit les sorties masquées" on public.events for select to authenticated using (public.is_admin());
drop policy if exists "admin supprime un post" on public.posts;
create policy "admin supprime un post" on public.posts for delete to authenticated using (public.is_admin());
drop policy if exists "admin supprime un commentaire" on public.comments;
create policy "admin supprime un commentaire" on public.comments for delete to authenticated using (public.is_admin());
drop policy if exists "admin supprime une story" on public.stories;
create policy "admin supprime une story" on public.stories for delete to authenticated using (public.is_admin());
do $$ begin
  if to_regclass('public.event_messages') is not null then
    drop policy if exists "admin lit les messages" on public.event_messages;
    create policy "admin lit les messages" on public.event_messages for select to authenticated using (public.is_admin());
    drop policy if exists "admin supprime un message" on public.event_messages;
    create policy "admin supprime un message" on public.event_messages for delete to authenticated using (public.is_admin());
  end if;
end $$;
drop policy if exists "report admin delete" on public.content_reports;
create policy "report admin delete" on public.content_reports for delete to authenticated using (public.is_admin());

-- 1. Mesure d'audience, gardée dans ta base (pas de service externe, pas d'adresse IP).
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  device text not null check (char_length(device) between 8 and 40),  -- identifiant au hasard, propre à l'appareil
  name text not null check (char_length(name) between 2 and 40),
  props jsonb not null default '{}' check (pg_column_size(props) < 2000),
  path text check (char_length(path) < 200)
);
create index if not exists analytics_events_at on public.analytics_events (at);
create index if not exists analytics_events_device on public.analytics_events (device, at);
alter table public.analytics_events enable row level security;
drop policy if exists "envoi des mesures" on public.analytics_events;
create policy "envoi des mesures" on public.analytics_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
drop policy if exists "admin lit les mesures" on public.analytics_events;
create policy "admin lit les mesures" on public.analytics_events for select to authenticated using (public.is_admin());

-- 2. Bugs rencontrés dans l'app (message + où), pour corriger avant qu'on nous les signale.
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  device text check (char_length(device) < 41),
  message text not null check (char_length(message) between 1 and 500),
  stack text check (char_length(stack) < 4000),
  path text check (char_length(path) < 200),
  agent text check (char_length(agent) < 300),
  version text check (char_length(version) < 40)
);
create index if not exists client_errors_at on public.client_errors (at);
alter table public.client_errors enable row level security;
drop policy if exists "envoi des bugs" on public.client_errors;
create policy "envoi des bugs" on public.client_errors for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
drop policy if exists "admin lit les bugs" on public.client_errors;
create policy "admin lit les bugs" on public.client_errors for select to authenticated using (public.is_admin());
drop policy if exists "admin efface les bugs" on public.client_errors;
create policy "admin efface les bugs" on public.client_errors for delete to authenticated using (public.is_admin());

-- 3. Chiffres clés du tableau de bord (réservé aux admins).
create or replace function public.admin_stats(days int default 7) returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.is_admin() then raise exception 'réservé aux admins'; end if;
  with
  win as (select * from analytics_events where at > now() - make_interval(days => days)),
  firsts as (select device, min(at) as first_at from analytics_events where at > now() - interval '120 days' group by device),
  ret7 as (
    select count(*) filter (where exists (select 1 from analytics_events a where a.device = f.device and a.at >= f.first_at + interval '7 days')) as back,
           count(*) as total
    from firsts f where f.first_at < now() - interval '7 days'),
  ret30 as (
    select count(*) filter (where exists (select 1 from analytics_events a where a.device = f.device and a.at >= f.first_at + interval '30 days')) as back,
           count(*) as total
    from firsts f where f.first_at < now() - interval '30 days'),
  daily as (
    select to_char(date_trunc('day', at at time zone 'America/Montreal'), 'YYYY-MM-DD') as day, count(distinct device) as devices
    from win where name = 'open' group by 1 order by 1)
  select json_build_object(
    'devices', (select count(distinct device) from win),
    'opens', (select count(*) from win where name = 'open'),
    'signups', (select count(*) from profiles where created_at > now() - make_interval(days => days)),
    'members', (select count(*) from profiles),
    'going_devices', (select count(distinct device) from win where name = 'going'),
    'goings', (select count(*) from win where name = 'going'),
    'shares', (select count(*) from win where name = 'share_story'),
    'errors', (select count(*) from client_errors where at > now() - make_interval(days => days)),
    'open_reports', (select count(*) from content_reports where not handled),
    'events_tonight', (select count(*) from events where not hidden and (starts_at at time zone 'America/Montreal')::date = (now() at time zone 'America/Montreal')::date),
    'ret7', (select json_build_object('back', back, 'total', total) from ret7),
    'ret30', (select json_build_object('back', back, 'total', total) from ret30),
    'daily', (select coalesce(json_agg(json_build_object('day', day, 'devices', devices)), '[]') from daily),
    'top', (select coalesce(json_agg(t), '[]') from (select name, count(*) as n from win group by name order by n desc limit 12) t)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;

-- 4. Pour te donner les droits d'admin, remplace TON_PSEUDO par ton nom d'utilisateur SpotLa (sans @) :
-- update public.profiles set is_admin = true where handle = 'TON_PSEUDO';
