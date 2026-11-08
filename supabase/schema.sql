-- SpotLa : schéma Postgres pour Supabase (étape suivante du MVP).
-- Les tables reprennent src/data/types.ts. À coller dans l'éditeur SQL de Supabase.

create type account_kind as enum ('perso', 'business');
create type visibility as enum ('open', 'limited', 'request', 'circle');
create type attendance_status as enum ('going', 'requested', 'accepted', 'declined');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  handle text unique not null,
  kind account_kind not null default 'perso',
  verified boolean not null default false,       -- business : passé à true après contrôle SIRET
  siret text,                                      -- jamais exposé publiquement
  bio text default '',
  city text default 'Paris',
  venue_address text,
  color text default '#FF4F9A',
  avatar_url text,
  created_at timestamptz default now()
);

create table follows (
  follower uuid references profiles on delete cascade,
  followee uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  primary key (follower, followee)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  vibe text, tags text[] default '{}',
  starts_at timestamptz not null, ends_at timestamptz not null,
  venue text not null, area text, address text not null,  -- adresse lue via la vue events_public
  lat double precision not null, lng double precision not null,
  price numeric(8,2) not null default 0, ticket_url text,
  visibility visibility not null default 'open', capacity int,
  description text default '', colors text[] default '{}',
  boosted_until timestamptz,
  views int default 0, shares int default 0,
  hidden boolean not null default false,          -- masqué après 3 signalements, en attente de modération
  created_at timestamptz default now()
);
create index events_time_idx on events (starts_at);

create table attendances (
  event_id uuid references events on delete cascade,
  user_id uuid references profiles on delete cascade,
  status attendance_status not null,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

create table stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  event_id uuid references events on delete set null,
  caption text default '',
  video_path text not null,                        -- Supabase Storage, bucket "stories"
  duration_s numeric(4,1) not null check (duration_s <= 30.5),
  created_at timestamptz default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create table story_views (story_id uuid references stories on delete cascade, user_id uuid references profiles on delete cascade, primary key (story_id, user_id));

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  event_id uuid references events on delete set null,
  body text default '', image_path text,
  created_at timestamptz default now()
);
create table post_likes (post_id uuid references posts on delete cascade, user_id uuid references profiles on delete cascade, primary key (post_id, user_id));
create table comments (id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, author_id uuid references profiles on delete cascade, body text not null, created_at timestamptz default now());

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid references profiles on delete cascade,
  event_id uuid references events on delete cascade,
  reason text, created_at timestamptz default now(),
  unique (reporter, event_id)
);

-- Masquage automatique à 3 signalements
create function hide_reported() returns trigger language plpgsql as $$
begin
  update events set hidden = true where id = new.event_id and (select count(*) from reports where event_id = new.event_id) >= 3;
  return new;
end $$;
create trigger reports_hide after insert on reports for each row execute function hide_reported();

-- Vue publique : l'adresse exacte n'est donnée qu'aux personnes autorisées
create view events_public with (security_invoker = true) as
select e.*,
  case when e.visibility in ('open','limited') or e.host_id = auth.uid()
         or exists (select 1 from attendances a where a.event_id = e.id and a.user_id = auth.uid() and a.status = 'accepted')
         or (e.visibility = 'circle' and exists (select 1 from follows f where f.follower = auth.uid() and f.followee = e.host_id))
       then e.address else null end as visible_address
from events e where not e.hidden;

-- Sécurité par ligne (à compléter pour chaque table)
alter table profiles enable row level security;
alter table events enable row level security;
alter table attendances enable row level security;
alter table stories enable row level security;
alter table posts enable row level security;
create policy "profils lisibles" on profiles for select using (true);
create policy "je modifie mon profil" on profiles for update using (id = auth.uid());
create policy "événements visibles" on events for select using (not hidden or host_id = auth.uid());
create policy "je crée mes événements" on events for insert with check (host_id = auth.uid());
create policy "je modifie mes événements" on events for update using (host_id = auth.uid());
create policy "stories actives" on stories for select using (expires_at > now());
create policy "je publie mes stories" on stories for insert with check (author_id = auth.uid());
create policy "posts lisibles" on posts for select using (true);
create policy "je publie mes posts" on posts for insert with check (author_id = auth.uid());
