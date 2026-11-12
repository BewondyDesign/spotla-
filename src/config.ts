// Connexion Supabase. La clé « anon / publishable » est publique par conception :
// la sécurité est assurée par les règles RLS de supabase/schema.sql.
// Laisser vide pour le mode démo. Les variables VITE_SUPABASE_* (Vercel) sont prioritaires.
export const SUPABASE_URL = 'https://ksxomkznjwecwxdssdlc.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_kI6AQvAd8-uNAv4j1GWb8w_ZgIUtNJD'

/** Courriel de support affiché dans les pages légales (laisser vide tant qu'il n'est pas choisi : le formulaire « Contacter SpotLa » reste disponible). */
export const CONTACT_EMAIL = 'bewondydesign@gmail.com'
