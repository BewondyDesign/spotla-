import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LocateFixed, MapPin } from 'lucide-react'
import { isHidden, toast, useMe, useStore } from '../data/store'
import { distanceKm, momentOf, VIBES } from '../data/util'
import type { Moment } from '../data/types'
import { EventCard, HeroCard } from '../components/EventCard'
import { StoriesBar } from '../components/Stories'
import { PostCard } from '../components/PostCard'
import { Empty } from '../components/ui'

const SEGS: { k: Exclude<Moment, 'past'>; l: string }[] = [
  { k: 'tonight', l: 'Ce soir' }, { k: 'today', l: 'Journée' }, { k: 'weekend', l: 'Week-end' }, { k: 'later', l: 'Plus tard' },
]

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const setPos = useStore((s) => s.setPos)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()
  const [tab, setTab] = useState<'events' | 'feed'>('events')
  const [seg, setSeg] = useState<Exclude<Moment, 'past'>>('tonight')
  const [free, setFree] = useState(false)
  const [near, setNear] = useState(false)
  const [vibe, setVibe] = useState<string | null>(null)

  const list = useMemo(() => {
    return events
      .filter((e) => !isHidden(e, me?.id ?? null))
      .filter((e) => momentOf(e) === seg)
      .filter((e) => !free || e.price === 0)
      .filter((e) => !near || distanceKm(pos, e) < 2)
      .filter((e) => !vibe || e.tags.includes(vibe))
      .sort((a, b) => Number(!!b.boosted) - Number(!!a.boosted) || a.start.localeCompare(b.start))
  }, [events, seg, free, near, vibe, pos, me?.id])

  const feed = useMemo(() => {
    const f = new Set([...(me?.following ?? []), me?.id])
    // Les comptes suivis d'abord, puis le reste (découverte).
    return [...posts].sort((a, b) => Number(f.has(b.authorId)) - Number(f.has(a.authorId)) || b.createdAt.localeCompare(a.createdAt))
  }, [posts, me])

  const locate = () => {
    if (!navigator.geolocation) return toast('Localisation indisponible')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); toast('Position mise à jour', 'Les distances sont calculées depuis ta position.') },
      () => toast('Localisation refusée', 'On reste sur le centre de Paris.'),
    )
  }

  const [hero, ...rest] = list
  return (
    <div className="scr">
      <header className="pad row between">
        <button className="loc" onClick={locate}>
          <small>Autour de toi</small>
          <b><MapPin size={16} /> {me?.city ?? 'Paris'} <LocateFixed size={14} className="muted" /></b>
        </button>
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
            <button className="chip" aria-pressed={near} onClick={() => setNear(!near)}>{'< 2 km'}</button>
            {VIBES.slice(0, 4).map((v) => <button key={v.k} className="chip" aria-pressed={vibe === v.k} onClick={() => setVibe(vibe === v.k ? null : v.k)}>{v.l}</button>)}
          </div>
          {hero ? (
            <div className="stack12 mt12">
              <HeroCard e={hero} />
              <div className="pad row between"><span className="sec-title">{list.length} événement{list.length > 1 ? 's' : ''}</span><Link className="sec-sub" to="/map">Voir sur la carte</Link></div>
              <div className="list">{rest.map((e) => <EventCard key={e.id} e={e} />)}</div>
            </div>
          ) : (
            <Empty>Rien pour ces filtres. Essaie d'en retirer un, ou <Link to="/create">publie ta propre soirée</Link>.</Empty>
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
