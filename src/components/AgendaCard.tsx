import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { agendaVideo, fmtRange, isOnNow, type AgendaItem } from '../data/agenda'
import { AutoVideo } from './AutoVideo'
import { useStore } from '../data/store'
import { distanceKm, fmtKm } from '../data/util'

/** Carte d'une sortie de l'agenda (festival ou événement de la Ville). */
export function AgendaCard({ e, wide }: { e: AgendaItem; wide?: boolean }) {
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  const vid = agendaVideo(e)
  return (
    <article className={`acard ${wide ? 'wide' : ''}`} onClick={() => nav(`/agenda/${encodeURIComponent(e.id)}`)}>
      {vid ? <AutoVideo className="acard-bg" src={vid} poster={e.image} /> : <img className="acard-bg" src={e.image} alt="" loading="lazy" />}
      <div className="acard-top">
        {isOnNow(e) && <span className="acard-pill now">En cours</span>}
        <span className="acard-pill">{e.free ? 'Gratuit' : 'Payant'}</span>
      </div>
      <div className="acard-over">
        <span className="acard-type">{e.type}</span>
        <h3>{e.title}</h3>
        <p><CalendarDays size={13} /> {fmtRange(e.start, e.end)}{e.tbc ? ' (à confirmer)' : ''}</p>
        <p><MapPin size={13} /> {e.venue || e.area} · {fmtKm(distanceKm(pos, e))}</p>
      </div>
    </article>
  )
}
