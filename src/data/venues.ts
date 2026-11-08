import { useEffect, useState } from 'react'
import { distanceKm } from './util'

// Vrais lieux de sortie autour de la personne (bars, boîtes de nuit, pubs, salles de concert),
// tirés d'OpenStreetMap via l'API Overpass. Gratuit et sans clé : utile tant que peu
// d'événements sont publiés dans l'app.

export interface Venue { id: string; name: string; kind: string; lat: number; lng: number; address?: string; website?: string }

const KIND: Record<string, string> = { nightclub: 'Boîte de nuit', bar: 'Bar', pub: 'Pub', music_venue: 'Salle de concert', biergarten: 'Terrasse' }
const cache = new Map<string, Venue[]>()

export async function nearbyVenues(pos: { lat: number; lng: number }, radiusKm: number): Promise<Venue[]> {
  const r = Math.min(radiusKm, 50) * 1000
  const key = `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)},${r}`
  if (cache.has(key)) return cache.get(key)!
  const q = `[out:json][timeout:20];(
    nwr["amenity"~"^(nightclub|bar|pub|music_venue|biergarten)$"]["name"](around:${r},${pos.lat},${pos.lng});
  );out center 2000;`
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }) })
    const j = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: Record<string, string> }[] }
    const list = j.elements
      .map((e) => {
        const lat = e.lat ?? e.center?.lat
        const lng = e.lon ?? e.center?.lon
        if (lat == null || lng == null) return null
        const t = e.tags
        const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
        return { id: `${e.type}/${e.id}`, name: t.name, kind: KIND[t.amenity] ?? 'Bar', lat, lng, address: street || undefined, website: t.website || t['contact:website'] || t['contact:instagram'] || undefined } as Venue
      })
      .filter((v): v is Venue => !!v)
      // Les boîtes de nuit d'abord, puis les plus proches.
      .sort((a, b) => Number(b.kind === 'Boîte de nuit') - Number(a.kind === 'Boîte de nuit') || distanceKm(pos, a) - distanceKm(pos, b))
    cache.set(key, list)
    return list
  } catch {
    return []
  }
}

const esc = (s: string) => s.replace(/[\\"]/g, '').replace(/[.*+?^${}()|[\]]/g, '\\$&')
// Mots courants → types de lieux OpenStreetMap
const KEYWORDS: [RegExp, string][] = [
  [/club|boite|boîte|disco|danser/i, '["amenity"="nightclub"]'],
  [/bar|cocktail|lounge/i, '["amenity"="bar"]'],
  [/pub|biere|bière|brasserie|microbrasserie/i, '["amenity"~"^(pub|biergarten)$"]'],
  [/concert|live|spectacle|salle/i, '["amenity"~"^(music_venue|theatre|arts_centre)$"]'],
  [/karaok/i, '["karaoke"="yes"]'],
  [/resto|restaurant|manger/i, '["amenity"="restaurant"]'],
  [/cafe|café/i, '["amenity"="cafe"]'],
  [/parc|park/i, '["leisure"="park"]'],
]

/** Recherche libre (« club », « karaoké », « Le Belmont »…) dans le rayon choisi, triée par distance. */
export async function searchPlaces(q: string, pos: { lat: number; lng: number }, radiusKm: number): Promise<Venue[]> {
  const r = Math.min(radiusKm, 50) * 1000
  const around = `(around:${r},${pos.lat},${pos.lng})`
  const kinds = KEYWORDS.filter(([re]) => re.test(q)).map(([, f]) => `nwr${f}["name"]${around};`)
  const byName = `nwr["name"~"${esc(q)}",i]["amenity"]${around};nwr["name"~"${esc(q)}",i]["leisure"]${around};`
  const query = `[out:json][timeout:25];(${kinds.join('')}${byName});out center 300;`
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: query }) })
    const j = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: Record<string, string> }[] }
    const seen = new Set<string>()
    return j.elements.flatMap((e) => {
      const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
      const id = `${e.type}/${e.id}`
      if (lat == null || lng == null || seen.has(id)) return []
      seen.add(id)
      const t = e.tags
      const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
      const kind = KIND[t.amenity] ?? ({ restaurant: 'Restaurant', cafe: 'Café', theatre: 'Théâtre', arts_centre: 'Centre culturel' } as Record<string, string>)[t.amenity] ?? (t.leisure === 'park' ? 'Parc' : t.leisure ? 'Loisirs' : 'Lieu')
      return [{ id, name: t.name, kind, lat, lng, address: street || undefined, website: t.website || t['contact:website'] || undefined }]
    }).filter((v) => distanceKm(pos, v) <= radiusKm).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b))
  } catch {
    return []
  }
}

export function useVenues(pos: { lat: number; lng: number }, radiusKm: number) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    nearbyVenues(pos, radiusKm).then((v) => { if (alive) { setVenues(v.filter((x) => distanceKm(pos, x) <= radiusKm)); setLoading(false) } })
    return () => { alive = false }
  }, [pos.lat, pos.lng, radiusKm]) // eslint-disable-line react-hooks/exhaustive-deps
  return { venues, loading }
}

/** Lien d'itinéraire qui ouvre Plans (iPhone) ou Google Maps. */
export const directions = (v: { lat: number; lng: number; name: string }) =>
  /iPhone|iPad|Mac/.test(navigator.userAgent)
    ? `https://maps.apple.com/?daddr=${v.lat},${v.lng}&q=${encodeURIComponent(v.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`
