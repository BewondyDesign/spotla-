import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { isHidden, useMe, useStore } from '../data/store'
import { distanceKm, momentOf, VIBES } from '../data/util'
import type { Moment } from '../data/types'
import { EventCard, HeroCard } from '../components/EventCard'
import { StoriesBar } from '../components/Stories'
import { LocationButton } from '../components/Location'
import { VenueCard } from '../components/VenueCard'
import { useVenues } from '../data/venues'
import { PostCard } from '../components/PostCard'
import { Empty } from '../components/ui'

const SEGS: { k: Exclude<Moment, 'past'>; l: string }[] = [
  { k: 'tonight', l: 'Ce soir' }, { k: 'today', l: 'Journée' }, { k: 'weekend', l: 'Week-end' }, { k: 'later', l: 'Plus tard' },
]

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const city = useStore((s) => s.city)
  const geo = useStore((s) => s.geo)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()
  const [tab, setTab] = useState<'events' | 'feed'>('events')
  const [seg, setSeg] = useState<Exclude<Moment, 'past'>>('tonight')
  const [free, setFree] = useState(false)
  const [vibe, setVibe] = useState<string | null>(null)

  const list = useMemo(() => {
    return events
      .filter((e) => !isHidden(e, me?.id ?? null))
      .filter((e) => momentOf(e) === seg)
      .filter((e) => !free || e.price === 0)
      .filter((e) => distanceKm(pos, e) <= radius)
      .filter((e) => !vibe || e.tags.includes(vibe))
      .sort((a, b) => Number(!!b.boosted) - Number(!!a.boosted) || a.start.localeCompare(b.start))
  }, [events, seg, free, vibe, pos, radius, me?.id])

  const feed = useMemo(() => {
    const f = new Set([...(me?.following ?? []), me?.id])
    // Les comptes suivis d'abord, puis le reste (découverte).
    return [...posts].sort((a, b) => Number(f.has(b.authorId)) - Number(f.has(a.authorId)) || b.createdAt.localeCompare(a.createdAt))
  }, [posts, me])

  const { venues } = useVenues(pos, radius)
  const [hero, ...rest] = list
  return (
    <div className="scr">
      <header className="pad row between">
        <LocationButton />
        <Link to="/notifs" className="iconbtn bell" aria-label="Activité"><Bell size={20} />{unread > 0 && <i>{unread}</i>}</Link>
      </header>

      <StoriesBar />

      <div className="pad">
        <div className="tabs2" role="tablist">
          <button role="tab" aria-selected={tab === 'events'} onClick={() => setTab('events')}>Événements</button>
          <button role="tab" aria-selected={tab === 'feed'} onClick={() => setTab('feed')}>Fil d'actu</button>
        </div>
      </div>

      {tab === 'events' ? (
        <>
          <div className="pad stack12">
            <h1 className="title-xl">{seg === 'tonight' ? <>Ça bouge <em>ce soir</em></> : SEGS.find((s) => s.k === seg)!.l}</h1>
            <div className="seg" role="group" aria-label="Moment">
              {SEGS.map((s) => <button key={s.k} aria-pressed={seg === s.k} onClick={() => setSeg(s.k)}>{s.l}</button>)}
            </div>
          </div>
          <div className="chips">
            <button className="chip" aria-pressed={free} onClick={() => setFree(!free)}>Gratuit</button>
            {VIBES.slice(0, 4).map((v) => <button key={v.k} className="chip" aria-pressed={vibe === v.k} onClick={() => setVibe(vibe === v.k ? null : v.k)}>{v.l}</button>)}
          </div>
          {hero ? (
            <div className="stack12 mt12">
              <HeroCard e={hero} />
              <div className="pad row between"><span className="sec-title">{list.length} événement{list.length > 1 ? 's' : ''}</span><Link className="sec-sub" to="/map">Voir sur la carte</Link></div>
              <div className="list">{rest.map((e) => <EventCard key={e.id} e={e} />)}</div>
            </div>
          ) : (
            <Empty>
              {geo === 'denied' && <><b>Active ta localisation</b> pour voir ce qui se passe autour de toi, ou touche le nom de la ville en haut pour en choisir une.<br /><br /></>}
              Rien à moins de {radius} km de {city} pour l'instant. Agrandis le rayon en touchant la ville en haut, ou <Link to="/create">publie ta propre soirée</Link>.
            </Empty>
          )}
          {venues.length > 0 && (
            <section className="stack12 mt16">
              <div className="pad"><h2 className="sec-title">Lieux pour sortir autour de toi</h2><p className="sec-sub nolink">Bars, clubs et pubs à moins de {Math.min(radius, 15)} km · OpenStreetMap</p></div>
              <div className="list">{venues.slice(0, 12).map((v) => <VenueCard key={v.id} v={v} />)}</div>
              <div className="pad"><Link className="sec-sub" to="/map">Voir les {venues.length} lieux sur la carte</Link></div>
            </section>
          )}
        </>
      ) : (
        <div className="feed">
          {feed.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}
