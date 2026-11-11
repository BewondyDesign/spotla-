-- SpotLa : 10 utilisateurs de test pour voir l'app « vivante ».
-- À exécuter dans Supabase > SQL Editor. Réexécutable sans risque.
-- Pour tout retirer avant le lancement : exécute supabase/demo-users-remove.sql.
-- Les comptes de test ont une adresse en @spotla.test et ne peuvent pas se connecter (pas de mot de passe).

-- 1) Comptes
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', id::uuid, 'authenticated', 'authenticated', email, '', now(), '{"provider":"email","providers":["email"]}', '{}', now() - interval '20 days', now(), '', '', '', ''
from (values
  ('d0000000-0000-4000-a000-000000000001', 'ines@spotla.test'),
  ('d0000000-0000-4000-a000-000000000002', 'malik@spotla.test'),
  ('d0000000-0000-4000-a000-000000000003', 'chloe@spotla.test'),
  ('d0000000-0000-4000-a000-000000000004', 'samuel@spotla.test'),
  ('d0000000-0000-4000-a000-000000000005', 'lea@spotla.test'),
  ('d0000000-0000-4000-a000-000000000006', 'karim@spotla.test'),
  ('d0000000-0000-4000-a000-000000000007', 'maya@spotla.test'),
  ('d0000000-0000-4000-a000-000000000008', 'olivier@spotla.test'),
  ('d0000000-0000-4000-a000-000000000009', 'toitrouge@spotla.test'),
  ('d0000000-0000-4000-a000-000000000010', 'nebula@spotla.test')
) as t(id, email)
on conflict (id) do nothing;

-- 2) Profils (photo de profil + couverture)
insert into public.profiles (id, name, handle, kind, bio, city, venue_address, color, vibes, avatar_url, cover_url, cover_kind) values
  ('d0000000-0000-4000-a000-000000000001', 'Inès Tremblay', 'ines.mtl', 'perso', 'Rooftops, cocktails et bonnes adresses du Plateau.', 'Montréal', null, '#3A3A40', '{apero,danser}', 'https://images.unsplash.com/photo-1615751596346-9df8006e5381?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1775955849483-5992deefbed3?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000002', 'Malik Diallo', 'malik.d', 'perso', 'House & techno. Je partage mes soirées en appart.', 'Montréal', null, '#3A3A40', '{danser,live}', 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1541126274323-dbac58d14741?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000003', 'Chloé Gagnon', 'chloe.sort', 'perso', 'Toujours partante pour un bon spectacle.', 'Montréal', null, '#3A3A40', '{live,culture}', 'https://images.unsplash.com/photo-1657152042407-64b755c7558a?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1603910234616-3b5f4a6be2b4?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000004', 'Samuel Roy', 'sam.roy', 'perso', 'Bières de micro et terrasses chauffées.', 'Montréal', null, '#3A3A40', '{apero,chill}', 'https://images.unsplash.com/photo-1734830268394-6c4a1f165af1?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1792343948361-1f57fbff12e9?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000005', 'Léa Bouchard', 'lea.b', 'perso', 'Marchés de Noël, vin nature et brunchs.', 'Montréal', null, '#3A3A40', '{chill,culture}', 'https://images.unsplash.com/photo-1699899657675-1003c7d28f2d?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1765044203136-fa42c59771ff?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000006', 'Karim Benali', 'karim.nuit', 'perso', 'DJ amateur. Afro, amapiano, disco.', 'Montréal', null, '#3A3A40', '{danser}', 'https://images.unsplash.com/photo-1748028313767-67d97c23a0d0?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1570207859654-a9a7ad65ed3d?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000007', 'Maya Côté', 'maya.c', 'perso', 'Jazz le lundi, karaoké le jeudi.', 'Montréal', null, '#3A3A40', '{live,apero}', 'https://images.unsplash.com/photo-1650381473833-3e2c74a40fbf?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1774544809959-1991aa21c904?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000008', 'Olivier Pelletier', 'oli.p', 'perso', 'Je teste tous les speakeasies de la ville.', 'Montréal', null, '#3A3A40', '{apero}', 'https://images.unsplash.com/photo-1625241152315-4a698f74ceb7?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1640902106532-47dd3a2e833e?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000009', 'Le Toit Rouge', 'letoitrouge', 'business', 'Bar à cocktails sur le toit (compte de test). DJ du jeudi au samedi.', 'Montréal', '1200 rue Saint-Denis, Montréal', '#3A3A40', '{apero,danser}', 'https://images.unsplash.com/photo-1788713199492-8865db01e752?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1716194769922-a969b2ece6c5?w=1000&q=70&auto=format&fit=crop', 'image'),
  ('d0000000-0000-4000-a000-000000000010', 'Club Nébula', 'clubnebula', 'business', 'Club électro (compte de test). Ouvert jusqu''à 3 h.', 'Montréal', '400 boul. Saint-Laurent, Montréal', '#3A3A40', '{danser}', 'https://images.unsplash.com/photo-1570207859654-a9a7ad65ed3d?w=300&h=300&q=70&auto=format&fit=crop', 'https://images.unsplash.com/photo-1630395822970-acd6a691d97e?w=1000&q=70&auto=format&fit=crop', 'image')
on conflict (id) do update set name = excluded.name, bio = excluded.bio, avatar_url = excluded.avatar_url, cover_url = excluded.cover_url, cover_kind = excluded.cover_kind;

-- 3) Abonnements entre eux
insert into public.follows (follower, followee)
select ('d0000000-0000-4000-a000-0000000000' || lpad(a::text, 2, '0'))::uuid, ('d0000000-0000-4000-a000-0000000000' || lpad(b::text, 2, '0'))::uuid
from generate_series(1, 10) a, generate_series(1, 10) b
where a <> b and (a + b) % 3 <> 0
on conflict do nothing;

