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
import { AutoVideo } from '../components/AutoVideo'
import { MK } from '../data/ambiance'
import { PostCard } from '../components/PostCard'
import { Avatar, Empty, Verified } from '../components/ui'

// Vidéo d'entête selon la saison : rues enneigées et lumières de Noël en hiver, foule de festival le reste de l'année.
const HERO_VIDS = (() => { const m = new Date().getMonth(); return m === 10 || m === 11 || m === 0 ? [3323, 29431] : m >= 5 && m <= 7 ? [14088, 13265] : [33901, 4187] })()
/** Heure de Montréal, pour saluer au bon moment. */
const mtlHour = () => Number(new Intl.DateTimeFormat('fr-CA', { hour: 'numeric', hour12: false, timeZone: 'America/Montreal' }).format(new Date()))
const evening = () => { const h = mtlHour(); return h >= 16 || h < 5 }
const greet = () => { const h = mtlHour(); return h >= 5 && h < 12 ? 'Bonjour' : h >= 12 && h < 18 ? 'Bel après-midi' : 'Bonsoir' }

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()
  const users = useStore((s) => s.users)
  const city = useStore((s) => s.city)
  // La communauté : qui sort ce soir d'abord, puis qui a partagé récemment. Pas de classement par abonnés.
  const community = useMemo(() => {
    const tonight = events.filter((e) => momentOf(e) === 'tonight' || momentOf(e) === 'today')
    const lastPost = (uid: string) => posts.filter((p) => p.authorId === uid).reduce((m, p) => (p.createdAt > m ? p.createdAt : m), '')
    return users.filter((u) => u.id !== me?.id).map((u) => {
      const ev = tonight.find((e) => e.going.includes(u.id) || e.hostId === u.id)
      const last = lastPost(u.id)
      const status = ev ? `Sort ce soir · ${ev.venue}` : last && Date.now() - Date.parse(last) < 3 * 864e5 ? 'A partagé un moment' : u.city ? `De ${u.city}` : 'Membre SpotLa'
      return { u, ev, status, score: (ev ? 2 : 0) + (last ? 1 : 0) }
    }).sort((a, b) => b.score - a.score).slice(0, 15)
  }, [users, events, posts, me])

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
  const weekCount = useMemo(() => agenda.filter((e) => inNextDays(e, 7)).length, [agenda])
  // Activités à faire : cette semaine et les deux suivantes, les plus proches de toi d'abord.
  const soon = useMemo(() => agenda.filter((e) => inNextDays(e, 14)).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b)).slice(0, 12), [agenda, pos])
  // Un seul Top 10 : on pioche à tour de rôle dans chaque catégorie (clubs, bars, fêtes, soirées, gourmand).
  const top10 = useMemo(() => {
    const order = ['club', 'bar', 'fetes', 'soiree', 'gastro']
    const by = order.map((k) => catalog.filter((x) => x.category === k).sort((a, b) => a.rank - b.rank))
    const out: typeof catalog = []
    for (let i = 0; out.length < 10 && by.some((l) => l[i]); i++) for (const l of by) if (l[i] && out.length < 10) out.push(l[i])
    return out
  }, [catalog])
  return (
    <div className="scr home-scr">
      <header className="home-hero">
        <AutoVideo className="hero-vid" src={MK(HERO_VIDS[new Date().getDate() % HERO_VIDS.length])} />
        <div className="hero-shade" />
        <div className="hero-top">
          <span className="wordmark light">spotla<i /></span>
          <div className="row gap8">
            <Link to="/map" className="iconbtn glass sm" aria-label="Rechercher un lieu"><Search size={19} /></Link>
            <Link to="/notifs" className="iconbtn glass sm bell" aria-label="Activité"><Bell size={19} />{unread > 0 && <i>{unread}</i>}</Link>
          </div>
        </div>
        <div className="hero-copy">
          <p className="hero-hi">{greet()}{me?.name ? `, ${me.name.split(' ')[0]}` : ''}</p>
          <h1 className="hero-h">{evening() ? <>Qu'est-ce qu'on fait <em>ce soir</em> ?</> : <>Qu'est-ce qu'on fait <em>aujourd'hui</em> ?</>}</h1>
          <LocationButton pill />
          <div className="hero-stats">
{list.length > 0
              ? <Link to="/map"><b>{list.length}</b> {list.length > 1 ? 'soirées' : 'soirée'} {evening() ? 'ce soir' : "aujourd'hui"}</Link>
              : <Link to="/map"><b>{catalog.length}</b> lieux à découvrir</Link>}
            {weekCount > 0 && <Link to="/agenda"><b>{weekCount}</b> {weekCount > 1 ? 'activités' : 'activité'} cette semaine</Link>}
          </div>
        </div>
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
          <div className="stack4"><span className="kicker">Près de toi</span><h2 className="sec-title">Activités à faire à {city}</h2></div>
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

      {community.length > 0 && (
        <section className="rail-sec" aria-label="Communauté">
          <div className="pad stack4 sec-head">
            <span className="kicker">Ta communauté</span>
            <h2 className="sec-title">Qui sort ce soir ?</h2>
          </div>
          <div className="rail people-rail">
            {community.map(({ u, ev, status }) => (
              <Link key={u.id} to={`/u/${u.id}`} className={`person${ev ? ' out' : ''}`}>
                <span className="person-av"><Avatar u={u} size={60} />{ev && <i className="person-dot" aria-hidden="true" />}</span>
                <b>{u.kind === 'business' ? u.name : u.name.split(' ')[0]} <Verified u={u} /></b>
                <span>{status}</span>
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
