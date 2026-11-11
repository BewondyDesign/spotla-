import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useLang } from './data/i18n'
import { App } from './App'
import { sb } from './data/backend'
import { toast, useStore } from './data/store'
import './styles.css'

// Le lien de connexion revient avec les jetons (ou une erreur) dans l'URL, après le #.
// On laisse Supabase les lire AVANT que le routeur (qui utilise aussi le #) ne démarre,
// puis on nettoie l'adresse.
async function boot() {
  const raw = location.hash.slice(1)
  const params = new URLSearchParams(raw.includes('access_token') || raw.includes('error') ? raw : location.search.slice(1))
  if (sb) {
    await sb.auth.getSession()
    if (params.get('type') === 'recovery') useStore.setState({ recovery: true })
    if (params.has('access_token') || params.has('error') || params.has('code')) {
      history.replaceState(null, '', `${location.pathname}#/`)
    }
  }
  // Comme une app native : pas de zoom au pincement (iOS ignore user-scalable=no).
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.documentElement.lang = useLang.getState().lang
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
  const err = params.get('error_description')
  if (err) {
    const expired = params.get('error_code') === 'otp_expired'
    toast('Lien de connexion refusé', expired ? 'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.' : err.replace(/\+/g, ' '))
  }
}
boot()
