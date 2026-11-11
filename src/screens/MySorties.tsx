import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { CalendarCheck, Clock, Heart, Hourglass, Star } from 'lucide-react'
import { useMe, useStore } from '../data/store'
import { fmtDay, fmtTime, startsIn } from '../data/util'
import { useCatalog, userPassport, type Review } from '../data/places'
import { CATALOG } from '../data/catalog'
import { EventCard } from '../components/EventCard'
import { Empty } from '../components/ui'
import { CAT_ICON, Stars } from '../components/PlaceCard'

/** « Mes sorties » : ce que je fais bientôt, ce que j'ai gardé de côté, ce que j'ai déjà vécu. */
export function MySorties() {
  const me = useMe()!
  const mine = useStore(useShallow((s) => s.events.filter((e) => e.hostId === me.id || e.going.includes(me.id) || e.requests.includes(me.id) || e.accepted.includes(me.id))))
  const [tab, setTab] = useState<'soon' | 'saved' | 'past'>('soon')
  const [pass, setPass] = useState<{ liked: string[]; reviews: Review[] }>({ liked: [], reviews: [] })
  const catalog = useCatalog()
  useEffect(() => { userPassport(me.id).then(setPass) }, [me.id])

  const now = Date.now()
  const soon = useMemo(() => mine.filter((e) => Date.parse(e.end) >= now).sort((a, b) => a.start.localeCompare(b.start)), [mine, now])
  const past = useMemo(() => mine.filter((e) => Date.parse(e.end) < now).sort((a, b) => b.start.localeCompare(a.start)), [mine, now])
  const saved = useMemo(() => pass.liked.map((id) => catalog.find((c) => c.id === id) ?? CATALOG.find((c) => c.id === id)).filter((x) => !!x), [pass, catalog])
  const next = soon[0]
  const status = (id: string) => {
    const e = mine.find((x) => x.id === id)!
    return e.hostId === me.id ? 'Tu organises' : e.requests.includes(me.id) ? 'Demande envoyée' : 'Tu y vas'
  }

  return (
    <div className="scr">
      <div className="pad stack16">
        <h1 className="h2">Mes sorties</h1>
        {next && (
          <Link to={`/event/${next.id}`} className="next-out">
            <span className="kicker">Prochaine sortie · {startsIn(next)}</span>
            <b>{next.title}</b>
            <span><Clock size={14} /> {fmtDay(next.start)} · {fmtTime(next.start)} · {next.venue}</span>
          </Link>
        )}
        <nav className="tabs2 pill" role="tablist">
          <button role="tab" aria-selected={tab === 'soon'} className={tab === 'soon' ? 'on' : ''} onClick={() => setTab('soon')}>{`À venir (${soon.length})`}</button>
          <button role="tab" aria-selected={tab === 'saved'} className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>{`Enregistrés (${saved.length})`}</button>
          <button role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? 'on' : ''} onClick={() => setTab('past')}>Passées</button>
        </nav>
      </div>

      {tab === 'soon' && (soon.length === 0
        ? <Empty><CalendarCheck size={28} /><br />Rien de prévu pour l'instant. <Link to="/">Trouve une sortie</Link> et touche « J'y vais ».</Empty>
        : <div className="list mt12">{soon.map((e) => <div key={e.id} className="stack4"><span className="pad out-status"><Hourglass size={12} /> {status(e.id)}</span><EventCard e={e} /></div>)}</div>)}

      {tab === 'saved' && (saved.length === 0
        ? <Empty><Heart size={28} /><br />Touche le cœur sur un lieu pour le garder ici.</Empty>
        : (
          <div className="pad prof-places">
            {saved.map((p) => {
              const Icon = CAT_ICON[p!.category]
              const r = pass.reviews.find((x) => x.placeId === p!.id)
              return (
                <Link key={p!.id} to={`/place/${encodeURIComponent(p!.id)}`} className={`pplace c-${p!.category}`}>
                  {p!.photo ? <img src={p!.photo} alt="" /> : <Icon className="pplace-ic" size={40} strokeWidth={1.2} aria-hidden="true" />}
                  <div className="pplace-txt"><b>{p!.name}</b><span>{p!.area}</span>{r && <Stars rating={r.rating} size={11} />}</div>
                </Link>
              )
            })}
          </div>
        ))}

      {tab === 'past' && (past.length === 0
        ? <Empty><Star size={28} /><br />Tes sorties passées apparaîtront ici.</Empty>
        : <div className="list mt12">{past.map((e) => <EventCard key={e.id} e={e} />)}</div>)}
    </div>
  )
}
