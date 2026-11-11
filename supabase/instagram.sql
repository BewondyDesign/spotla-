-- Lien Instagram sur le profil SpotLa (nom d'utilisateur, sans @)
alter table public.profiles add column if not exists instagram text
  check (instagram is null or instagram ~ '^[a-z0-9._]{1,30}$');
