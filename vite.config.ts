import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le build fonctionne aussi depuis un sous-dossier ou un hébergement statique.
// Les bibliothèques (React, Supabase) sont dans des fichiers à part : elles restent en cache
// sur le téléphone d'une mise à jour à l'autre, seul le code de l'app est retéléchargé.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('lucide-react')) return 'icons'
        },
      },
    },
  },
})
