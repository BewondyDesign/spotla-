import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, Clapperboard, ExternalLink, Flag, Lock, MapPin, Share2, Ticket, Users, X } from 'lucide-react'
import { askConfirm, canSeeAddress, goingCount, toast, useMe, useStore } from '../data/store'
import { distanceKm, fmtDay, fmtKm, fmtTime, isLive, startsIn, VIS_LABEL } from '../data/util'
import { Art, Avatar, LiveBadge, PriceBadge, Verified, VisBadge } from '../components/ui'
import { share } from '../components/share'
import { useStoryGroups } from '../components/Stories'

export function EventDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const e = useStore((s) => s.events.find((x) => x.id === id))
  const users = useStore((s) => s.users)
  const pos = useStore((s) => s.pos)
  const stories = useStore((s) => s.stories)
  const { toggleGoing, requestJoin, answerRequest, report, bump, toggleFollow } = useStore.getState()
  const me = useMe()
  const groups = useStoryGroups()

  useEffect(() => { if (id) bump(id, 'views') }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!e || !me) return <div className="scr"><div className="pad"><button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button><p className="empty">Cet événement n'existe plus.</p></div></div>

  const host = users.find((u) => u.id === e.hostId)
  const mine = e.hostId === me.id
  const going = e.going.includes(me.id)
  const requested = e.requests.includes(me.id)
  const accepted = e.accepted.includes(me.id)
  const full = e.capacity != null && goingCount(e) >= e.capacity && !going
  const showAddr = canSeeAddress(e, me)
  const live = isLive(e)
  const evStories = stories.filter((s) => s.eventId === e.id && new Date(s.expiresAt) > new Date())
  const following = me.following.includes(e.hostId)
  const needsApproval = (e.visibility === 'request' || (e.visibility === 'circle' && !following)) && !accepted && !mine

  const onReport = async () => {
    if (!(await askConfirm('Signaler cet événement à la modération ? (contenu trompeur, dangereux ou inapproprié)', 'Signaler'))) return
    report(e.id)
    toast('Merci, on regarde ça', 'L\'équipe de modération est notifiée. Après 3 signalements, l\'événement est masqué.')
  }

  return (
    <div className="scr no-tab">
      <div className="cover ev-cover">
        <Art colors={e.colors} word={e.vibe} big />
        <div className="shade" />
        <div className="ev-top">
          <button className="iconbtn glass" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
          <button className="iconbtn glass" onClick={async () => { if (await share(e.title, `#/event/${e.id}`)) bump(e.id, 'shares') }} aria-label="Partager"><Share2 size={20} /></button>
        </div>
        <div className="stack8">
          <div className="row gap6 wrapf"><PriceBadge e={e} /><VisBadge e={e} />{live ? <LiveBadge /> : <span className="badge b-soon">{startsIn(e)}</span>}</div>
          <h1>{e.title}</h1>
        </div>
      </div>

      <div className="pad stack16 mt16">
        {evStories.length > 0 && (
          <button className="ev-stories" onClick={() => nav(`/stories/${evStories[0].authorId}`)}>
            <Clapperboard size={20} />
            <div><b>{live ? 'Regarde ce qui se passe en ce moment' : 'Aperçu en vidéo'}</b><span>{evStories.length} story{evStories.length > 1 ? 's' : ''} de 30 s max</span></div>
            {live && <LiveBadge label="Live" />}
          </button>
        )}

        <div className="facts">
          <div className="fact"><Calendar size={20} /><div><b>{fmtDay(e.start)} · {fmtTime(e.start)} – {fmtTime(e.end)}</b><span>{startsIn(e)}</span></div></div>
          <div className="fact"><MapPin size={20} /><div><b>{e.venue} · {e.area}</b><span>{showAddr ? e.address : 'Adresse exacte visible une fois ta place confirmée'} · {fmtKm(distanceKm(pos, e))}</span></div></div>
          <div className="fact"><Ticket size={20} /><div><b>{e.price === 0 ? 'Gratuit' : `${e.price} € l'entrée`}</b><span>{e.ticketUrl ? 'Billetterie du lieu' : e.price === 0 ? 'Entrée libre' : 'Paiement sur place'}</span></div>{e.ticketUrl && <a className="btn-mini" href={e.ticketUrl} target="_blank" rel="noreferrer">Billets <ExternalLink size={14} /></a>}</div>
          <div className="fact"><Users size={20} /><div><b>{goingCount(e)} y vont{e.capacity ? ` · ${e.capacity} places` : ''}</b><span>{VIS_LABEL[e.visibility]}</span></div></div>
        </div>

        {!showAddr && (
          <div className="privacy"><Lock size={18} /><span>Événement privé : l'organisateur valide chaque demande. Tu verras l'adresse exacte dès que c'est accepté.</span></div>
        )}

        <p className="desc">{e.desc}</p>

        <div className="host">
          <Link to={`/u/${host?.id}`}><Avatar u={host} size={44} /></Link>
          <div className="grow"><Link to={`/u/${host?.id}`}><b>{host?.name} <Verified u={host} /></b></Link><span>{host?.kind === 'business' ? 'Lieu vérifié' : 'Organisé par un membre'} · {host?.followers.toLocaleString('fr-FR')} abonnés</span></div>
          {!mine && <button className={`btn-mini ${following ? '' : 'accent'}`} onClick={() => toggleFollow(e.hostId)}>{following ? 'Suivi' : 'Suivre'}</button>}
        </div>

        {mine && (
          <section className="stack8">
            <h3 className="sec-title">Demandes ({e.requests.length})</h3>
            {e.requests.length === 0 && <p className="muted small">Aucune demande en attente.</p>}
            {e.requests.map((uid) => {
              const u = users.find((x) => x.id === uid)
              return (
                <div key={uid} className="host">
                  <Avatar u={u} size={36} />
                  <div className="grow"><b>{u?.name}</b><span>@{u?.handle}</span></div>
                  <button className="iconbtn ok" aria-label="Accepter" onClick={() => answerRequest(e.id, uid, true)}><Check size={18} /></button>
                  <button className="iconbtn" aria-label="Refuser" onClick={() => answerRequest(e.id, uid, false)}><X size={18} /></button>
                </div>
              )
            })}
            <div className="row gap8">
              <Link className="btn btn-ghost grow" to={`/create?mode=story&event=${e.id}`}><Clapperboard size={18} /> Story de 30 s</Link>
              {groups.some((g) => g.authorId === me.id) && <Link className="btn btn-ghost" to={`/stories/${me.id}`}>Voir</Link>}
            </div>
          </section>
        )}

        {!mine && <button className="textlink" onClick={onReport}><Flag size={14} /> Signaler cet événement</button>}
      </div>

      {!mine && (
        <div className="stickycta">
          {needsApproval ? (
            <button className={`btn btn-block ${requested ? 'btn-ghost' : 'btn-primary'}`} onClick={() => { requestJoin(e.id); if (!requested) toast('Demande envoyée', `${host?.name} va te répondre. On te prévient.`) }}>
              {requested ? 'Demande envoyée · Annuler' : 'Demander ma place'}
            </button>
          ) : full ? (
            <button className="btn btn-block btn-ghost" disabled>Complet</button>
          ) : (
            <button className={`btn btn-block ${going ? 'btn-ok' : 'btn-primary'}`} onClick={() => { toggleGoing(e.id); if (!going) toast('C\'est noté !', 'On te rappelle 1 h avant. Partage-le à tes potes.') }}>
              {going ? <><Check size={18} /> J'y vais</> : 'J\'y vais'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
