import { useEffect, useState } from 'react'
import { distanceKm } from './util'
import { useStore } from './store'

// Vrais lieux de sortie autour de la personne (bars, boîtes de nuit, pubs, salles de concert),
// tirés d'OpenStreetMap. Source principale : Photon (rapide, sans clé). Overpass sert de
// complément quand il répond (il est souvent saturé) ; on essaie plusieurs serveurs.

export interface Venue { id: string; name: string; kind: string; lat: number; lng: number; address?: string; website?: string }
type Pos = { lat: number; lng: number }

const KIND: Record<string, string> = {
  nightclub: 'Boîte de nuit', bar: 'Bar', pub: 'Pub', music_venue: 'Salle de concert', biergarten: 'Terrasse',
  restaurant: 'Restaurant', cafe: 'Café', theatre: 'Théâtre', arts_centre: 'Centre culturel', park: 'Parc', karaoke_box: 'Karaoké',
}
const NIGHT_TAGS = ['amenity:nightclub', 'amenity:bar', 'amenity:pub', 'amenity:music_venue', 'amenity:biergarten']

const PHOTON = 'https://photon.komoot.io'
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

async function getJson<T>(url: string, init: RequestInit = {}, ms = 8000): Promise<T> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal })
    if (!r.ok) throw new Error(String(r.status))
    return (await r.json()) as T
  } finally { clearTimeout(t) }
}

// ---------- Photon ----------
interface PhotonFeature { properties: { osm_type: string; osm_id: number; osm_key: string; osm_value: string; name?: string; housenumber?: string; street?: string }; geometry: { coordinates: [number, number] } }
const fromPhoton = (f: PhotonFeature): Venue | null => {
  const p = f.properties
  if (!p.name) return null
  const [lng, lat] = f.geometry.coordinates
  const street = [p.housenumber, p.street].filter(Boolean).join(' ')
  const t = ({ N: 'node', W: 'way', R: 'relation' } as Record<string, string>)[p.osm_type] ?? p.osm_type
  return { id: `${t}/${p.osm_id}`, name: p.name, kind: KIND[p.osm_value] ?? 'Lieu', lat, lng, address: street || undefined }
}
async function photonAround(pos: Pos, radiusKm: number, tags: string[], limit = 50): Promise<Venue[]> {
  const u = `${PHOTON}/reverse?lat=${pos.lat}&lon=${pos.lng}&limit=${limit}&radius=${Math.min(radiusKm, 50)}&${tags.map((t) => `osm_tag=${t}`).join('&')}`
  const j = await getJson<{ features: PhotonFeature[] }>(u)
  return j.features.map(fromPhoton).filter((v): v is Venue => !!v)
}
async function photonSearch(q: string, pos: Pos, tags: string[] = []): Promise<Venue[]> {
  const u = `${PHOTON}/api/?q=${encodeURIComponent(q)}&lat=${pos.lat}&lon=${pos.lng}&limit=50&location_bias_scale=0.1&zoom=12${tags.map((t) => `&osm_tag=${t}`).join('')}`
  const j = await getJson<{ features: PhotonFeature[] }>(u)
  return j.features.map(fromPhoton).filter((v): v is Venue => !!v)
}

// ---------- Overpass (complément, plusieurs serveurs) ----------
interface OsmEl { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: Record<string, string> }
async function overpass(query: string): Promise<Venue[]> {
  for (const url of OVERPASS) {
    try {
      const j = await getJson<{ elements: OsmEl[] }>(url, { method: 'POST', body: new URLSearchParams({ data: query }) }, 9000)
      return j.elements.flatMap((e) => {
        const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
        const t = e.tags ?? {}
        if (lat == null || lng == null || !t.name) return []
        const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
        const kind = KIND[t.amenity] ?? (t.leisure === 'park' ? 'Parc' : t.leisure ? 'Loisirs' : 'Lieu')
        return [{ id: `${e.type}/${e.id}`, name: t.name, kind, lat, lng, address: street || undefined, website: t.website || t['contact:website'] || t['contact:instagram'] || undefined }]
      })
    } catch { /* serveur saturé : on passe au suivant */ }
  }
  throw new Error('overpass indisponible')
}

