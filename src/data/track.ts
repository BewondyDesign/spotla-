// Mesure d'audience et suivi des bugs, gardés dans la base Supabase de SpotLa (supabase/launch-v1.sql).
// Aucun service externe, aucune adresse IP : un identifiant au hasard propre à l'appareil, le nom de l'action et l'écran.
import { isRemote, sb } from './backend'

const VERSION = '2026.11.12'
let device = ''
try {
  device = localStorage.getItem('spotla-device') ?? ''
  if (!device) { device = `d-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)}`.slice(0, 40); localStorage.setItem('spotla-device', device) }
} catch { device = `d-${Math.random().toString(36).slice(2, 14)}` }

type Row = { device: string; name: string; props: Record<string, unknown>; path: string; at: string }
let queue: Row[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let off = false // table absente (SQL pas encore lancé) : on arrête d'essayer

const path = () => location.hash.replace(/^#/, '').replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id').slice(0, 190) || '/'

async function flush() {
  timer = null
  if (!queue.length || off || !sb) return
  const rows = queue.splice(0, 50)
  const { error } = await sb.from('analytics_events').insert(rows)
  if (error && /analytics_events|schema cache|relation/i.test(error.message)) off = true
}

/** Note une action (« open », « going », « share_story »…). Envoyé par paquets toutes les 4 secondes. */
export function track(name: string, props: Record<string, unknown> = {}) {
  if (!isRemote || off) return
  queue.push({ device, name, props, path: path(), at: new Date().toISOString() })
  if (queue.length >= 20) { void flush(); return }
  timer ??= setTimeout(flush, 4000)
}

// ---------- Bugs ----------
let sent = 0
const seen = new Set<string>()
async function report(message: string, stack?: string) {
  if (!isRemote || !sb || sent >= 10) return // 10 par session au plus
  const key = message.slice(0, 120)
  if (seen.has(key)) return
  seen.add(key)
  sent++
  await sb.from('client_errors').insert({
    device, message: message.slice(0, 500) || 'Erreur inconnue', stack: stack?.slice(0, 3900), path: path(),
    agent: navigator.userAgent.slice(0, 290), version: VERSION,
  })
}

let started = false
/** À lancer une fois au démarrage. */
export function startTracking() {
  if (started) return
  started = true
  window.addEventListener('error', (e) => { if (e.message) void report(e.message, (e.error as Error | undefined)?.stack) })
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string; stack?: string } | string
    const msg = typeof r === 'string' ? r : r?.message ?? ''
    // Coupures réseau : pas un bug de l'app.
    if (!msg || /Failed to fetch|NetworkError|Load failed|AbortError|play\(\)/i.test(msg)) return
    void report(msg, typeof r === 'string' ? undefined : r?.stack)
  })
  // Envoie ce qui reste quand on quitte l'app.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flush() })
  track('open', { standalone: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true, lang: navigator.language })
  // Une session de plus de 30 minutes ou un retour dans l'app compte comme une nouvelle ouverture.
  let hiddenAt = 0
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now()
    else if (hiddenAt && Date.now() - hiddenAt > 30 * 60_000) track('open', { resume: true })
  })
}
