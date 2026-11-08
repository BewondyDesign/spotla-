// Connexion Supabase. La clé « anon / publishable » est publique par conception :
// la sécurité est assurée par les règles RLS de supabase/schema.sql.
// Laisser vide pour le mode démo. Les variables VITE_SUPABASE_* (Vercel) sont prioritaires.
export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''