// ---------- Fusion, tri, cache ----------
function merge(pos: Pos, radiusKm: number, ...lists: Venue[][]): Venue[] {
  const out = new Map<string, Venue>()
  for (const l of lists) for (const v of l) {
    if (distanceKm(pos, v) > radiusKm) continue
    // même lieu venant de deux sources : on garde la version la plus complète
    const key = `${v.name.toLowerCase()}|${v.lat.toFixed(3)}|${v.lng.toFixed(3)}`
    const prev = out.get(v.id) ?? out.get(key)
    const best = prev ? { ...prev, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x != null)) } as Venue : v
    out.set(v.id, best); out.set(key, best)
  }
  return [...new Set(out.values())]
}
const byDistance = (pos: Pos) => (a: Venue, b: Venue) => distanceKm(pos, a) - distanceKm(pos, b)

const LS = 'spotla-venues-v2'
const mem = new Map<string, Venue[]>()
function readCache(key: string): Venue[] | null {
  if (mem.has(key)) return mem.get(key)!
  try {
    const all = JSON.parse(localStorage.getItem(LS) || '{}') as Record<string, { t: number; v: Venue[] }>
    const hit = all[key]
    if (hit && Date.now() - hit.t < 6 * 3600_000) { mem.set(key, hit.v); return hit.v }
  } catch { /* stockage indisponible */ }
  return null
}
function writeCache(key: string, v: Venue[]) {
  mem.set(key, v)
  try {
    const all = JSON.parse(localStorage.getItem(LS) || '{}') as Record<string, { t: number; v: Venue[] }>
    all[key] = { t: Date.now(), v }
    const keys = Object.keys(all).sort((a, b) => all[b].t - all[a].t).slice(0, 8)
    localStorage.setItem(LS, JSON.stringify(Object.fromEntries(keys.map((k) => [k, all[k]]))))
  } catch { /* plein ou bloqué */ }
}

/**
 * Lieux de sortie autour de la position. `onUpdate` reçoit d'abord le résultat rapide (Photon),
 * puis la liste enrichie quand Overpass répond.
 */
export async function nearbyVenues(pos: Pos, radiusKm: number, onUpdate?: (v: Venue[]) => void): Promise<Venue[]> {
  const r = Math.min(radiusKm, 50)
  const key = `${pos.lat.toFixed(2)},${pos.lng.toFixed(2)},${r}`
  const cached = readCache(key)
  if (cached) return cached
  const sort = (l: Venue[]) => l.sort((a, b) => Number(b.kind === 'Boîte de nuit') - Number(a.kind === 'Boîte de nuit') || byDistance(pos)(a, b))
  // Photon : les boîtes de nuit à part, sinon elles se perdent parmi les bars.
  const quick = await Promise.allSettled([
    photonAround(pos, r, ['amenity:nightclub']),
    photonAround(pos, r, NIGHT_TAGS),
  ])
  let list = sort(merge(pos, r, ...quick.map((x) => (x.status === 'fulfilled' ? x.value : []))))
  if (list.length) onUpdate?.(list)
  try {
    const more = await overpass(`[out:json][timeout:15];nwr["amenity"~"^(nightclub|bar|pub|music_venue|biergarten)$"]["name"](around:${Math.min(r, 20) * 1000},${pos.lat},${pos.lng});out center 400;`)
    list = sort(merge(pos, r, list, more))
  } catch { /* Photon suffit */ }
  if (list.length) writeCache(key, list)
  else if (quick.every((x) => x.status === 'rejected')) throw new Error('réseau')
  return list
}

