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
import { inNextDays, useAgenda } from '../data/agenda'
import { AgendaCard } from '../components/AgendaCard'
import { PostCard } from '../components/PostCard'
import { Avatar, Empty, Verified } from '../components/ui'

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()
  const users = useStore((s) => s.users)
  // Membres à découvrir : ceux qu'on ne suit pas encore d'abord, les plus suivis en tête.
  const members = useMemo(() => users.filter((u) => u.id !== me?.id).sort((a, b) => Number(me?.following.includes(a.id)) - Number(me?.following.includes(b.id)) || b.followers - a.followers).slice(0, 15), [users, me])

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
  const agenda = useAgenda()
  // À l'affiche : ce qui se passe cette semaine, les grands festivals d'abord.
  const soon = useMemo(() => agenda.filter((e) => inNextDays(e, 14)).sort((a, b) => Number(b.source === 'Bonjour Québec') - Number(a.source === 'Bonjour Québec')).slice(0, 12), [agenda])
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

      <section className="rail-sec" aria-label="Agenda de Montréal">
        <div className="pad row between sec-head">
          <div className="stack4"><span className="kicker">Sorties officielles</span><h2 className="sec-title">Agenda de Montréal</h2></div>
          <Link className="sec-link" to="/agenda">Tout voir</Link>
        </div>
        <div className="rail">{(soon.length >= 4 ? soon : [...soon, ...agenda.filter((x) => !soon.includes(x))].slice(0, 10)).map((e) => <AgendaCard key={e.id} e={e} />)}</div>
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

      {members.length > 0 && (
        <section className="rail-sec" aria-label="Membres">
          <div className="pad row between sec-head">
            <h2 className="sec-title">Membres à découvrir</h2>
          </div>
          <div className="rail people-rail">
            {members.map((u) => (
              <Link key={u.id} to={`/u/${u.id}`} className="person">
                <Avatar u={u} size={64} />
                <b>{u.name} <Verified u={u} /></b>
                <span>@{u.handle}</span>
              </Link>
            ))}
          </div>
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
