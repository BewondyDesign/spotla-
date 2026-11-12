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
import { inNextDays, isOnNow, type AgendaItem, useAgenda, useAgendaPending } from '../data/agenda'
import { AgendaCard } from '../components/AgendaCard'
import { SkelRail } from '../components/Skeleton'
import { Avatar, Verified } from '../components/ui'
import type { Category } from '../data/catalog'
import type { SpotEvent } from '../data/types'
import { LangSwitch, useLang, useT } from '../data/i18n'
import { CategoryChips } from './Explore'
import { PART_WHEN, useDayInfo, type DayPart, type Light } from '../data/daypart'
import { likesAgenda, likesEvent, likesPlace, lovedFirst } from '../data/tastes'

// Photo d'entête choisie automatiquement selon la saison à Montréal (temps des fêtes, hiver, printemps, été, automne)
// et la lumière du moment : matin, plein jour, coucher du soleil, nuit. Aucune photo avec des enfants.
type Season = 'fetes' | 'hiver' | 'printemps' | 'ete' | 'automne'
type Shot = 'matin' | 'jour' | 'soir' | 'nuit'
const HERO: Record<Season, Record<Shot, string>> = {
  fetes: { matin: '1670513734654-b171df8802d9', jour: '1781195348267-4dd426296e82', soir: '1708184136688-8a0c58fcc01a', nuit: '1702214957911-03f594aa4181' },
  hiver: { matin: '1670513734929-fc5ae6e37e64', jour: '1612196755540-602022b439cc', soir: '1670513734943-72b3f145034e', nuit: '1643915868532-0ba6a4c1be1b' },
  printemps: { matin: '1525919148070-2252e96e4c44', jour: '1753013811459-ad077dbf3ef6', soir: '1715196947436-ece6a0882618', nuit: '1670722469904-0c5601c9157c' },
  ete: { matin: '1587127457386-1ab504456133', jour: '1581408864626-43a5394853de', soir: '1723921027116-c6bb4914a0fb', nuit: '1730860763372-ae1ef7d8d538' },
  automne: { matin: '1599856576425-c1c986570c2f', jour: '1697978235636-e3c4d9898983', soir: '1570195823626-db54fe9a8f16', nuit: '1612231868724-f5192a66c84a' },
}
const seasonOf = (d = new Date()): Season => {
  const md = Number(new Intl.DateTimeFormat('en-CA', { month: '2-digit', day: '2-digit', timeZone: 'America/Montreal' }).format(d).replace(/\D/g, ''))
  if (md >= 1201 || md <= 106) return 'fetes'
  if (md <= 320) return 'hiver'
  if (md <= 620) return 'printemps'
  if (md <= 922) return 'ete'
  return 'automne'
}
const shotOf = (light: Light, hour: number): Shot => light === 'noir' ? 'nuit' : light === 'aube' ? 'matin' : light === 'crepuscule' ? 'soir' : hour < 11 ? 'matin' : 'jour'
const heroPhoto = (light: Light, hour: number) => `https://images.unsplash.com/photo-${HERO[seasonOf()][shotOf(light, hour)]}?auto=format&fit=crop&w=900&h=1100&q=70`
/** Heure de Montréal, pour saluer au bon moment. */
const hourIn = (d: Date) => Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Montreal' }).format(d)) % 24
const mtlHour = () => hourIn(new Date())
const greet = (en: boolean, part: DayPart) => part === 'matin' ? (en ? 'Good morning' : 'Bonjour') : part === 'aprem' ? (en ? 'Good afternoon' : 'Bel après-midi') : (en ? 'Good evening' : 'Bonsoir')
/** « quand » en toutes lettres, FR puis EN. */
const WHEN: Record<Slot, [string, string]> = { now: ['aujourd\'hui', 'today'], aprem: ['cet après-midi', 'this afternoon'], soir: ['ce soir', 'tonight'], weekend: ['ce week-end', 'this weekend'] }

