import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Navigation, Share2, Ticket } from 'lucide-react'
import { agendaVideo, fmtRange, useAgenda } from '../data/agenda'
import { Gallery } from '../components/Gallery'
import { useStore } from '../data/store'
import { distanceKm, fmtKm } from '../data/util'
import { share } from '../components/share'

export function AgendaDetail() {
  const { id = '' } = useParams()
  const eid = decodeURIComponent(id)
  const nav = useNavigate()
  const pos = useStore((s) => s.pos)
  const items = useAgenda()
  const e = items.find((x) => x.id === eid)
  if (!e) return <div className="scr"><div className="pad"><button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button><p className="empty">Chargement de l'agenda…</p></div></div>
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
  return (
    <div className="scr no-tab place-scr">
      <div className="place-hero">
        <Gallery items={[agendaVideo(e), e.image].filter((x): x is string => !!x)} />
        <div className="ev-top">
          <button className="iconbtn glass" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button>
          <button className="iconbtn glass" onClick={() => share(e.title, `#/agenda/${encodeURIComponent(e.id)}`)} aria-label="Partager"><Share2 size={20} /></button>
        </div>
      </div>
      <div className="pad stack16 place-body">
        <div className="stack8">
          <p className="muted small">{e.type}{e.area ? ` · ${e.area}` : ''}</p>
          <h1 className="place-title">{e.title}</h1>
        </div>
        <div className="place-actions">
          {e.url && <a className="btn btn-primary" href={e.url} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Site officiel</a>}
          <a className="btn btn-ghost" href={maps} target="_blank" rel="noreferrer"><Navigation size={18} /> Itinéraire</a>
        </div>
        {e.description && <p className="desc">{e.description}</p>}
        <div className="facts">
          <div className="fact"><CalendarDays size={20} /><div><b>{fmtRange(e.start, e.end)}</b>{e.tbc && <span>Dates à confirmer par l'organisateur</span>}</div></div>
          <div className="fact"><Ticket size={20} /><div><b>{e.free ? 'Gratuit' : 'Payant'}</b>{e.cost && e.cost !== 'Gratuit' && e.cost !== 'Payant' && <span>{e.cost}</span>}</div></div>
          <div className="fact"><MapPin size={20} /><div><b>{e.venue || e.area}</b>{e.address && <span>{e.address}</span>}<span>À {fmtKm(distanceKm(pos, e))} de toi</span></div></div>
        </div>
        <p className="hint">Source : {e.source === 'Ville de Montréal' ? 'Ville de Montréal, calendrier montreal.ca (données ouvertes, licence CC BY 4.0)' : 'Bonjour Québec (Gouvernement du Québec) et le site officiel de l\'événement'}. Vérifie les détails sur le site officiel avant de te déplacer.</p>
      </div>
    </div>
  )
}
