-- SpotLa : mise en conformité App Store / Google Play (2026-11-12)
-- À exécuter une fois dans Supabase → SQL Editor. Sans danger si relancé.

-- 1. Signaler n'importe quel contenu (membre, publication, commentaire, story, message, sortie) + messages au support.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid references public.profiles on delete set null default auth.uid(),
  kind text not null check (kind in ('user', 'post', 'comment', 'story', 'message', 'event', 'support')),
  target_id text,
  reason text not null check (char_length(reason) between 1 and 1000),
  created_at timestamptz not null default now(),
  handled boolean not null default false
);
alter table public.content_reports enable row level security;
drop policy if exists "report insert own" on public.content_reports;
create policy "report insert own" on public.content_reports for insert to authenticated with check (reporter = auth.uid());
drop policy if exists "report admin read" on public.content_reports;
create policy "report admin read" on public.content_reports for select using (public.is_admin());
drop policy if exists "report admin update" on public.content_reports;
create policy "report admin update" on public.content_reports for update using (public.is_admin());

-- Une publication, un commentaire ou une story signalés 3 fois sont retirés automatiquement, en attendant la modération.
create or replace function public.auto_remove_reported() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if new.kind not in ('post', 'comment', 'story') or new.target_id is null then return new; end if;
  select count(distinct reporter) into n from content_reports where kind = new.kind and target_id = new.target_id;
  if n >= 3 then
    if new.kind = 'post' then delete from posts where id::text = new.target_id;
    elsif new.kind = 'comment' then delete from comments where id::text = new.target_id;
    elsif new.kind = 'story' then delete from stories where id::text = new.target_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists content_reports_auto on public.content_reports;
create trigger content_reports_auto after insert on public.content_reports for each row execute function public.auto_remove_reported();

-- 2. Bloquer un membre : on ne voit plus ses contenus, et il ne peut plus te suivre.
create table if not exists public.blocks (
  blocker uuid not null references public.profiles on delete cascade default auth.uid(),
  blocked uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.blocks enable row level security;
drop policy if exists "blocks own" on public.blocks;
create policy "blocks own" on public.blocks for all to authenticated using (blocker = auth.uid()) with check (blocker = auth.uid());
-- Bloquer retire aussi l'abonnement dans les deux sens.
create or replace function public.block_unfollow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from follows where (follower = new.blocker and followee = new.blocked) or (follower = new.blocked and followee = new.blocker);
  return new;
exception when undefined_column then return new;
end $$;
drop trigger if exists blocks_unfollow on public.blocks;
create trigger blocks_unfollow after insert on public.blocks for each row execute function public.block_unfollow();

-- 3. Acceptation des conditions d'utilisation (date enregistrée).
alter table public.profiles add column if not exists terms_at timestamptz;
-- Lieu partenaire qui a amené le membre (lien ?ref= des affiches avec code QR).
alter table public.profiles add column if not exists ref_venue text;

-- 4. Supprimer son compte depuis l'app (exigé par Apple et Google).
-- Efface le compte de connexion : le profil, les sorties, publications, stories, commentaires, etc. suivent (on delete cascade).
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Non connecté'; end if;
  -- Les photos et vidéos du dossier media/<id>/ sont effacées par l'app juste avant (API Storage).
  delete from auth.users where id = me;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
