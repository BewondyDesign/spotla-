import { useShallow } from 'zustand/react/shallow'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, LogOut, Share2 } from 'lucide-react'
import { share } from '../components/share'
import { askConfirm, useMe, useStore } from '../data/store'
import { momentOf } from '../data/util'
import { useStoryGroups } from '../components/Stories'
import { PostCard } from '../components/PostCard'
import { EventCard } from '../components/EventCard'
import { Avatar, Empty, Verified } from '../components/ui'
import { CAT_ICON, Stars } from '../components/PlaceCard'
import { useCatalog, userPassport, type Review } from '../data/places'
import { CATALOG } from '../data/catalog'

export function Profile() {
  const { id = 'me' } = useParams()
  const nav = useNavigate()
  const me = useMe()!
  const uid = id === 'me' ? me.id : id
  const u = useStore((s) => s.users.find((x) => x.id === uid))
  const posts = useStore(useShallow((s) => s.posts.filter((p) => p.authorId === uid)))
  const events = useStore(useShallow((s) => s.events.filter((e) => e.hostId === uid && momentOf(e) !== 'past')))
  const toggleFollow = useStore((s) => s.toggleFollow)
  const logout = useStore((s) => s.logout)
  const group = useStoryGroups().find((g) => g.authorId === uid)
  const [tab, setTab] = useState<'pass' | 'wall' | 'events'>('pass')
  const [pass, setPass] = useState<{ liked: string[]; reviews: Review[] }>({ liked: [], reviews: [] })
  const catalog = useCatalog()
  const hosted = useStore((s) => s.events.filter((e) => e.hostId === uid).length)
  useEffect(() => { userPassport(uid).then(setPass) }, [uid])
  const placeOf = useMemo(() => (pid: string) => catalog.find((c) => c.id === pid) ?? CATALOG.find((c) => c.id === pid), [catalog])
  // Tampons : chaque lieu aimé ou noté, une seule fois.
  const stamps = useMemo(() => [...new Set([...pass.reviews.map((r) => r.placeId), ...pass.liked])].map(placeOf).filter((x) => !!x), [pass, placeOf])

  if (!u) return <div className="scr"><Empty>Profil introuvable.</Empty></div>
  const isMe = u.id === me.id
  const following = me.following.includes(u.id)

  return (
    <div className="scr">
      <header className="pad prof-top">
        {isMe ? <span /> : <button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>}
        <span className="h-handle">@{u.handle}</span>
        {isMe ? <button className="iconbtn soft" onClick={async () => { if (await askConfirm('Se déconnecter et réinitialiser la démo ?', 'Se déconnecter')) logout() }} aria-label="Se déconnecter"><LogOut size={18} /></button> : <span />}
      </header>

      <div className="pad prof-head">
        <button className="prof-av" onClick={() => group ? nav(`/stories/${u.id}`) : isMe && nav('/create?mode=story')} aria-label={group ? 'Voir la story' : 'Ajouter une story'}>
          <Avatar u={u} size={96} ring={group ? (group.live ? 'live' : group.unseen ? 'new' : 'seen') : 'seen'} />
        </button>
        <h1 className="prof-name">{u.name} <Verified u={u} /></h1>
        {u.kind === 'business' && <span className="badge b-ver">{u.verified ? 'Lieu vérifié' : 'Vérification en cours'}</span>}
        {u.bio && <p className="muted">{u.bio}</p>}
        {u.venueAddress && <p className="small muted">📍 {u.venueAddress}</p>}
        <p className="prof-follow"><b>{u.followers.toLocaleString('fr-FR')}</b> abonnés · <b>{u.following.length}</b> abonnements</p>
        <div className="row gap8 prof-btns">
          {isMe ? (
            <>
              <Link className="btn btn-primary grow small-btn" to="/create">Partager une soirée</Link>
              {u.kind === 'business' && <Link className="btn btn-ghost grow small-btn" to="/business"><BarChart3 size={16} /> Espace business</Link>}
            </>
          ) : (
            <button className={`btn grow small-btn ${following ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleFollow(u.id)}>{following ? 'Abonné' : 'Suivre'}</button>
          )}
          <button className="btn btn-ghost small-btn" onClick={() => share(`Le passeport de ${u.name} sur SpotLa`, `#/u/${u.id}`)} aria-label="Partager le profil"><Share2 size={16} /></button>
        </div>
      </div>

      <div className="pad passport-sum">
        <div><b>{stamps.length}</b><span>lieux</span></div>
        <div><b>{hosted}</b><span>soirées</span></div>
        <div><b>{pass.reviews.length}</b><span>avis</span></div>
        <div><b>{posts.length}</b><span>posts</span></div>
      </div>

      <div className="pad">
        <div className="tabs2 pill" role="tablist">
          <button role="tab" aria-selected={tab === 'pass'} onClick={() => setTab('pass')}>Passeport</button>
          <button role="tab" aria-selected={tab === 'wall'} onClick={() => setTab('wall')}>Partages</button>
          <button role="tab" aria-selected={tab === 'events'} onClick={() => setTab('events')}>Soirées</button>
        </div>
      </div>

      {tab === 'pass' && (
        <div className="pad stack16">
          {stamps.length === 0 ? (
            <Empty>{isMe ? <>Ton passeport est vide. Aime ou note un lieu du <Link to="/">Top 10</Link> pour gagner ton premier tampon.</> : 'Aucun tampon pour le moment.'}</Empty>
          ) : (
            <div className="stamps">
              {stamps.map((p) => { const Icon = CAT_ICON[p!.category]; return (
                <Link key={p!.id} to={`/place/${encodeURIComponent(p!.id)}`} className={`stamp c-${p!.category}`}>
                  <Icon size={22} aria-hidden="true" />
                  <b>{p!.name}</b>
                  <span>{p!.area}</span>
                </Link>
              ) })}
            </div>
          )}
          {pass.reviews.length > 0 && (
            <section className="stack12">
              <h2 className="sec-title">Avis</h2>
              {pass.reviews.map((r) => (
                <Link key={r.id} to={`/place/${encodeURIComponent(r.placeId)}`} className="review">
                  <b>{placeOf(r.placeId)?.name ?? 'Lieu'}</b>
                  <Stars rating={r.rating} />
                  {r.body && <p>{r.body}</p>}
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
      {tab === 'wall' && (
        <div className="feed">
          {posts.length === 0 ? <Empty>{isMe ? <>Ton mur est vide. <Link to="/create?mode=post">Écris ton premier post</Link>.</> : 'Aucune publication pour le moment.'}</Empty> : posts.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      )}
      {tab === 'events' && (
        <div className="list mt12">{events.length === 0 ? <Empty>Aucun événement à venir.</Empty> : events.map((e) => <EventCard key={e.id} e={e} />)}</div>
      )}
    </div>
  )
}
