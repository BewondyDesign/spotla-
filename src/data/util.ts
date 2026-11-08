import type { Moment, SpotEvent } from './types'

export const PARIS = { lat: 48.8670, lng: 2.3740 }

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export const fmtKm = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1).replace('.', ',')} km`)

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** Le soir commence à 17 h ; un événement en cours compte toujours pour « Ce soir ». */
export function momentOf(e: SpotEvent, now = new Date()): Moment {
  const s = new Date(e.start)
  const end = new Date(e.end)
  if (end < now) return 'past'
  if (s <= now) return 'tonight'
  if (sameDay(s, now)) return s.getHours() >= 17 ? 'tonight' : 'today'
  // nuit après minuit
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  if (sameDay(s, tomorrow) && s.getHours() < 6) return 'tonight'
  const days = (s.getTime() - now.getTime()) / 86_400_000
  const dow = s.getDay()
  if (days < 7 && (dow === 0 || dow === 6 || (dow === 5 && s.getHours() >= 17))) return 'weekend'
  return 'later'
}

export const isLive = (e: SpotEvent, now = new Date()) => new Date(e.start) <= now && new Date(e.end) > now

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function fmtDay(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return d.getHours() >= 17 ? 'Ce soir' : 'Aujourd\'hui'
  const t = new Date(now); t.setDate(now.getDate() + 1)
  if (sameDay(d, t)) return 'Demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function startsIn(e: SpotEvent, now = new Date()) {
  const s = new Date(e.start).getTime()
  const diff = Math.round((s - now.getTime()) / 60_000)
  if (isLive(e, now)) {
    const since = -diff
    return since < 60 ? `En cours depuis ${since} min` : `En cours depuis ${Math.floor(since / 60)} h`
  }
  if (diff < 0) return 'Terminé'
  if (diff < 60) return `Commence dans ${diff} min`
  if (diff < 24 * 60) return `Commence dans ${Math.floor(diff / 60)} h ${String(diff % 60).padStart(2, '0')}`
  return fmtDay(e.start)
}

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

export const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const PALETTES: [string, string][] = [
  ['#FF4F9A', '#FFB547'], ['#3CF0C8', '#8B7CFF'], ['#8B7CFF', '#FF4F9A'], ['#FFB547', '#FF6B5E'], ['#FF6B5E', '#FF4F9A'], ['#3CF0C8', '#FFB547'],
]

export const VIBES = [
  { k: 'danser', l: 'Danser' },
  { k: 'live', l: 'Musique live' },
  { k: 'chill', l: 'Chill' },
  { k: 'apero', l: 'Apéro' },
  { k: 'culture', l: 'Culture' },
  { k: 'sport', l: 'Sport' },
]

export const VIS_LABEL: Record<SpotEvent['visibility'], string> = {
  open: 'Ouvert à tous',
  limited: 'Places limitées',
  request: 'Sur demande',
  circle: 'Cercle restreint',
}
