-- SpotLa · Recentrage (audit) : « J'y vais seul·e », discussion temporaire, jauge « Ça bouge ? »,
-- navigation sans compte et adresse visible 2 h avant pour les événements privés.
-- À exécuter une fois dans Supabase > SQL Editor. Le script peut être relancé sans danger.

-- ---------- Groupes « J'y vais seul·e » ----------
create table if not exists public.solo_joins (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------- Discussion du groupe (ouverte jusqu'à 12 h après la fin) ----------
create table if not exists public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists event_messages_event_idx on public.event_messages (event_id, created_at);

-- ---------- « Ça bouge ? » : un avis par personne et par événement ----------
create table if not exists public.vibe_checks (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  level smallint not null check (level between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Membre du groupe (ou hôte) d'un événement dont la discussion est encore ouverte ?
create or replace function public.in_event_chat(p_event uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e where e.id = p_event and e.ends_at + interval '12 hours' > now() and (
      e.host_id = auth.uid()
      or exists (select 1 from solo_joins s where s.event_id = e.id and s.user_id = auth.uid())
    )
  )
$$;

alter table public.solo_joins enable row level security;
alter table public.event_messages enable row level security;
alter table public.vibe_checks enable row level security;

drop policy if exists "groupes lisibles" on public.solo_joins;
drop policy if exists "je rejoins un groupe" on public.solo_joins;
drop policy if exists "je quitte un groupe" on public.solo_joins;
create policy "groupes lisibles" on public.solo_joins for select to authenticated using (true);
create policy "je rejoins un groupe" on public.solo_joins for insert to authenticated with check (user_id = auth.uid());
create policy "je quitte un groupe" on public.solo_joins for delete to authenticated using (user_id = auth.uid());

drop policy if exists "messages du groupe" on public.event_messages;
drop policy if exists "j'écris au groupe" on public.event_messages;
drop policy if exists "je supprime mon message" on public.event_messages;
create policy "messages du groupe" on public.event_messages for select to authenticated using (public.in_event_chat(event_id));
create policy "j'écris au groupe" on public.event_messages for insert to authenticated with check (user_id = auth.uid() and public.in_event_chat(event_id));
create policy "je supprime mon message" on public.event_messages for delete to authenticated using (user_id = auth.uid());

drop policy if exists "ambiance lisible" on public.vibe_checks;
drop policy if exists "je donne l'ambiance" on public.vibe_checks;
drop policy if exists "je change l'ambiance" on public.vibe_checks;
create policy "ambiance lisible" on public.vibe_checks for select using (true);
create policy "je donne l'ambiance" on public.vibe_checks for insert to authenticated with check (user_id = auth.uid());
create policy "je change l'ambiance" on public.vibe_checks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Adresse exacte : pour un événement privé, seulement 2 h avant le début ----------
create or replace function public.can_see_address(p_event uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e where e.id = p_event and (
      e.visibility in ('open', 'limited')
      or e.host_id = auth.uid()
      or (
        e.starts_at - interval '2 hours' <= now()
        and (
          exists (select 1 from attendances a where a.event_id = e.id and a.user_id = auth.uid() and a.status = 'accepted')
          or (e.visibility = 'circle' and exists (select 1 from follows f where f.follower = auth.uid() and f.followee = e.host_id))
        )
      )
    )
  )
$$;
grant execute on function public.can_see_address(uuid) to anon, authenticated;
grant execute on function public.in_event_chat(uuid) to authenticated;

-- ---------- Navigation sans compte : lecture seule pour les visiteurs ----------
drop policy if exists "visiteurs : profils" on public.profiles;
drop policy if exists "visiteurs : abonnements" on public.follows;
drop policy if exists "visiteurs : événements" on public.events;
drop policy if exists "visiteurs : adresses" on public.event_addresses;
drop policy if exists "visiteurs : présences" on public.attendances;
drop policy if exists "visiteurs : stories" on public.stories;
drop policy if exists "visiteurs : posts" on public.posts;
drop policy if exists "visiteurs : likes" on public.post_likes;
drop policy if exists "visiteurs : commentaires" on public.comments;
create policy "visiteurs : profils" on public.profiles for select to anon using (true);
create policy "visiteurs : abonnements" on public.follows for select to anon using (true);
create policy "visiteurs : événements" on public.events for select to anon using (not hidden);
create policy "visiteurs : adresses" on public.event_addresses for select to anon using (public.can_see_address(event_id));
create policy "visiteurs : présences" on public.attendances for select to anon using (true);
create policy "visiteurs : stories" on public.stories for select to anon using (expires_at > now());
create policy "visiteurs : posts" on public.posts for select to anon using (true);
create policy "visiteurs : likes" on public.post_likes for select to anon using (true);
create policy "visiteurs : commentaires" on public.comments for select to anon using (true);

-- ---------- Temps réel ----------
do $$ begin
  begin alter publication supabase_realtime add table public.solo_joins; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.event_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.vibe_checks; exception when duplicate_object then null; end;
end $$;