type Slot = 'now' | 'aprem' | 'soir' | 'weekend'
const H = 3600_000
const ymd = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Montreal' })
/** Samedi et dimanche qui viennent (ou ce week-end si on y est), au format AAAA-MM-JJ. */
const weekendDays = () => { const d = new Date(); const dow = d.getDay(); const sat = new Date(d.getTime() + ((6 - dow + 7) % 7) * 864e5); if (dow === 0) sat.setTime(d.getTime() - 864e5); return [ymd(sat), ymd(new Date(sat.getTime() + 864e5))] }
/** Une soirée tombe-t-elle dans le créneau choisi ? */
function inSlot(e: SpotEvent, slot: Slot, now = Date.now()) {
  const s = Date.parse(e.start), end = Date.parse(e.end)
  if (end < now) return false
  if (slot === 'now') return s <= now + 3 * H
  const day = ymd(new Date(s)), today = ymd(new Date(now)), h = hourIn(new Date(s))
  if (slot === 'aprem') return (day === today && h >= 11 && h < 18) || (s <= now && end > now && mtlHour() < 18)
  if (slot === 'soir') return (day === today && h >= 17) || (s <= now && end > now && mtlHour() >= 17) || momentOf(e) === 'tonight'
  return weekendDays().includes(day)
}
const agendaIn = (a: AgendaItem, slot: Slot) => slot === 'weekend' ? weekendDays().some((d) => a.start <= d && a.end >= d) : isOnNow(a)
/** Les lieux qui collent au créneau : activités le jour, bars et clubs le soir. */
const SLOT_CATS: Record<Slot, Category[]> = { now: ['jeux'], aprem: ['jeux'], soir: ['bar', 'club', 'soiree', 'jeux'], weekend: ['jeux', 'fetes', 'gastro', 'soiree'] }
const SLOT_TITLE: Record<Slot, [string, string, string, string]> = {
  now: ['Dans les 3 prochaines heures', 'Ça commence bientôt', 'In the next 3 hours', 'Starting soon'], aprem: ['Cet après-midi', 'Les sorties de l\'après-midi', 'This afternoon', 'Afternoon plans'],
  soir: ['Ce soir', 'Les soirées près de toi', 'Tonight', 'Nights out near you'], weekend: ['Ce week-end', 'Les sorties du week-end', 'This weekend', 'Weekend plans'],
}

