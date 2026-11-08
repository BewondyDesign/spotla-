import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Sparkles } from 'lucide-react'
import type { SpotEvent } from '../data/types'
import { goingCount, useStore } from '../data/store'
import { distanceKm, fmtKm, fmtTime, isLive, startsIn } from '../data/util'
import { Art, LiveBadge, PriceBadge, VisBadge } from './ui'

export function EventCard({ e }: { e: SpotEvent }) {
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  const live = isLive(e)
  return (
    <button className="card" onClick={() => nav(`/event/${e.id}`)}>
      <div className="cover"><Art colors={e.colors} word={e.vibe} /></div>
      <div className="card-body">
        <h4>{e.title}</h4>
        <div className="meta">
          <span><Clock size={12} /> {fmtTime(e.start)}</span>
          <span><MapPin size={12} /> {fmtKm(distanceKm(pos, e))} · {e.area}</span>
        </div>
        <div className="foot">
          <PriceBadge e={e} />
          <VisBadge e={e} />
          {live && <LiveBadge />}
          {e.boosted && <span className="badge b-boost"><Sparkles size={11} />Sponsorisé</span>}
          <span className="going-n">{goingCount(e)} y vont</span>
        </div>
      </div>
    </button>
  )
}

export function HeroCard({ e }: { e: SpotEvent }) {
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  return (
    <button className="cover hero" onClick={() => nav(`/event/${e.id}`)}>
      <Art colors={e.colors} word={e.vibe} big />
      <div className="shade" />
      <div className="row gap6">
        <PriceBadge e={e} />
        <VisBadge e={e} />
        {isLive(e) ? <LiveBadge /> : <span className="badge b-soon">{startsIn(e)}</span>}
      </div>
      <div>
        <h3>{e.title}</h3>
        <div className="meta">{e.venue} · {fmtKm(distanceKm(pos, e))} · {fmtTime(e.start)} – {fmtTime(e.end)} · {goingCount(e)} y vont</div>
      </div>
    </button>
  )
}
