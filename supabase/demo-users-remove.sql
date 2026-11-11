-- SpotLa : retire les 10 utilisateurs de test et tout ce qu'ils ont créé (soirées, posts, likes, avis…).
delete from public.place_likes where user_id in (select id from auth.users where email like '%@spotla.test');
delete from public.place_reviews where user_id in (select id from auth.users where email like '%@spotla.test');
delete from auth.users where email like '%@spotla.test';