-- 4) Soirées (ce soir, demain, ce week-end), heure de Montréal
with d as (select date_trunc('day', now() at time zone 'America/Montreal') as today)
insert into public.events (id, host_id, title, vibe, tags, starts_at, ends_at, venue, area, lat, lng, price, visibility, capacity, description, colors, boosted)
select e.id::uuid, e.host::uuid, e.title, e.vibe, e.tags::text[],
  ((select today from d) + e.start_h * interval '1 hour') at time zone 'America/Montreal',
  ((select today from d) + e.end_h * interval '1 hour') at time zone 'America/Montreal',
  e.venue, e.area, e.lat, e.lng, e.price, e.vis, e.cap, e.descr, e.colors::text[], e.boost
from (values
  ('e0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000010', 'Nébula : nuit techno', 'Techno', '{danser}', 22, 27, 'Club Nébula', 'Quartier des spectacles', 45.5088, -73.5660, 15.00, 'open', null, 'Trois DJs locaux, son massif, jusqu''à 3 h.', '{#2B2140,#120F1C}', true),
  ('e0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009', 'Afterwork sur le toit', 'Apéro', '{apero}', 17, 22, 'Le Toit Rouge', 'Quartier latin', 45.5150, -73.5620, 0, 'open', null, 'Cocktails à 9 $, DJ set dès 19 h. Terrasse chauffée.', '{#3A2420,#160E0C}', false),
  ('e0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002', 'Soirée house chez Malik', 'House', '{danser}', 21, 26, 'Appartement de Malik', 'Mile End', 45.5236, -73.6010, 0, 'request', 25, 'Petite soirée entre amis, apporte ta bonne humeur. Adresse donnée après acceptation.', '{#1F2A33,#0E1418}', false),
  ('e0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000007', 'Jam jazz du jeudi', 'Jazz', '{live}', 44, 48, 'Café des Arts (lieu de test)', 'Plateau', 45.5225, -73.5780, 10.00, 'open', null, 'Jam ouverte, musiciens bienvenus.', '{#2A2516,#13110A}', false),
  ('e0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000006', 'Afro & Amapiano', 'Afro', '{danser}', 70, 75, 'Salle Lumen (lieu de test)', 'Griffintown', 45.4930, -73.5590, 20.00, 'limited', 120, 'Line-up 100 % afro. Places limitées.', '{#33201A,#160D0A}', true),
  ('e0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005', 'Tournée des marchés de Noël', 'Balade', '{chill,culture}', 38, 42, 'Place des Festivals', 'Quartier des spectacles', 45.5085, -73.5665, 0, 'open', null, 'On se retrouve devant le grand sapin, puis vin chaud au Vieux-Port.', '{#1E2A24,#0D1410}', false),
  ('e0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000004', 'Karaoké & pintes', 'Karaoké', '{apero}', 20, 24, 'Pub du Coin (lieu de test)', 'Rosemont', 45.5400, -73.5850, 0, 'open', null, 'Micro ouvert, pintes à 6 $.', '{#2A1E2E,#120D14}', false),
  ('e0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000008', 'Cercle cocktails secrets', 'Speakeasy', '{apero}', 69, 73, 'Adresse secrète', 'Vieux-Montréal', 45.5040, -73.5560, 0, 'circle', 12, 'Entre abonnés : on teste trois speakeasies dans la soirée.', '{#1A1F2E,#0B0D14}', false)
) as e(id, host, title, vibe, tags, start_h, end_h, venue, area, lat, lng, price, vis, cap, descr, colors, boost)
on conflict (id) do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at;

