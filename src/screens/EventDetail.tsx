import { useEffect, useState } from 'react'
import { ConfirmDelete } from '../components/Confirm'
import { SoloCard, VibeGauge } from '../components/Solo'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, Clapperboard, ExternalLink, Flag, Lock, MapPin, Share2, X } from 'lucide-react'
import { askConfirm, canSeeAddress, goingCount, toast, useMe, useStore } from '../data/store'
import { distanceKm, fmtDay, fmtKm, fmtTime, isLive, startsIn } from '../data/util'
import { eventVideo } from '../data/ambiance'
import { Art, Avatar, LiveBadge, PriceBadge, Verified, VisBadge } from '../components/ui'
import { share } from '../components/share'
import { useStoryGroups } from '../components/Stories'
import { shareStory } from '../components/storyShare'
import { Instagram } from 'lucide-react'
import { blobUrl } from '../data/media'
import { openReport } from '../components/ReportSheet'
import { useT } from '../data/i18n'

export function EventDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const e = useStore((s) => s.events.find((x) => x.id === id))
  const users = useStore((s) => s.users)
  const pos = useStore((s) => s.pos)
  const stories = useStore((s) => s.stories)
  const { toggleGoing, requestJoin, answerRequest, bump, toggleFollow, deleteEvent } = useStore.getState()
  const [askDel, setAskDel] = useState(false)
  const [allGoers, setAllGoers] = useState(false)
  const me = useMe()
  const groups = useStoryGroups()
  const t = useT()

  useEffect(() => { if (id) bump(id, 'views') }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!e) return <div className="scr"><div className="pad"><button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button><p className="empty">{t('Cet événement n\'existe plus.', 'This event no longer exists.')}</p></div></div>

  const host = users.find((u) => u.id === e.hostId)
  const myId = me?.id ?? ''
  const goers = e.going.filter((uid) => uid !== e.hostId).map((uid) => users.find((u) => u.id === uid)).filter((u): u is NonNullable<typeof u> => !!u)
  const mine = e.hostId === myId
  const going = e.going.includes(myId)
  const requested = e.requests.includes(myId)
  const accepted = e.accepted.includes(myId)
  const full = e.capacity != null && goingCount(e) >= e.capacity && !going
  const showAddr = canSeeAddress(e, me)
  const live = isLive(e)
  const evStories = stories.filter((s) => s.eventId === e.id && new Date(s.expiresAt) > new Date())
  const following = (me?.following ?? []).includes(e.hostId)
  const needsApproval = (e.visibility === 'request' || (e.visibility === 'circle' && !following)) && !accepted && !mine

  // Story : on partage en priorité une vraie vidéo filmée sur place par un membre (la plus récente).
  const realStoryVideo = async () => {
    for (const s of [...evStories].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      if (s.media.kind !== 'video') continue
      const u = s.media.url ?? (s.media.blobKey ? await blobUrl(s.media.blobKey) : null)
      if (u) return u
    }
    return undefined
  }

  /** Story Instagram / Facebook / TikTok : vidéo du lieu, titre, date. `going` : version « J'y vais » avec ton prénom. */
  const story = async (going = false) => {
    const real = await realStoryVideo()
    const first = me?.name.split(' ')[0] ?? ''
    const when = `${fmtDay(e.start)} · ${fmtTime(e.start)}`
    if (await shareStory({
      title: e.title,
      badge: going ? (t('J\'Y VAIS', 'I\'M GOING')) : live ? t('EN DIRECT', 'LIVE') : when.toUpperCase(),
      line: going ? `${first ? `${first} ${t('y va', 'is going')} · ` : ''}${e.venue} · ${when}` : `${e.venue} · ${e.area}`,
      video: real ?? eventVideo(e), maxSeconds: real ? 15 : 10, hash: `#/event/${e.id}`,
    })) bump(e.id, 'shares')
  }
  // Après « J'y vais » : tes abonnés SpotLa sont prévenus, et on propose de l'annoncer en story sur tes réseaux.
  const onGoing = async () => {
    toggleGoing(e.id)
    if (going) return
    const shared = me?.shareGoing !== false
    if (await askConfirm(shared
      ? t('C\'est noté ! Tes abonnés SpotLa sont prévenus. Tu veux aussi le dire à ta gang en story sur Instagram, Facebook ou TikTok ?', 'Done! Your SpotLa followers have been told. Want to tell your crew in a story on Instagram, Facebook or TikTok too?')
      : t('C\'est noté ! On te rappelle 1 h avant. Tu veux le dire à ta gang en story sur Instagram, Facebook ou TikTok ?', 'Done! We\'ll remind you 1 h before. Want to tell your crew in a story on Instagram, Facebook or TikTok?'),
    t('Partager en story', 'Share as a story'), t('Plus tard', 'Later'))) story(true)
  }

  const onReport = () => openReport({ kind: 'event', targetId: e.id, userId: e.hostId, userName: host?.name })


  return (
    <div className="scr no-tab ev-scr">
      <div className="cover ev-cover">
        <Art colors={e.colors} word={e.vibe} big video={eventVideo(e)} />
        <div className="shade" />
        <div className="ev-top">
          <button className="iconbtn glass" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
          <span className="row gap8"><button className="story-btn" onClick={() => story()} aria-label="Partager en story"><Instagram size={17} /> Story</button><button className="iconbtn glass" onClick={async () => { if (await share(e.title, `#/event/${e.id}`)) bump(e.id, 'shares') }} aria-label="Partager"><Share2 size={20} /></button></span>
        </div>
        <div className="stack8">
          <div className="row gap6 wrapf"><PriceBadge e={e} /><VisBadge e={e} />{live && <LiveBadge />}</div>
          <h1>{e.title}</h1>
        </div>
      </div>

      <div className="pad stack16 mt16">
        <div className="facts">
          <div className="fact"><Calendar size={20} /><div><b>{fmtDay(e.start)} · {fmtTime(e.start)} – {fmtTime(e.end)}</b><span>{startsIn(e)}</span></div></div>
          {(live || Date.parse(e.start) - Date.now() < 3600_000) && Date.parse(e.end) > Date.now() && <VibeGauge e={e} />}
          <div className="fact"><MapPin size={20} /><div><b>{e.venue} · {e.area}</b><span>{showAddr ? e.address : t('Adresse exacte visible 2 h avant, une fois ta place confirmée', 'Exact address shown 2 h before, once your spot is confirmed')} · {fmtKm(distanceKm(pos, e))}</span></div></div>
        </div>

        {e.desc && <p className="desc">{e.desc}</p>}

        {!mine && (
          <div className="ev-cta">
            {needsApproval ? (
              <button className={`btn btn-block ${requested ? 'btn-ghost' : 'btn-primary'}`} onClick={() => { requestJoin(e.id); if (!requested) toast('Demande envoyée', `${host?.name} va te répondre. On te prévient.`) }}>
                {requested ? t('Demande envoyée · Annuler', 'Request sent · Cancel') : t('Demander ma place', 'Request a spot')}
              </button>
            ) : full ? (
              <button className="btn btn-block btn-ghost" disabled>{t('Complet', 'Full')}</button>
            ) : (
              <button className={`btn btn-block ${going ? 'btn-ok' : 'btn-primary'}`} onClick={onGoing}>
                {going ? <><Check size={18} /> {t('J\'y vais', 'I\'m going')}</> : t('J\'y vais', 'I\'m going')}
              </button>
            )}
            {e.ticketUrl && <a className="btn btn-ghost" href={e.ticketUrl} target="_blank" rel="noreferrer">{t('Billets', 'Tickets')} <ExternalLink size={16} /></a>}
          </div>
        )}

        {!showAddr && (
          <div className="privacy"><Lock size={18} /><span>{accepted || (e.visibility === 'circle' && following) ? `Tu es invité·e. Pour la sécurité de tous, l'adresse exacte apparaît 2 h avant le début (${fmtTime(new Date(Date.parse(e.start) - 2 * 3600_000).toISOString())}).` : 'Événement privé : l\'organisateur valide chaque demande. Une fois accepté·e, tu verras l\'adresse exacte 2 h avant le début.'}</span></div>
        )}

        {evStories.length > 0 && (
          <button className="ev-stories" onClick={() => nav(`/stories/${evStories[0].authorId}`)}>
            <Clapperboard size={20} />
            <div><b>{live ? 'Regarde ce qui se passe en ce moment' : 'Aperçu en vidéo'}</b><span>{evStories.length} story{evStories.length > 1 ? 's' : ''} de 30 s max</span></div>
            {live && <LiveBadge label="Live" />}
          </button>
        )}

        <div className="host">
          <Link to={`/u/${host?.id}`}><Avatar u={host} size={44} /></Link>
          <div className="grow"><Link to={`/u/${host?.id}`}><b>{host?.name} <Verified u={host} /></b></Link><span>{host?.kind === 'business' ? (host.verified ? 'Lieu vérifié' : 'Lieu') : host?.verified ? 'Organisateur vérifié' : 'Organisé par un membre'}</span></div>
          {!mine && <button className={`btn-mini ${following ? '' : 'accent'}`} onClick={() => toggleFollow(e.hostId)}>{following ? 'Suivi' : 'Suivre'}</button>}
        </div>

        {goers.length > 0 && (
          <section className="stack8">
            <button className="goers-row" onClick={() => setAllGoers(!allGoers)} aria-expanded={allGoers}>
              {!allGoers && <span className="goers-faces">{goers.slice(0, 5).map((u) => <Avatar key={u.id} u={u} size={30} />)}</span>}
              <span className="grow"><b>{goingCount(e)} {t('y vont', 'going')}</b>{e.capacity ? <small> · {e.capacity} {t('places', 'spots')}</small> : null}</span>
              <span className="muted small">{allGoers ? t('Masquer', 'Hide') : t('Voir', 'See')}</span>
            </button>
            {allGoers && (
              <div className="goers">
                {goers.map((u) => (
                  <Link key={u.id} to={`/u/${u.id}`} className="goer"><Avatar u={u} size={44} /><span>{u.id === myId ? t('Toi', 'You') : u.name.split(' ')[0]}</span></Link>
                ))}
              </div>
            )}
          </section>
        )}

        {Date.parse(e.end) > Date.now() && !mine && <SoloCard e={e} />}

        {mine && <button className="textlink danger" onClick={() => setAskDel(true)}>Supprimer cette soirée</button>}
        {askDel && <ConfirmDelete title="Supprimer cette soirée ?" text="Elle disparaîtra de l'app pour tout le monde, avec les inscriptions." onConfirm={() => { deleteEvent(e.id); nav('/', { replace: true }) }} onClose={() => setAskDel(false)} />}

        {mine && (
          <section className="stack8">
            <h3 className="sec-title">Demandes ({e.requests.length})</h3>
            {e.requests.length === 0 && <p className="muted small">Aucune demande en attente.</p>}
            {e.requests.map((uid) => {
              const u = users.find((x) => x.id === uid)
              return (
                <div key={uid} className="host">
                  <Link to={`/u/${uid}`}><Avatar u={u} size={36} /></Link>
                  <Link className="grow" to={`/u/${uid}`}><b>{u?.name}</b><span>@{u?.handle}</span></Link>
                  <button className="iconbtn ok" aria-label="Accepter" onClick={() => answerRequest(e.id, uid, true)}><Check size={18} /></button>
                  <button className="iconbtn" aria-label="Refuser" onClick={() => answerRequest(e.id, uid, false)}><X size={18} /></button>
                </div>
              )
            })}
            <div className="row gap8">
              <Link className="btn btn-ghost grow" to={`/create?mode=story&event=${e.id}`}><Clapperboard size={18} /> Story de 30 s</Link>
              {groups.some((g) => g.authorId === myId) && <Link className="btn btn-ghost" to={`/stories/${myId}`}>Voir</Link>}
            </div>
          </section>
        )}

        {!mine && <button className="textlink" onClick={onReport}><Flag size={14} /> {t('Signaler cet événement', 'Report this event')}</button>}
      </div>
    </div>
  )
}
