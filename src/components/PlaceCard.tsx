import { useNavigate } from 'react-router-dom'
import { Gamepad2, Gift, Heart, Martini, MessageCircle, Music, PartyPopper, Star, UtensilsCrossed } from 'lucide-react'
import type { CatalogItem, Category } from '../data/catalog'
import { toggleLike, useStats } from '../data/places'
import { placeVideo } from '../data/ambiance'
import { AutoVideo } from './AutoVideo'
import { toast, useStore } from '../data/store'
import { distanceKm, fmtKm } from '../data/util'

export const CAT_ICON: Record<Category, typeof Music> = { club: Music, bar: Martini, soiree: PartyPopper, fetes: Gift, gastro: UtensilsCrossed, jeux: Gamepad2 }

export function Stars({ rating, size = 13 }: { rating: number | null; size?: number }) {
  const full = Math.round(rating ?? 0)
  return (
    <span className="stars" aria-label={rating ? `Note ${String(rating).replace('.', ',')} sur 5` : 'Pas encore noté'}>
      <span className="stars-row" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= full ? 'on' : ''} />)}</span>
      <span className="stars-n">{rating ? String(rating).replace('.', ',') : 'Nouveau'}</span>
    </span>
  )
}

/** Grande carte à faire glisser (accueil). */
export function PlaceCard({ p }: { p: CatalogItem }) {
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const st = useStats(p.id)
  const Icon = CAT_ICON[p.category]
  const vid = placeVideo(p)
  const like = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!meId) return
    try { await toggleLike(p.id, meId) } catch { toast('Impossible d\'enregistrer ton like', 'Réessaie dans un instant.') }
  }
  return (
    <article className={`pcard c-${p.category}`} onClick={() => nav(`/place/${encodeURIComponent(p.id)}`)}>
      {vid ? <AutoVideo className="pcard-bg" src={vid} poster={p.photo} />
        : p.photo ? <img className="pcard-bg" src={p.photo} alt="" loading="lazy" />
        : <Icon className="pcard-icon" size={130} strokeWidth={1} aria-hidden="true" />}
      <span className="pcard-rank">#{p.rank}</span>
      <button className={`pcard-like ${st.liked ? 'on' : ''}`} onClick={like} aria-label={st.liked ? 'Je n\'aime plus' : 'J\'aime'} aria-pressed={st.liked}><Heart size={20} /></button>
      <div className="pcard-over">
        {p.when && <span className="pcard-when">{p.when}</span>}
        <h3><a href={`#/place/${encodeURIComponent(p.id)}`} onClick={(e) => e.preventDefault()}>{p.name}</a></h3>
        <p className="pcard-meta">{p.kind} · {p.area} · {fmtKm(distanceKm(pos, p))}</p>
        <div className="pcard-stats">
          <Stars rating={st.rating} size={14} />
          <span><Heart size={13} /> {st.likes}</span>
          <span><MessageCircle size={13} /> {st.reviews}</span>
          {p.free && <span className="pcard-free">Gratuit</span>}
        </div>
      </div>
    </article>
  )
}