insert into public.event_addresses (event_id, address) values
  ('e0000000-0000-4000-a000-000000000001', '400 boul. Saint-Laurent'),
  ('e0000000-0000-4000-a000-000000000002', '1200 rue Saint-Denis'),
  ('e0000000-0000-4000-a000-000000000003', 'Rue Saint-Viateur (donnée après acceptation)'),
  ('e0000000-0000-4000-a000-000000000004', '4000 rue Saint-Denis'),
  ('e0000000-0000-4000-a000-000000000005', '1500 rue Ottawa'),
  ('e0000000-0000-4000-a000-000000000006', 'Place des Festivals'),
  ('e0000000-0000-4000-a000-000000000007', '5000 rue Masson'),
  ('e0000000-0000-4000-a000-000000000008', 'Communiquée aux abonnés')
on conflict do nothing;

-- Qui y va
insert into public.attendances (event_id, user_id, status)
select ('e0000000-0000-4000-a000-00000000000' || ev)::uuid, ('d0000000-0000-4000-a000-0000000000' || lpad(u::text, 2, '0'))::uuid,
  case when ev = 3 and u % 2 = 0 then 'requested' else 'going' end
from generate_series(1, 8) ev, generate_series(1, 10) u
where (ev * 7 + u * 3) % 4 <> 0
on conflict do nothing;

