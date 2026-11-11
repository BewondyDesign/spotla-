import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { isHidden, useMe, useStore } from '../data/store'
import { distanceKm, momentOf } from '../data/util'
import { EventCard } from '../components/EventCard'
import { StoriesBar } from '../components/Stories'
import { LocationButton } from '../components/Location'
import { PlaceCard } from '../components/PlaceCard'
import { useCatalog } from '../data/places'
import { PostCard } from '../components/PostCard'
import { Empty } from '../components/ui'

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()

  const list = useMemo(() => events
    .filter((e) => !isHidden(e, me?.id ?? null))
    .filter((e) => momentOf(e) === 'tonight' || momentOf(e) === 'today')
    .filter((e) => distanceKm(pos, e) <= radius)
    .sort((a, b) => Number(!!b.boosted) - Number(!!a.boosted) || a.start.localeCompare(b.start)), [events, pos, radius, me?.id])

  const feed = useMemo(() => {
    const f = new Set([...(me?.following ?? []), me?.id])
    // Les comptes suivis d'abord, puis le reste (découverte).
    return [...posts].sort((a, b) => Number(f.has(b.authorId)) - Number(f.has(a.authorId)) || b.createdAt.localeCompare(a.createdAt))
  }, [posts, me])

  const catalog = useCatalog()
  // Un seul Top 10 : on pioche à tour de rôle dans chaque catégorie (clubs, bars, fêtes, soirées, gourmand).
  const top10 = useMemo(() => {
    const order = ['club', 'bar', 'fetes', 'soiree', 'gastro']
    const by = order.map((k) => catalog.filter((x) => x.category === k).sort((a, b) => a.rank - b.rank))
    const out: typeof catalog = []
    for (let i = 0; out.length < 10 && by.some((l) => l[i]); i++) for (const l of by) if (l[i] && out.length < 10) out.push(l[i])
    return out
  }, [catalog])
  return (
    <div className="scr">
      <header className="pad home-head">
        <Link to="/map" className="iconbtn soft" aria-label="Rechercher un lieu"><Search size={20} /></Link>
        <LocationButton />
        <Link to="/notifs" className="iconbtn soft bell" aria-label="Activité"><Bell size={20} />{unread > 0 && <i>{unread}</i>}</Link>
      </header>

      <StoriesBar />

      <section className="rail-sec" aria-label="Top 10 SpotLa">
        <div className="pad rail-head center">
          <span className="kicker">Sélection SpotLa</span>
          <h2 className="sec-title big">Le Top 10 <em>du moment</em></h2>
        </div>
        <div className="rail">{top10.map((p, i) => <PlaceCard key={p.id} p={{ ...p, rank: i + 1 }} />)}</div>
      </section>

      {list.length > 0 && (
        <section className="rail-sec" aria-label="Ce soir près de toi">
          <div className="pad row between sec-head">
            <h2 className="sec-title">Ce soir près de toi</h2>
            <Link className="sec-link" to="/map">Carte</Link>
          </div>
          <div className="rail ev-rail">{list.slice(0, 8).map((e) => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}

      <section aria-label="Publications">
        <div className="pad row between sec-head">
          <h2 className="sec-title">Publications</h2>
          <Link className="sec-link" to="/create?mode=post">Publier</Link>
        </div>
        <div className="feed">
          {feed.length === 0 ? <Empty>Personne n'a encore publié. <Link to="/create?mode=post">Sois le premier</Link>.</Empty> : feed.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  )
}
