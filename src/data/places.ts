import { useEffect, useState } from 'react'
import { isRemote, sb } from './backend'
import { activeCatalog, type CatalogItem } from './catalog'
import { useStore } from './store'

// Likes, notes et avis des lieux proposés par l'app.
// En ligne : tables Supabase place_likes / place_reviews (supabase/places.sql).
// Sans Supabase (démo) : gardés sur l'appareil.

export interface PlaceStats { likes: number; reviews: number; rating: number | null; liked: boolean }
export interface Review { id: string; placeId: string; userId: string; author: string; handle?: string; rating: number; body: string; createdAt: string }

const EMPTY: PlaceStats = { likes: 0, reviews: 0, rating: null, liked: false }
const LOCAL = 'spotla-place-social'
type LocalData = { likes: string[]; reviews: Review[] }
const readLocal = (): LocalData => { try { return JSON.parse(localStorage.getItem(LOCAL) || '') as LocalData } catch { return { likes: [], reviews: [] } } }
const writeLocal = (d: LocalData) => { try { localStorage.setItem(LOCAL, JSON.stringify(d)) } catch { /* stockage bloqué */ } }

// Petit magasin partagé : chaque écran qui affiche un lieu voit les mêmes chiffres.
let stats: Record<string, PlaceStats> = {}
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
let tablesMissing = false

export async function loadStats(ids: string[], meId: string | null) {
  if (!ids.length) return
  if (!isRemote) {
    const d = readLocal()
    for (const id of ids) {
      const rv = d.reviews.filter((r) => r.placeId === id)
      stats[id] = { likes: d.likes.includes(id) ? 1 : 0, liked: d.likes.includes(id), reviews: rv.length, rating: rv.length ? Math.round((rv.reduce((a, r) => a + r.rating, 0) / rv.length) * 10) / 10 : null }
    }
    emit(); return
  }
  if (tablesMissing) return
  const [s, mine] = await Promise.all([
    sb!.from('place_stats').select('*').in('place_id', ids),
    meId ? sb!.from('place_likes').select('place_id').eq('user_id', meId).in('place_id', ids) : Promise.resolve({ data: [], error: null }),
  ])
  if (s.error) { if (/does not exist|relation|schema cache/i.test(s.error.message)) tablesMissing = true; return }
  const liked = new Set((mine.data ?? []).map((r: { place_id: string }) => r.place_id))
  const next = { ...stats }
  for (const id of ids) next[id] = { ...EMPTY, liked: liked.has(id) }
  for (const r of s.data as { place_id: string; likes: number; reviews: number; rating: number | null }[]) next[r.place_id] = { likes: r.likes, reviews: r.reviews, rating: r.rating, liked: liked.has(r.place_id) }
  stats = next
  emit()
}

export function useStats(id: string): PlaceStats {
  const [, force] = useState(0)
  useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f) } }, [])
  return stats[id] ?? EMPTY
}

export const socialReady = () => !isRemote || !tablesMissing

export async function toggleLike(id: string, meId: string) {
  const cur = stats[id] ?? EMPTY
  stats = { ...stats, [id]: { ...cur, liked: !cur.liked, likes: cur.likes + (cur.liked ? -1 : 1) } }
  emit()
  if (!isRemote) {
    const d = readLocal()
    d.likes = cur.liked ? d.likes.filter((x) => x !== id) : [...d.likes, id]
    writeLocal(d); return
  }
  const r = cur.liked
    ? await sb!.from('place_likes').delete().eq('place_id', id).eq('user_id', meId)
    : await sb!.from('place_likes').insert({ place_id: id, user_id: meId })
  if (r.error) { stats = { ...stats, [id]: cur }; emit(); throw new Error(r.error.message) }
}

export async function listReviews(id: string): Promise<Review[]> {
  if (!isRemote) return readLocal().reviews.filter((r) => r.placeId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const r = await sb!.from('place_reviews').select('id, place_id, user_id, rating, body, created_at, profiles(name, handle)').eq('place_id', id).order('created_at', { ascending: false }).limit(50)
  if (r.error) return []
  return (r.data as unknown as { id: string; place_id: string; user_id: string; rating: number; body: string; created_at: string; profiles: { name: string; handle?: string } | null }[]).map((x) => ({
    id: x.id, placeId: x.place_id, userId: x.user_id, rating: x.rating, body: x.body, createdAt: x.created_at, author: x.profiles?.name ?? 'Quelqu\'un', handle: x.profiles?.handle,
  }))
}

export async function saveReview(id: string, meId: string, rating: number, body: string) {
  if (!isRemote) {
    const me = useStore.getState().users.find((u) => u.id === meId)
    const d = readLocal()
    d.reviews = [...d.reviews.filter((r) => !(r.placeId === id && r.userId === meId)), { id: `${id}-${meId}`, placeId: id, userId: meId, author: me?.name ?? 'Moi', handle: me?.handle, rating, body, createdAt: new Date().toISOString() }]
    writeLocal(d)
  } else {
    const r = await sb!.from('place_reviews').upsert({ place_id: id, user_id: meId, rating, body }, { onConflict: 'place_id,user_id' })
    if (r.error) throw new Error(r.error.message)
  }
  await loadStats([id], meId)
}

/** Lieux proposés : la sélection SpotLa, plus ceux ajoutés par l'équipe dans Supabase (table places). */
export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>(activeCatalog())
  const meId = useStore((s) => s.meId)
  useEffect(() => {
    let alive = true
    const base = activeCatalog()
    const go = async () => {
      let extra: CatalogItem[] = []
      if (isRemote) {
        const r = await sb!.from('places').select('*').eq('featured', true)
        if (!r.error) extra = (r.data as { id: string; name: string; kind: string; category?: string; area?: string; address?: string; lat: number; lng: number; description?: string; photo_url?: string; when_text?: string; ends_on?: string }[])
          .filter((p) => !p.ends_on || p.ends_on >= new Date().toISOString().slice(0, 10))
          .map((p, i) => ({ id: p.id, name: p.name, kind: p.kind, category: (p.category as CatalogItem['category']) || 'bar', area: p.area ?? '', address: p.address, lat: p.lat, lng: p.lng, blurb: p.description ?? '', photo: p.photo_url, when: p.when_text, to: p.ends_on, rank: 100 + i }))
      }
      // Une ligne de la table remplace l'entrée intégrée du même id (ex. pour ajouter une photo).
      const byId = new Map(base.map((c) => [c.id, c]))
      for (const e of extra) byId.set(e.id, { ...byId.get(e.id), ...Object.fromEntries(Object.entries(e).filter(([, v]) => v != null && v !== '')) } as CatalogItem)
      const all = [...byId.values()]
      if (alive) setItems(all)
      await loadStats(all.map((c) => c.id), meId)
    }
    go()
    return () => { alive = false }
  }, [meId])
  return items
}