-- 5) Publications, likes et commentaires
insert into public.posts (id, author_id, event_id, body, image_url, created_at) values
  ('f0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', null, 'Coucher de soleil sur le toit, cocktail au yuzu. Montréal en novembre, ça se mérite 🧡', 'https://images.unsplash.com/photo-1598994392980-53a7fb033bcc?w=900&q=70&auto=format&fit=crop', now() - interval '2 hours'),
  ('f0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000010', 'e0000000-0000-4000-a000-000000000001', 'Ce soir on ouvre à 22 h. Les 100 premiers entrent à 10 $.', 'https://images.unsplash.com/photo-1630395822970-acd6a691d97e?w=900&q=70&auto=format&fit=crop', now() - interval '3 hours'),
  ('f0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000005', null, 'Le Grand Marché de Noël est ouvert ! Vin chaud validé.', 'https://images.unsplash.com/photo-1765044203136-fa42c59771ff?w=900&q=70&auto=format&fit=crop', now() - interval '5 hours'),
  ('f0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000002', 'e0000000-0000-4000-a000-000000000003', 'Soirée house ce soir, il reste quelques places. Demande à rejoindre 👀', null, now() - interval '6 hours'),
  ('f0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000008', null, 'Nouveau speakeasy testé : derrière une porte de frigo. 9/10.', 'https://images.unsplash.com/photo-1792670846245-09ef04789925?w=900&q=70&auto=format&fit=crop', now() - interval '1 day'),
  ('f0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000007', null, 'Le jazz du lundi, toujours une valeur sûre.', 'https://images.unsplash.com/photo-1774544809959-1991aa21c904?w=900&q=70&auto=format&fit=crop', now() - interval '1 day 4 hours'),
  ('f0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000009', 'e0000000-0000-4000-a000-000000000002', 'Afterwork ce soir dès 17 h, terrasse chauffée et DJ.', 'https://images.unsplash.com/photo-1716194769922-a969b2ece6c5?w=900&q=70&auto=format&fit=crop', now() - interval '8 hours'),
  ('f0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000006', null, 'Qui vient danser samedi ? Line-up afro de malade.', 'https://images.unsplash.com/photo-1656283384093-1e227e621fad?w=900&q=70&auto=format&fit=crop', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.post_likes (post_id, user_id)
select ('f0000000-0000-4000-a000-00000000000' || p)::uuid, ('d0000000-0000-4000-a000-0000000000' || lpad(u::text, 2, '0'))::uuid
from generate_series(1, 8) p, generate_series(1, 10) u
where (p * 5 + u) % 3 <> 0
on conflict do nothing;

insert into public.comments (id, post_id, author_id, body, created_at) values
  ('c0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 'C''est où ? J''y vais vendredi.', now() - interval '90 minutes'),
  ('c0000000-0000-4000-a000-000000000002', 'f0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000006', 'On sera là !', now() - interval '2 hours'),
  ('c0000000-0000-4000-a000-000000000003', 'f0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000001', 'Trop beau, j''y passe demain.', now() - interval '4 hours'),
  ('c0000000-0000-4000-a000-000000000004', 'f0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000004', 'Envoie l''adresse en privé 😅', now() - interval '20 hours'),
  ('c0000000-0000-4000-a000-000000000005', 'f0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000003', 'Moi !', now() - interval '1 day')
on conflict (id) do nothing;

-- 6) Likes et avis sur les lieux du Top 10
insert into public.place_likes (place_id, user_id)
select pl, ('d0000000-0000-4000-a000-0000000000' || lpad(u::text, 2, '0'))::uuid
from unnest(array['osm:node/4486771295','osm:node/13739215443','cat:grand-marche-noel-2026','osm:node/6005804263','osm:node/5416663552','cat:igloofest-2027','osm:node/11888760955','cat:raw-wine-2026','osm:node/13936960001','cat:barbossa-jazz']) with ordinality as x(pl, i),
     generate_series(1, 8) u
where (i + u) % 3 <> 0
on conflict do nothing;

insert into public.place_reviews (place_id, user_id, rating, body, created_at) values
  ('osm:node/4486771295', 'd0000000-0000-4000-a000-000000000002', 5, 'Le meilleur son de la ville, point.', now() - interval '3 days'),
  ('osm:node/4486771295', 'd0000000-0000-4000-a000-000000000006', 5, 'After mythique, on ressort au lever du soleil.', now() - interval '6 days'),
  ('osm:node/4486771295', 'd0000000-0000-4000-a000-000000000003', 4, 'Intense mais incroyable.', now() - interval '10 days'),
  ('osm:node/13739215443', 'd0000000-0000-4000-a000-000000000001', 5, 'Cocktails superbes, ambiance feutrée.', now() - interval '2 days'),
  ('osm:node/13739215443', 'd0000000-0000-4000-a000-000000000008', 4, 'Réserve, c''est vite plein.', now() - interval '5 days'),
  ('cat:grand-marche-noel-2026', 'd0000000-0000-4000-a000-000000000005', 5, 'Magique le soir, très bien décoré.', now() - interval '1 day'),
  ('cat:grand-marche-noel-2026', 'd0000000-0000-4000-a000-000000000004', 4, 'Beaucoup de monde le samedi, viens en semaine.', now() - interval '2 days'),
  ('osm:node/6005804263', 'd0000000-0000-4000-a000-000000000006', 4, 'Petite salle, grosse ambiance.', now() - interval '4 days'),
  ('osm:node/5416663552', 'd0000000-0000-4000-a000-000000000008', 5, 'Le speakeasy le plus chic du centre-ville.', now() - interval '7 days'),
  ('osm:node/5416663552', 'd0000000-0000-4000-a000-000000000001', 4, 'Déco folle, cocktails un peu chers.', now() - interval '8 days'),
  ('cat:igloofest-2027', 'd0000000-0000-4000-a000-000000000002', 5, 'Danser dans la neige, il faut l''avoir fait.', now() - interval '12 days'),
  ('osm:node/11888760955', 'd0000000-0000-4000-a000-000000000003', 4, 'Grosse salle, bons line-ups.', now() - interval '9 days'),
  ('cat:raw-wine-2026', 'd0000000-0000-4000-a000-000000000005', 5, 'Paradis du vin nature.', now() - interval '3 days'),
  ('osm:node/13936960001', 'd0000000-0000-4000-a000-000000000007', 4, 'Terrasse cachée très sympa.', now() - interval '6 days'),
  ('cat:barbossa-jazz', 'd0000000-0000-4000-a000-000000000007', 5, 'Mon rituel du lundi.', now() - interval '1 day')
on conflict (place_id, user_id) do nothing;
