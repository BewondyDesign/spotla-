import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EXPLORE, matchAgenda, matchEvent } from '../data/explore'
import { useCatalog } from '../data/places'
import { useAgenda } from '../data/agenda'
import { useVenues } from '../data/venues'
import { isHidden, useStore } from '../data/store'
import { distanceKm, momentOf } from '../data/util'
import { PlaceCard } from '../components/PlaceCard'
import { EventCard } from '../components/EventCard'
import { AgendaCard } from '../components/AgendaCard'
import { VenueCard } from '../components/VenueCard'
import { useLang } from '../data/i18n'

/** Rangée de catégories (accueil et haut de la page catégorie). */
export function CategoryChips({ active }: { active?: string }) {
  const en = useLang((s) => s.lang) === 'en'
  const box = useRef<HTMLDivElement>(null)
  // La catégorie ouverte est toujours visible dans la rangée.
  useEffect(() => { box.current?.querySelector<HTMLElement>('.cat-chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }) }, [active])
  return (
    <div className="cat-chips" role="list" ref={box}>
      {EXPLORE.map((c) => {
        const Icon = c.icon
        return (
          <Link key={c.k} role="listitem" to={`/explore/${c.k}`} replace={!!active} className={`cat-chip${active === c.k ? ' on' : ''}`}>
            <span className="cat-ic"><Icon size={20} /></span>
            <span>{en ? c.en : c.l}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Explore() {
  const { k } = useParams()
  const nav = useNavigate()
  const c = EXPLORE.find((x) => x.k === k) ?? EXPLORE[0]
  const en = useLang((s) => s.lang) === 'en'
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const meId = useStore((s) => s.meId)
  const events = useStore((s) => s.events)
  const catalog = useCatalog()
  const agenda = useAgenda()
  const { venues } = useVenues(pos, radius)
  const near = <T extends { lat: number; lng: number }>(a: T, b: T) => distanceKm(pos, a) - distanceKm(pos, b)

  const places = useMemo(() => (c.place ? catalog.filter(c.place).sort(near) : []), [catalog, c, pos]) // eslint-disable-line react-hooks/exhaustive-deps
  const evs = useMemo(() => events.filter((e) => !isHidden(e, meId) && momentOf(e) !== 'past' && matchEvent(c, e)).sort((a, b) => a.start.localeCompare(b.start)), [events, c, meId])
  const acts = useMemo(() => agenda.filter((a) => matchAgenda(c, a)).sort(near).slice(0, 20), [agenda, c, pos]) // eslint-disable-line react-hooks/exhaustive-deps
  const others = useMemo(() => (c.venue ? venues.filter(c.venue).filter((v) => !places.some((p) => p.name === v.name)).slice(0, 25) : []), [venues, c, places])
  const Icon = c.icon
  const empty = !places.length && !evs.length && !acts.length && !others.length

  return (
    <div className="scr no-tab explore-scr">
      <header className="pad row gap10 explore-head">
        <button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
        <span className="cat-ic big"><Icon size={22} /></span>
        <div className="grow stack4"><h1 className="sec-title">{en ? c.en : c.l}</h1><span className="muted small">{en ? 'Near you' : 'Près de toi'}</span></div>
      </header>
      <CategoryChips active={c.k} />

      {places.length > 0 && (
        <section className="rail-sec">
          <div className="pad sec-head"><h2 className="sec-title">{en ? 'Our picks' : 'Nos adresses'}</h2></div>
          <div className="rail">{places.map((p) => <PlaceCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {evs.length > 0 && (
        <section className="rail-sec">
          <div className="pad sec-head"><h2 className="sec-title">{en ? 'Posted by members' : 'Sorties des membres'}</h2></div>
          <div className="rail ev-rail">{evs.map((e) => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}
      {acts.length > 0 && (
        <section className="rail-sec">
          <div className="pad sec-head"><h2 className="sec-title">{en ? 'In the agenda' : 'À l\'agenda'}</h2></div>
          <div className="pad stack12">{acts.map((a) => <AgendaCard key={a.id} e={a} wide />)}</div>
        </section>
      )}
      {others.length > 0 && (
        <section className="rail-sec">
          <div className="pad sec-head"><h2 className="sec-title">{en ? 'More places around you' : 'Autres lieux autour de toi'}</h2></div>
          <div className="pad stack8">{others.map((v) => <VenueCard key={v.id} v={v} />)}</div>
        </section>
      )}
      {empty && <p className="pad empty">{en ? 'Nothing in this category near you for now.' : 'Rien dans cette catégorie près de toi pour l\'instant.'}</p>}
    </div>
  )
}
