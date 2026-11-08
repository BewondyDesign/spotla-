import { useShallow } from 'zustand/react/shallow'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Grid3x3, LogOut, PartyPopper, Rows3 } from 'lucide-react'
import { askConfirm, useMe, useStore } from '../data/store'
import { momentOf } from '../data/util'
import { useStoryGroups } from '../components/Stories'
import { PostCard } from '../components/PostCard'
import { EventCard } from '../components/EventCard'
import { Art, Avatar, Empty, Verified } from '../components/ui'

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
  const [tab, setTab] = useState<'wall' | 'grid' | 'events'>('wall')

  if (!u) return <div className="scr"><Empty>Profil introuvable.</Empty></div>
  const isMe = u.id === me.id
  const following = me.following.includes(u.id)

  return (
    <div className="scr">
      <header className="pad row between">
        {isMe ? <span className="h-handle">@{u.handle}</span> : <button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>}
        {isMe && <button className="iconbtn" onClick={async () => { if (await askConfirm('Se déconnecter et réinitialiser la démo ?', 'Se déconnecter')) logout() }} aria-label="Se déconnecter"><LogOut size={18} /></button>}
      </header>

      <div className="pad prof-head">
        <button className="prof-av" onClick={() => group ? nav(`/stories/${u.id}`) : isMe && nav('/create?mode=story')} aria-label={group ? 'Voir la story' : 'Ajouter une story'}>
          <Avatar u={u} size={84} ring={group ? (group.live ? 'live' : group.unseen ? 'new' : 'seen') : undefined} />
        </button>
        <div className="prof-stats">
          <div><b>{posts.length + events.length}</b><span>publications</span></div>
          <div><b>{u.followers.toLocaleString('fr-FR')}</b><span>abonnés</span></div>
          <div><b>{u.following.length}</b><span>abonnements</span></div>
        </div>
      </div>
      <div className="pad stack8 mt12">
        <h1 className="prof-name">{u.name} <Verified u={u} /></h1>
        {u.kind === 'business' && <span className="badge b-ver">{u.verified ? 'Lieu vérifié' : 'Vérification en cours'}</span>}
        {u.bio && <p className="muted">{u.bio}</p>}
        {u.venueAddress && <p className="small muted">📍 {u.venueAddress}</p>}
        <div className="row gap8">
          {isMe ? (
            <>
              <Link className="btn btn-ghost grow small-btn" to="/create">Publier</Link>
              {u.kind === 'business' && <Link className="btn btn-ghost grow small-btn" to="/business"><BarChart3 size={16} /> Espace business</Link>}
            </>
          ) : (
            <button className={`btn grow small-btn ${following ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleFollow(u.id)}>{following ? 'Abonné' : 'Suivre'}</button>
          )}
        </div>
      </div>

      <div className="prof-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'wall'} onClick={() => setTab('wall')} aria-label="Mur"><Rows3 size={20} /></button>
        <button role="tab" aria-selected={tab === 'grid'} onClick={() => setTab('grid')} aria-label="Grille"><Grid3x3 size={20} /></button>
        <button role="tab" aria-selected={tab === 'events'} onClick={() => setTab('events')} aria-label="Événements"><PartyPopper size={20} /></button>
      </div>

      {tab === 'wall' && (
        <div className="feed">
          {posts.length === 0 ? <Empty>{isMe ? <>Ton mur est vide. <Link to="/create?mode=post">Écris ton premier post</Link>.</> : 'Aucune publication pour le moment.'}</Empty> : posts.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      )}
      {tab === 'grid' && (
        <div className="grid-ig">
          {events.map((e) => <Link key={e.id} to={`/event/${e.id}`} className="cover tile"><Art colors={e.colors} word={e.vibe} /><span className="tile-t">{e.title}</span></Link>)}
          {posts.filter((p) => p.colors || p.imageKey || p.imageUrl).map((p) => <div key={p.id} className="cover tile"><Art colors={p.colors ?? ['#2C2640', '#15121F']} /><span className="tile-t">{p.text.slice(0, 40)}</span></div>)}
          {events.length + posts.length === 0 && <Empty>Rien à afficher.</Empty>}
        </div>
      )}
      {tab === 'events' && (
        <div className="list mt12">{events.length === 0 ? <Empty>Aucun événement à venir.</Empty> : events.map((e) => <EventCard key={e.id} e={e} />)}</div>
      )}
    </div>
  )
}
