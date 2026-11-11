-- SpotLa : photo de profil et couverture (image ou courte vidéo).
-- À exécuter une fois dans Supabase > SQL Editor. Réexécutable sans risque.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists cover_kind text check (cover_kind in ('image', 'video'));