const esc = (s: string) => s.replace(/[\\"]/g, '').replace(/[.*+?^${}()|[\]]/g, '\\$&')
// Mots courants → types de lieux OpenStreetMap
const KEYWORDS: [RegExp, string[], string][] = [
  [/club|boite|boîte|disco|danser|nightclub/i, ['amenity:nightclub'], '["amenity"="nightclub"]'],
  [/\bbars?\b|cocktail|lounge/i, ['amenity:bar'], '["amenity"="bar"]'],
  [/pub|biere|bière|brasserie|microbrasserie/i, ['amenity:pub', 'amenity:biergarten'], '["amenity"~"^(pub|biergarten)$"]'],
  [/concert|live|spectacle|salle|show/i, ['amenity:music_venue', 'amenity:theatre', 'amenity:arts_centre'], '["amenity"~"^(music_venue|theatre|arts_centre)$"]'],
  [/karaok/i, ['amenity:karaoke_box'], '["karaoke"="yes"]'],
  [/resto|restaurant|manger/i, ['amenity:restaurant'], '["amenity"="restaurant"]'],
  [/cafe|café/i, ['amenity:cafe'], '["amenity"="cafe"]'],
  [/parc|park/i, ['leisure:park'], '["leisure"="park"]'],
]

/** Recherche libre (« club », « karaoké », « Le Belmont »…) dans le rayon choisi, triée par distance. */
export async function searchPlaces(q: string, pos: Pos, radiusKm: number): Promise<Venue[]> {
  const r = Math.min(radiusKm, 50)
  const hits = KEYWORDS.filter(([re]) => re.test(q))
  const tags = hits.flatMap(([, t]) => t)
  const jobs: Promise<Venue[]>[] = [photonSearch(q, pos)]
  if (tags.length) jobs.push(photonAround(pos, r, tags))
  const quick = await Promise.allSettled(jobs)
  let list = merge(pos, r, ...quick.map((x) => (x.status === 'fulfilled' ? x.value : [])))
  if (list.length < 10) {
    try {
      const around = `(around:${Math.min(r, 20) * 1000},${pos.lat},${pos.lng})`
      const kinds = hits.map(([, , f]) => `nwr${f}["name"]${around};`).join('')
      const byName = `nwr["name"~"${esc(q)}",i]["amenity"]${around};`
      list = merge(pos, r, list, await overpass(`[out:json][timeout:15];(${kinds}${byName});out center 200;`))
    } catch { /* Photon suffit */ }
  }
  return list.sort(byDistance(pos))
}

export function useVenues(livePos: Pos, radiusKm: number) {
  // On attend la vraie position (pas l'ancienne en mémoire) et on ignore les petits déplacements (< ~300 m).
  const geo = useStore((s) => s.geo)
  const pos = { lat: Math.round(livePos.lat * 300) / 300, lng: Math.round(livePos.lng * 300) / 300 }
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (geo === 'locating') return
    let alive = true
    setLoading(true); setError(false)
    const show = (v: Venue[]) => { if (alive) setVenues(v.filter((x) => distanceKm(pos, x) <= radiusKm)) }
    nearbyVenues(pos, radiusKm, show)
      .then((v) => { show(v); if (alive) setLoading(false) })
      .catch(() => { if (alive) { setError(true); setLoading(false) } })
    return () => { alive = false }
  }, [pos.lat, pos.lng, radiusKm, tick, geo === 'locating']) // eslint-disable-line react-hooks/exhaustive-deps
  return { venues, loading, error, retry: () => setTick((t) => t + 1) }
}

/** Lien d'itinéraire qui ouvre Plans (iPhone) ou Google Maps. */
export const directions = (v: { lat: number; lng: number; name: string }) =>
  /iPhone|iPad|Mac/.test(navigator.userAgent)
    ? `https://maps.apple.com/?daddr=${v.lat},${v.lng}&q=${encodeURIComponent(v.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`
