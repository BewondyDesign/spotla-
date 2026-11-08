-- SpotLa : schéma Postgres pour Supabase.
-- À coller en une fois dans Supabase → SQL Editor → New query → Run.
-- Il crée les tables, la sécurité par ligne (RLS), le stockage des médias et le temps réel.

create extension if not exists pgcrypto;

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  handle text unique not null,
  kind text not null default 'perso' check (kind in ('perso', 'business')),
  verified boolean not null default false,     -- seul l'équipe SpotLa (service_role) peut le passer à true
  bio text not null default '',
  city text not null default 'Paris',
  venue_address text,
  color text not null default '#FF4F9A',
  vibes text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Empêche un utilisateur de se déclarer « vérifié » lui-même.
create function public.protect_verified() returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.verified := case when tg_op = 'UPDATE' then old.verified else false end;
  end if;
  return new;
end $$;
create trigger profiles_protect_verified before insert or update on public.profiles
  for each row execute function public.protect_verified();

create table public.follows (
  follower uuid not null references public.profiles on delete cascade,
  followee uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);

-- ---------- Événements ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 3 and 80),
  vibe text not null default '',
  tags text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text not null,
  area text not null default '',
  lat double precision not null,
  lng double precision not null,
  price numeric(8,2) not null default 0 check (price >= 0),
  ticket_url text,
  visibility text not null default 'open' check (visibility in ('open', 'limited', 'request', 'circle')),
  capacity int check (capacity is null or capacity > 0),
  description text not null default '',
  colors text[] not null default '{}',
  boosted boolean not null default false,       -- MVP : boost simulé, à relier au paiement plus tard
  views int not null default 0,
  shares int not null default 0,
  hidden boolean not null default false,        -- masqué après 3 signalements, en attente de modération
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at);

-- L'adresse exacte est dans une table à part : la RLS décide qui peut la lire.
create table public.event_addresses (
  event_id uuid primary key references public.events on delete cascade,
  address text not null
);

create table public.attendances (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  status text not null check (status in ('going', 'requested', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.reports (
  reporter uuid not null references public.profiles on delete cascade default auth.uid(),
  event_id uuid not null references public.events on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (reporter, event_id)
);

-- ---------- Stories & murs ----------
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade default auth.uid(),
  event_id uuid references public.events on delete set null,
  caption text not null default '',
  video_url text not null,
  duration_s numeric(4,1) not null check (duration_s > 0 and duration_s <= 30.5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create table public.story_views (
  story_id uuid not null references public.stories on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  primary key (story_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade default auth.uid(),
  event_id uuid references public.events on delete set null,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ---------- Fonctions ----------
-- Masquage automatique à 3 signalements.
create function public.hide_reported() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update events set hidden = true
  where id = new.event_id and (select count(*) from reports where event_id = new.event_id) >= 3;
  return new;
end $$;
create trigger reports_hide after insert on public.reports for each row execute function public.hide_reported();

-- Compteurs de vues et de partages (pour les statistiques business).
create function public.bump_event(p_event uuid, p_field text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_field = 'views' then update events set views = views + 1 where id = p_event;
  elsif p_field = 'shares' then update events set shares = shares + 1 where id = p_event;
  end if;
end $$;
grant execute on function public.bump_event(uuid, text) to authenticated;

-- Qui a le droit de voir l'adresse exacte d'un événement ?
create function public.can_see_address(p_event uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e where e.id = p_event and (
      e.visibility in ('open', 'limited')
      or e.host_id = auth.uid()
      or exists (select 1 from attendances a where a.event_id = e.id and a.user_id = auth.uid() and a.status = 'accepted')
      or (e.visibility = 'circle' and exists (select 1 from follows f where f.follower = auth.uid() and f.followee = e.host_id))
    )
  )
$$;

create function public.is_host(p_event uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from events where id = p_event and host_id = auth.uid())
$$;

-- ---------- Sécurité par ligne ----------
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.events enable row level security;
alter table public.event_addresses enable row level security;
alter table public.attendances enable row level security;
alter table public.reports enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

create policy "profils lisibles" on public.profiles for select to authenticated using (true);
create policy "je crée mon profil" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "je modifie mon profil" on public.profiles for update to authenticated using (id = auth.uid());

create policy "abonnements lisibles" on public.follows for select to authenticated using (true);
create policy "je suis quelqu'un" on public.follows for insert to authenticated with check (follower = auth.uid());
create policy "je me désabonne" on public.follows for delete to authenticated using (follower = auth.uid());

create policy "événements visibles" on public.events for select to authenticated using (not hidden or host_id = auth.uid());
create policy "je publie un événement" on public.events for insert to authenticated with check (host_id = auth.uid());
create policy "je modifie mon événement" on public.events for update to authenticated using (host_id = auth.uid());
create policy "je supprime mon événement" on public.events for delete to authenticated using (host_id = auth.uid());

create policy "adresse si autorisé" on public.event_addresses for select to authenticated using (public.can_see_address(event_id));
create policy "l'hôte écrit l'adresse" on public.event_addresses for insert to authenticated with check (public.is_host(event_id));
create policy "l'hôte modifie l'adresse" on public.event_addresses for update to authenticated using (public.is_host(event_id));

create policy "présences lisibles" on public.attendances for select to authenticated using (true);
create policy "je viens ou je demande" on public.attendances for insert to authenticated with check (
  user_id = auth.uid() and (
    status = 'requested'
    or (status = 'going' and exists (select 1 from public.events e where e.id = event_id and (
      e.visibility in ('open', 'limited')
      or (e.visibility = 'circle' and exists (select 1 from public.follows f where f.follower = auth.uid() and f.followee = e.host_id))
    )))
  )
);
create policy "l'hôte répond aux demandes" on public.attendances for update to authenticated using (public.is_host(event_id));
create policy "j'annule ma venue" on public.attendances for delete to authenticated using (user_id = auth.uid() or public.is_host(event_id));

create policy "je signale" on public.reports for insert to authenticated with check (reporter = auth.uid());

create policy "stories actives" on public.stories for select to authenticated using (expires_at > now() or author_id = auth.uid());
create policy "je publie une story" on public.stories for insert to authenticated with check (author_id = auth.uid());
create policy "je supprime ma story" on public.stories for delete to authenticated using (author_id = auth.uid());
create policy "vues lisibles" on public.story_views for select to authenticated using (true);
create policy "je vois une story" on public.story_views for insert to authenticated with check (user_id = auth.uid());

create policy "posts lisibles" on public.posts for select to authenticated using (true);
create policy "je publie un post" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "je supprime mon post" on public.posts for delete to authenticated using (author_id = auth.uid());
create policy "likes lisibles" on public.post_likes for select to authenticated using (true);
create policy "j'aime" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "je n'aime plus" on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy "commentaires lisibles" on public.comments for select to authenticated using (true);
create policy "je commente" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "je supprime mon commentaire" on public.comments for delete to authenticated using (author_id = auth.uid());

-- ---------- Stockage des vidéos et photos ----------
-- Bucket public « media » : chaque utilisateur écrit seulement dans son dossier <son id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "médias : j'envoie dans mon dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "médias : je supprime les miens" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Temps réel ----------
alter publication supabase_realtime add table public.events, public.attendances, public.stories, public.posts, public.post_likes, public.comments, public.follows, public.profiles;
