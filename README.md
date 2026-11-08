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

En mode démo, tout est stocké sur l'appareil et les demandes / acceptations sont simulées. En mode Supabase : pas encore de géocodage des adresses (position approximative), paiement du boost simulé, notifications push à brancher.

## Brancher Supabase (vraies données partagées)

1. Dans Supabase, crée un projet, puis **SQL Editor → New query**, colle tout `supabase/schema.sql` et clique **Run**.
2. **Authentication → URL Configuration** : mets `https://spotla.vercel.app` comme *Site URL* et ajoute-le dans *Redirect URLs* (plus `http://localhost:5173` pour le dev).
3. Option : **Authentication → Email Templates → Magic Link**, ajoute `{{ .Token }}` dans le texte pour recevoir aussi un code à 6 chiffres (pratique quand le lien s'ouvre dans un autre navigateur).
4. Mets l'URL du projet et la clé *anon / publishable* dans `src/config.ts` (ou en variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`). La clé anon est faite pour être publique ; ne mets **jamais** la clé `service_role` dans l'app.

Sans configuration, l'app tourne en **mode démo** (données locales sur l'appareil).

Pour vérifier un compte business : dans **Table Editor → profiles**, passe `verified` à `true` (seul le tableau de bord / la clé service peut le faire).

## Structure

```
src/
  data/       types, données de démo, état (zustand), médias (IndexedDB), utilitaires
  components/ cartes d'événement, stories (barre + lecteur), posts, barre d'onglets
  screens/    Onboarding, Home, MapScreen, EventDetail, Create, Profile, Business, Notifs
supabase/     schéma SQL
```
