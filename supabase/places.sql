-- SpotLa : lieux proposés par l'app, avec likes, notes et avis.
-- À exécuter une fois dans Supabase > SQL Editor (après schema.sql). Réexécutable sans risque.

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Lieux choisis par l'équipe SpotLa (mis en avant sur l'accueil).
create table if not exists public.places (
  id text primary key,                       -- ex. « osm:node/6005804263 » ou un identifiant libre
  name text not null,
  kind text not null default 'Bar',          -- Boîte de nuit, Bar, Pub, Salle de concert…
  address text,
  area text,
  lat double precision not null,
  lng double precision not null,
  photo_url text,
  description text,
  category text not null default 'bar',     -- club, bar, soiree, fetes, gastro
  when_text text,                            -- ex. « Tous les jeudis », « 13 nov. – 3 janv. »
  ends_on date,                              -- après cette date, la carte disparaît
  featured boolean not null default true,
  created_at timestamptz not null default now()
);

-- Likes et avis : valables aussi pour les lieux trouvés sur la carte (id « osm:… »), d'où le texte sans clé étrangère.
create table if not exists public.place_likes (
  place_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);
create table if not exists public.place_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 600),
  created_at timestamptz not null default now(),
  unique (place_id, user_id)                 -- un avis par personne et par lieu (modifiable)
);
alter table public.places add column if not exists category text not null default 'bar';
alter table public.places add column if not exists when_text text;
alter table public.places add column if not exists ends_on date;
alter table public.places add column if not exists video_url text;  -- courte vidéo en boucle sur la carte du lieu
create index if not exists place_reviews_place on public.place_reviews (place_id, created_at desc);

-- Totaux par lieu : nombre de likes, nombre d'avis, note moyenne.
create or replace view public.place_stats with (security_invoker = true) as
select p.place_id,
  coalesce(l.likes, 0) as likes,
  coalesce(r.reviews, 0) as reviews,
  r.rating
from (select place_id from public.place_likes union select place_id from public.place_reviews) p
left join (select place_id, count(*)::int as likes from public.place_likes group by place_id) l using (place_id)
left join (select place_id, count(*)::int as reviews, round(avg(rating)::numeric, 1)::float as rating from public.place_reviews group by place_id) r using (place_id);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

alter table public.places enable row level security;
alter table public.place_likes enable row level security;
alter table public.place_reviews enable row level security;

drop policy if exists "lieux lisibles" on public.places;
drop policy if exists "admins gèrent les lieux" on public.places;
create policy "lieux lisibles" on public.places for select using (true);
create policy "admins gèrent les lieux" on public.places for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "likes de lieux lisibles" on public.place_likes;
drop policy if exists "j'aime un lieu" on public.place_likes;
drop policy if exists "je n'aime plus un lieu" on public.place_likes;
create policy "likes de lieux lisibles" on public.place_likes for select using (true);
create policy "j'aime un lieu" on public.place_likes for insert to authenticated with check (user_id = auth.uid());
create policy "je n'aime plus un lieu" on public.place_likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "avis lisibles" on public.place_reviews;
drop policy if exists "je donne mon avis" on public.place_reviews;
drop policy if exists "je modifie mon avis" on public.place_reviews;
drop policy if exists "je supprime mon avis" on public.place_reviews;
create policy "avis lisibles" on public.place_reviews for select using (true);
create policy "je donne mon avis" on public.place_reviews for insert to authenticated with check (user_id = auth.uid());
create policy "je modifie mon avis" on public.place_reviews for update to authenticated using (user_id = auth.uid());
create policy "je supprime mon avis" on public.place_reviews for delete to authenticated using (user_id = auth.uid() or public.is_admin());

do $$ begin
  alter publication supabase_realtime add table public.places, public.place_likes, public.place_reviews;
exception when duplicate_object then null; end $$;

-- La sélection de départ (top clubs, bars, fêtes, gourmand) est intégrée à l'app (src/data/catalog.ts).
-- Pour ajouter un lieu ou mettre une photo sur un lieu existant, ajoute une ligne ici (même id = remplace) :
-- insert into public.places (id, name, kind, category, area, address, lat, lng, photo_url, when_text, ends_on)
-- values ('mon-lieu', 'Nom', 'Bar', 'bar', 'Plateau', '123 rue X', 45.52, -73.58, 'https://…/photo.jpg', null, null);

-- Pour te donner les droits d'admin (gérer les lieux depuis l'app plus tard), remplace TON_PSEUDO :
-- update public.profiles set is_admin = true where handle = 'TON_PSEUDO';
