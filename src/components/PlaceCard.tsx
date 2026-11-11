import { useNavigate } from 'react-router-dom'
import { Gift, Heart, Martini, MessageCircle, Music, PartyPopper, Star, UtensilsCrossed } from 'lucide-react'
import type { CatalogItem, Category } from '../data/catalog'
import { toggleLike, useStats } from '../data/places'
import { toast, useStore } from '../data/store'
import { distanceKm, fmtKm } from '../data/util'

export const CAT_ICON: Record<Category, typeof Music> = { club: Music, bar: Martini, soiree: PartyPopper, fetes: Gift, gastro: UtensilsCrossed }

export function Stars({ rating, size = 13 }: { rating: number | null; size?: number }) {
  return <span className="stars" aria-label={rating ? `Note ${String(rating).replace('.', ',')} sur 5` : 'Pas encore noté'}><Star size={size} />{rating ? String(rating).replace('.', ',') : 'Nouveau'}</span>
}

/** Grande carte à faire glisser (accueil). */
export function PlaceCard({ p }: { p: CatalogItem }) {
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const st = useStats(p.id)
  const Icon = CAT_ICON[p.category]
  const like = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!meId) return
    try { await toggleLike(p.id, meId) } catch { toast('Impossible d\'enregistrer ton like', 'Réessaie dans un instant.') }
  }
  return (
    <article className={`pcard c-${p.category}`} onClick={() => nav(`/place/${encodeURIComponent(p.id)}`)}>
      <div className="pcard-media">
        {p.photo ? <img src={p.photo} alt="" loading="lazy" /> : <Icon className="pcard-icon" size={120} strokeWidth={1} aria-hidden="true" />}
        <span className="pcard-rank">#{p.rank}</span>
        <button className={`pcard-like ${st.liked ? 'on' : ''}`} onClick={like} aria-label={st.liked ? 'Je n\'aime plus' : 'J\'aime'} aria-pressed={st.liked}><Heart size={20} /></button>
        {p.when && <span className="pcard-when">{p.when}</span>}
      </div>
      <div className="pcard-body">
        <h3><a href={`#/place/${encodeURIComponent(p.id)}`} onClick={(e) => e.preventDefault()}>{p.name}</a></h3>
        <p className="pcard-meta">{p.kind} · {p.area} · {fmtKm(distanceKm(pos, p))}</p>
        <div className="pcard-stats">
          <Stars rating={st.rating} />
          <span><Heart size={13} /> {st.likes}</span>
          <span><MessageCircle size={13} /> {st.reviews}</span>
          {p.free && <span className="pcard-free">Gratuit</span>}
        </div>
      </div>
    </article>
  )
}
