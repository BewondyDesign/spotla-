import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Heart, MapPin, Navigation, Share2, Star } from 'lucide-react'
import { CATALOG, galleryOf } from '../data/catalog'
import { Gallery } from '../components/Gallery'
import { listReviews, saveReview, socialReady, toggleLike, useCatalog, useStats, type Review } from '../data/places'
import { requireAccount, toast, useStore } from '../data/store'
import { distanceKm, fmtKm, timeAgo } from '../data/util'
import { directions } from '../data/venues'
import { CAT_ICON, Stars } from '../components/PlaceCard'
import { Avatar } from '../components/ui'
import { shareStory } from '../components/storyShare'
import { Instagram } from 'lucide-react'
import { share } from '../components/share'

export function PlaceDetail() {
  const { id = '' } = useParams()
  const placeId = decodeURIComponent(id)
  const nav = useNavigate()
  const items = useCatalog()
  const p = useMemo(() => items.find((x) => x.id === placeId) ?? CATALOG.find((x) => x.id === placeId), [items, placeId])
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const users = useStore((s) => s.users)
  const st = useStats(placeId)
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = reviews.find((r) => r.userId === meId)

  useEffect(() => { listReviews(placeId).then(setReviews) }, [placeId, st.reviews])
  useEffect(() => { if (mine) { setRating(mine.rating); setBody(mine.body) } }, [mine?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <div className="scr"><div className="pad"><button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button><p className="empty">Ce lieu n'est plus proposé.</p></div></div>
  const Icon = CAT_ICON[p.category]
  const gallery = galleryOf(p)

  const like = async () => {
    if (!meId) { requireAccount('enregistrer ce lieu'); return }
    try { await toggleLike(p.id, meId) } catch { toast('Impossible d\'enregistrer ton like', 'Réessaie dans un instant.') }
  }
  const send = async () => {
    if (!meId) { requireAccount('laisser un avis'); return }
    if (!rating) return
    setBusy(true)
    try { await saveReview(p.id, meId, rating, body.trim()); toast(mine ? 'Avis modifié' : 'Merci pour ton avis') } catch (e) { toast('Ton avis n\'a pas pu être envoyé', (e as Error).message) }
    setBusy(false)
  }

  return (
    <div className="scr no-tab place-scr">
      <div className={`place-hero c-${p.category}`}>
        {gallery.length ? <Gallery items={gallery} /> : <Icon className="pcard-icon" size={160} strokeWidth={1} aria-hidden="true" />}
        <div className="ev-top">
          <button className="iconbtn glass" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button>
          <span className="row gap8"><button className="story-btn" onClick={() => shareStory({ title: p.name, badge: p.kind.toUpperCase(), line: `${p.area} · ${p.address}`, photo: p.photo, hash: `#/place/${encodeURIComponent(p.id)}` })} aria-label="Partager en story"><Instagram size={17} /> Story</button><button className="iconbtn glass" onClick={() => share(p.name, `#/place/${encodeURIComponent(p.id)}`)} aria-label="Partager"><Share2 size={20} /></button></span>
        </div>
      </div>

      <div className="pad stack16 place-body">
        <div>
          <p className="muted small">{p.kind} · {p.area}</p>
          <h1 className="place-title">{p.name}</h1>
          <div className="pcard-stats big">
            <Stars rating={st.rating} size={15} />
            <span>{st.reviews} avis</span>
            <span>{st.likes} j'aime</span>
          </div>
        </div>

        <div className="place-actions">
          <button className={`btn ${st.liked ? 'btn-primary' : 'btn-ghost'}`} onClick={like} aria-pressed={st.liked}><Heart size={18} /> {st.liked ? 'Aimé' : 'J\'aime'}</button>
          <a className="btn btn-ghost" href={directions(p)} target="_blank" rel="noreferrer"><Navigation size={18} /> Itinéraire</a>
        </div>

        <p className="desc">{p.blurb}</p>

        <div className="facts">
          {p.when && <div className="fact"><CalendarDays size={20} /><div><b>{p.when}</b>{p.free && <span>Entrée libre</span>}</div></div>}
          <div className="fact"><MapPin size={20} /><div><b>{p.address ?? p.area}</b><span>{document.documentElement.lang === 'en' ? `${fmtKm(distanceKm(pos, p))} from you` : `À ${fmtKm(distanceKm(pos, p))} de toi`}</span></div></div>
        </div>

        <section className="stack12">
          <h2 className="sec-title">Avis</h2>
          {!socialReady() && <p className="hint">Les avis seront ouverts très bientôt.</p>}
          {socialReady() && (
            <div className="review-form">
              <div className="rate" role="radiogroup" aria-label="Ta note">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}><Star size={26} /></button>
                ))}
              </div>
              <textarea className="input area" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Raconte ta soirée ici (facultatif)" maxLength={600} aria-label="Ton commentaire" />
              <button className="btn btn-primary" disabled={!rating || busy} onClick={send}>{busy ? 'Envoi…' : mine ? 'Modifier mon avis' : 'Publier mon avis'}</button>
            </div>
          )}
          {reviews.length === 0 && socialReady() && <p className="hint">Personne n'a encore donné son avis. Sois le premier !</p>}
          {reviews.map((r) => (
            <div key={r.id} className="review">
              <div className="row between">
                <Link className="row gap8 rv-who" to={`/u/${r.userId}`}><Avatar u={users.find((x) => x.id === r.userId)} size={28} /><b>{r.author}</b></Link>
                <span className="hint">{timeAgo(r.createdAt)}</span>
              </div>
              <Stars rating={r.rating} />
              {r.body && <p>{r.body}</p>}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
