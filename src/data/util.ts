import { isRemote } from './backend'
import type { Moment, SpotEvent } from './types'

export const PARIS = { lat: 48.8670, lng: 2.3740 }
export const MONTREAL = { lat: 45.5088, lng: -73.5617 }

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

// Fonds d'affiche sobres : graphite avec une légère teinte.
export const PALETTES: [string, string][] = [
  ['#3A2A31', '#18181B'], ['#2B2F36', '#141416'], ['#33302C', '#17171A'], ['#2E2A36', '#141416'], ['#3A2B2B', '#18181B'], ['#2A3330', '#141416'],
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

// ---------- Géolocalisation (OpenStreetMap / Nominatim, sans clé) ----------
export const RADII = [2, 5, 10, 20, 50]
const NOMINATIM = 'https://nominatim.openstreetmap.org'

/** Nom de la ville à partir d'une position. */
export async function reverseCity(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=10&accept-language=fr&lat=${lat}&lon=${lng}`)
    const j = await r.json()
    const a = j.address ?? {}
    return a.city || a.town || a.village || a.municipality || a.county || a.state || null
  } catch { return null }
}

export interface Place { name: string; lat: number; lng: number; area?: string; short?: string }

/** Recherche d'une ville ou d'une adresse, n'importe où dans le monde. */
export async function geocode(q: string, near?: { lat: number; lng: number }, citiesOnly = false): Promise<Place[]> {
  try {
    let url = `${NOMINATIM}/search?format=jsonv2&limit=5&addressdetails=1&accept-language=fr&q=${encodeURIComponent(q)}`
    if (citiesOnly) url += '&featureType=settlement'
    if (near) url += `&viewbox=${near.lng - 1},${near.lat + 1},${near.lng + 1},${near.lat - 1}`
    const r = await fetch(url)
    const j = (await r.json()) as { display_name: string; lat: string; lon: string; address?: Record<string, string> }[]
    return j.map((p) => {
      const a = p.address ?? {}
      const street = [a.house_number, a.road].filter(Boolean).join(' ')
      const area = a.neighbourhood || a.quarter || a.suburb || a.city_district || a.city || a.town || a.village
      return { name: p.display_name, lat: Number(p.lat), lng: Number(p.lon), area, short: [street, a.city || a.town || a.village].filter(Boolean).join(', ') || p.display_name }
    })
  } catch { return [] }
}

// Devise : dollar canadien pour le lancement à Montréal, euro pour la démo parisienne.
export const CUR = isRemote ? '$' : '€'
export const money = (n: number) => `${String(n).replace('.', ',')} ${CUR}`
