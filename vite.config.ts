import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le build fonctionne aussi depuis un sous-dossier ou un hébergement statique.
export default defineConfig({ plugins: [react()], base: './' })