export function Home() {
  const events = useStore((s) => s.events)
  const posts = useStore((s) => s.posts)
  const pos = useStore((s) => s.pos)
  const radius = useStore((s) => s.radius)
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  const me = useMe()
  const day = useDayInfo()
  // Pas de filtre à choisir : l'accueil suit l'heure tout seul (matin, après-midi, soir, nuit).
  const slot = (day.part === 'matin' ? 'now' : day.part === 'aprem' ? 'aprem' : 'soir') as Slot
  const when = PART_WHEN[day.part]
  const users = useStore((s) => s.users)
  const storeTastes = useStore((s) => s.vibes)
  const tastes = me?.vibes?.length ? me.vibes : storeTastes
  const t = useT()
  const en = useLang((s) => s.lang) === 'en'
  const city = useStore((s) => s.city)
  // La communauté : qui sort ce soir d'abord, puis qui a partagé récemment. Pas de classement par abonnés.
  const community = useMemo(() => {
    const tonight = events.filter((e) => momentOf(e) !== 'past' && momentOf(e) !== 'later')
    const lastPost = (uid: string) => posts.filter((p) => p.authorId === uid).reduce((m, p) => (p.createdAt > m ? p.createdAt : m), '')
    return users.filter((u) => u.id !== me?.id).map((u) => {
      const ev = tonight.find((e) => e.going.includes(u.id) || e.hostId === u.id)
      const last = lastPost(u.id)
      const status = ev ? `${en ? 'Going' : 'Y va'} · ${ev.venue}` : last && Date.now() - Date.parse(last) < 3 * 864e5 ? (en ? 'Shared a moment' : 'A partagé un moment') : u.city ? `${en ? 'From' : 'De'} ${u.city}` : (en ? 'SpotLa member' : 'Membre SpotLa')
      return { u, ev, status, score: (ev ? 2 : 0) + (last ? 1 : 0) }
    }).sort((a, b) => b.score - a.score).slice(0, 15)
  }, [users, events, posts, me, en])

  const list = useMemo(() => events
    .filter((e) => !isHidden(e, me?.id ?? null))
    .filter((e) => inSlot(e, slot))
    .filter((e) => distanceKm(pos, e) <= radius)
    // Ce qui commence le plus tôt d'abord : l'app répond à « on fait quoi, là ? ».
    .sort((a, b) => a.start.localeCompare(b.start) || Number(!!b.boosted) - Number(!!a.boosted))
    , [events, pos, radius, me?.id, slot])
  // Ce que la personne aime passe devant, le reste suit.
  const listForYou = useMemo(() => lovedFirst(list, (e) => likesEvent(tastes, e)), [list, tastes])


  const catalog = useCatalog()
  const agenda = useAgenda()
  const agendaPending = useAgendaPending()
  // Activités à faire : cette semaine et les deux suivantes, les plus proches de toi d'abord.
  const soon = useMemo(() => {
    const inside = agenda.filter((e) => agendaIn(e, slot)).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b))
    const later = agenda.filter((e) => !inside.includes(e) && inNextDays(e, 14)).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b))
    // Jamais deux fois la même image dans la rangée.
    const seen = new Set<string>()
    return lovedFirst([...inside, ...later], (a) => likesAgenda(tastes, a)).filter((e) => { const k = e.image; if (seen.has(k)) return false; seen.add(k); return true }).slice(0, 12)
  }, [agenda, pos, slot, tastes])
  // « Ce week-end » : sorties et activités de samedi et dimanche, sans répéter ce qui est déjà plus haut.
  const weekendEvents = useMemo(() => {
    const [sat, sun] = weekendDays()
    return lovedFirst(events.filter((e) => !isHidden(e, me?.id ?? null) && distanceKm(pos, e) <= radius && !list.includes(e)
      && [sat, sun].includes(ymd(new Date(e.start)))).sort((a, b) => a.start.localeCompare(b.start)), (e) => likesEvent(tastes, e)).slice(0, 8)
  }, [events, me?.id, pos, radius, list, tastes])
  const weekendAgenda = useMemo(() => {
    const seen = new Set(soon.map((e) => e.image))
    return lovedFirst(agenda.filter((e) => agendaIn(e, 'weekend') && !soon.includes(e)).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b)), (a) => likesAgenda(tastes, a))
      .filter((e) => { if (seen.has(e.image)) return false; seen.add(e.image); return true }).slice(0, 10)
  }, [agenda, soon, pos, tastes])
  // Les lieux du créneau, les plus proches d'abord.
  // Un seul Top 10 : on pioche à tour de rôle dans chaque catégorie (clubs, activités, bars, fêtes, soirées, gourmand).
  const top10 = useMemo(() => {
    const order = ['club', 'jeux', 'bar', 'fetes', 'soiree', 'gastro']
    const by = order.map((k) => catalog.filter((x) => x.category === k).sort((a, b) => a.rank - b.rank))
    const out: typeof catalog = []
    for (let i = 0; out.length < 10 && by.some((l) => l[i]); i++) for (const l of by) if (l[i] && out.length < 10) out.push(l[i])
    return lovedFirst(out, (c) => likesPlace(tastes, c))
  }, [catalog, tastes])
  // Un lieu n'apparaît qu'une fois sur l'accueil : s'il est dans le Top 10, il ne revient pas dans cette rangée.
  const spots = useMemo(() => lovedFirst(catalog.filter((c) => SLOT_CATS[slot].includes(c.category) && !top10.some((x) => x.id === c.id)).sort((a, b) => distanceKm(pos, a) - distanceKm(pos, b)), (c) => likesPlace(tastes, c)).slice(0, 12), [catalog, slot, pos, tastes, top10])
  return (
    <div className="scr home-scr">
      <header className="home-hero">
        <img className="hero-vid" src={heroPhoto(day.light, day.hour)} alt="" />
        <div className="hero-shade" />
        <div className="hero-top">
          <span className="wordmark light">spotla<i /></span>
          <div className="row gap8">
            <LangSwitch className="glass" />
            <Link to="/map" className="iconbtn glass sm" aria-label={t('Rechercher un lieu', 'Search a place')}><Search size={19} /></Link>
            <Link to="/notifs" className="iconbtn glass sm bell" aria-label={t('Activité', 'Activity')}><Bell size={19} />{unread > 0 && <i>{unread}</i>}</Link>
          </div>
        </div>
        <div className="hero-copy">
          <p className="hero-hi">{greet(en, day.part)}{me?.name ? `, ${me.name.split(' ')[0]}` : ''}</p>
          <h1 className="hero-h">{en ? <>Where are we going <em>{when[1]}</em>?</> : <>On va où <em>{when[0]}</em> ?</>}</h1>
          <LocationButton pill />

        </div>
      </header>

      <StoriesBar />

      <section className="rail-sec" aria-label={SLOT_TITLE[slot][en ? 3 : 1]}>
        <div className="pad row between sec-head">
          <div className="stack4"><span className="kicker">{SLOT_TITLE[slot][en ? 2 : 0]}</span><h2 className="sec-title">{SLOT_TITLE[slot][en ? 3 : 1]}</h2></div>
          <Link className="sec-link" to="/map">{t('Carte', 'Map')}</Link>
        </div>
        {list.length > 0
          ? <div className="rail ev-rail">{listForYou.slice(0, 10).map((e) => <EventCard key={e.id} e={e} />)}</div>
          : (
            <div className="pad">
              <Link to="/create" className="empty-slot">
                <b>{en ? `Nothing posted ${slot === 'now' ? 'in the next 3 hours' : WHEN[slot][1]} near you.` : `Rien d'annoncé ${slot === 'now' ? 'dans les 3 prochaines heures' : WHEN[slot][0]} près de toi.`}</b>
                <span>{t('Lance une sortie : d\'autres te rejoindront. Ou pioche une activité juste en dessous.', 'Start a plan and others will join. Or pick an activity below.')}</span>
              </Link>
            </div>
          )}
      </section>

      <section className="rail-sec" aria-label="Envie de bouger">
        <div className="pad stack4 sec-head">
          <span className="kicker">{t('Ouvert à toute heure · près de toi', 'Open all day · near you')}</span>
          <h2 className="sec-title">{slot === 'soir' ? t('Où aller ce soir', 'Where to go tonight') : t('Envie de bouger ?', 'Feel like going out?')}</h2>
        </div>
        <div className="rail">{spots.map((p) => <PlaceCard key={p.id} p={p} />)}</div>
      </section>

      <section className="rail-sec cat-sec" aria-label={t('Explorer par catégorie', 'Browse by category')}>
        <div className="pad sec-head"><h2 className="sec-title">{t('Explorer par catégorie', 'Browse by category')}</h2></div>
        <CategoryChips />
      </section>

      <section className="rail-sec" aria-label="Activités à faire">
        <div className="pad row between sec-head">
          <div className="stack4"><span className="kicker">{slot === 'weekend' ? t('Ce week-end', 'This weekend') : t("Aujourd'hui", 'Today')} · {t('près de toi', 'near you')}</span><h2 className="sec-title">{t('Activités à faire à', 'Things to do in')} {city}</h2></div>
          <Link className="sec-link" to="/agenda">{t('Tout voir', 'See all')}</Link>
        </div>
        {agendaPending && soon.length < 3
          ? <SkelRail kind="agenda" />
          : <div className="rail">{soon.map((e) => <AgendaCard key={e.id} e={e} />)}</div>}
      </section>

      {community.length > 0 && (
        <section className="rail-sec" aria-label="Communauté">
          <div className="pad stack4 sec-head">
            <span className="kicker">{t('Ta communauté', 'Your community')}</span>
            <h2 className="sec-title">{en ? `Who's out ${slot === 'weekend' ? 'this weekend' : slot === 'soir' ? 'tonight' : 'today'}?` : `Qui sort ${slot === 'weekend' ? 'ce week-end' : slot === 'soir' ? 'ce soir' : "aujourd'hui"} ?`}</h2>
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

      {(weekendEvents.length > 0 || weekendAgenda.length > 0) && (
        <section className="rail-sec" aria-label={t('Ce week-end', 'This weekend')}>
          <div className="pad row between sec-head">
            <div className="stack4"><span className="kicker">{t('Pour prévoir', 'Plan ahead')} · {t('près de toi', 'near you')}</span><h2 className="sec-title">{t('Ce week-end', 'This weekend')}</h2></div>
            <Link className="sec-link" to="/agenda">{t('Tout voir', 'See all')}</Link>
          </div>
          <div className="rail">
            {weekendEvents.map((e) => <EventCard key={e.id} e={e} />)}
            {weekendAgenda.map((e) => <AgendaCard key={e.id} e={e} />)}
          </div>
        </section>
      )}

      <section className="rail-sec" aria-label="Top 10 SpotLa">
        <div className="pad rail-head center">
          <span className="kicker">{t('Sélection SpotLa', 'SpotLa picks')}</span>
          <h2 className="sec-title big">{en ? <>Top 10 <em>right now</em></> : <>Le Top 10 <em>du moment</em></>}</h2>
        </div>
        <div className="rail">{top10.map((p, i) => <PlaceCard key={p.id} p={{ ...p, rank: i + 1 }} />)}</div>
      </section>
    </div>
  )
}
