# SpotLa (MVP)

Trouve où sortir **ce soir**, près de toi. Web app mobile-first (PWA), thème « Nuit ».

## Lancer l'app

```bash
npm install
npm run dev        # http://localhost:5173 (aussi accessible depuis ton téléphone sur le même Wi-Fi)
npm run build      # version de production dans dist/
```

## Ce qui marche dans ce MVP

- **Onboarding** : compte « Je veux sortir » ou « J'ai un lieu » (business, vérification simulée).
- **Ce soir** : stories en haut, segments Ce soir / Journée / Week-end / Plus tard, filtres Gratuit, < 2 km, ambiances. Événements boostés en tête.
- **Fil d'actu** : posts façon Instagram/Facebook (photo, texte, j'aime, commentaires, partage, événement lié).
- **Stories vidéo 30 s** : filmer ou choisir une vidéo (refusée au-delà de 30 s), légende, événement lié. Visibles 24 h. Badge **LIVE / En ce moment** quand l'événement lié est en cours.
- **Carte** (Leaflet + OpenStreetMap) avec pastilles Gratuit / prix.
- **Fiche événement** : J'y vais, « Demander ma place » pour les soirées privées, adresse masquée tant que non accepté, billetterie, partage, signalement (masquage après 3 signalements).
- **Publier** : événement (ouvert, places limitées, sur demande, cercle restreint), story, post sur le mur.
- **Profil / mur** : abonnés, suivre, onglets Mur / Grille / Événements.
- **Espace business** : badge vérifié, statistiques (vues, J'y vais, partages), agenda, boost à 9,90 € (paiement simulé).
- **Activité** : notifications, demande d'autorisation « ça se passe près de toi ce soir ».

## Limites actuelles (volontaires pour le MVP)

Tout est stocké **sur l'appareil** (localStorage + IndexedDB pour les vidéos) : pas encore de vrais comptes partagés entre utilisateurs. Les données de démo (Paris) sont régénérées chaque jour. Les demandes / acceptations sont simulées pour montrer le parcours.

## Prochaine étape : le backend

`supabase/schema.sql` contient le schéma Postgres (profils, événements, présences, stories, posts, signalements, sécurité par ligne, adresse masquée). Il suffit de créer un projet Supabase, d'y coller le schéma, puis de remplacer `src/data/store.ts` et `src/data/media.ts` par des appels Supabase (Auth, Database, Storage, Realtime).

## Structure

```
src/
  data/       types, données de démo, état (zustand), médias (IndexedDB), utilitaires
  components/ cartes d'événement, stories (barre + lecteur), posts, barre d'onglets
  screens/    Onboarding, Home, MapScreen, EventDetail, Create, Profile, Business, Notifs
supabase/     schéma SQL
```
