import { useShallow } from 'zustand/react/shallow'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Camera, Pencil, Settings, Share2, X } from 'lucide-react'
import { share } from '../components/share'
import { toast, useMe, useStore } from '../data/store'
import { isRemote, uploadMedia } from '../data/backend'
import { momentOf } from '../data/util'
import { useStoryGroups } from '../components/Stories'
import { PostCard } from '../components/PostCard'
import { EventCard } from '../components/EventCard'
import { Avatar, Empty, Verified } from '../components/ui'
import { CAT_ICON, Stars } from '../components/PlaceCard'
import { useCatalog, userPassport, type Review } from '../data/places'
import { CATALOG } from '../data/catalog'
import type { User } from '../data/types'

const COVER_MAX_S = 15

export function Profile() {
  const { id = 'me' } = useParams()
  const nav = useNavigate()
  const me = useMe()
  const uid = id === 'me' ? me?.id ?? '' : id
  const u = useStore((s) => s.users.find((x) => x.id === uid))
  const posts = useStore(useShallow((s) => s.posts.filter((p) => p.authorId === uid)))
  const events = useStore(useShallow((s) => s.events.filter((e) => e.hostId === uid && momentOf(e) !== 'past')))
  const toggleFollow = useStore((s) => s.toggleFollow)
  const group = useStoryGroups().find((g) => g.authorId === uid)
  const [tab, setTab] = useState<'places' | 'events' | 'posts'>('places')
  const [editing, setEditing] = useState(false)
  const [pass, setPass] = useState<{ liked: string[]; reviews: Review[] }>({ liked: [], reviews: [] })
  const catalog = useCatalog()
  useEffect(() => { userPassport(uid).then(setPass) }, [uid])
  const placeOf = useMemo(() => (pid: string) => catalog.find((c) => c.id === pid) ?? CATALOG.find((c) => c.id === pid), [catalog])
  // Les lieux de la personne : ceux qu'elle a aimés ou notés, une seule fois chacun.
  const places = useMemo(() => [...new Set([...pass.reviews.map((r) => r.placeId), ...pass.liked])].map(placeOf).filter((x) => !!x), [pass, placeOf])

  if (!u) return <div className="scr"><Empty>Profil introuvable.</Empty></div>
  const isMe = u.id === me?.id
  const following = (me?.following ?? []).includes(u.id)
  const ratingOf = (pid: string) => pass.reviews.find((r) => r.placeId === pid)

  return (
    <div className="scr prof">
      <div className="prof-cover">
        {u.coverUrl && u.coverKind === 'video'
          ? <video src={u.coverUrl} autoPlay muted loop playsInline aria-hidden="true" />
          : u.coverUrl ? <img src={u.coverUrl} alt="" /> : <div className="cover-empty" aria-hidden="true" />}
        <div className="prof-cover-bar">
          {isMe ? <span /> : <button className="iconbtn glass sm" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={18} /></button>}
          <div className="row gap6">
            {isMe && u.kind === 'business' && <Link className="iconbtn glass sm" to="/business" aria-label="Espace business"><BarChart3 size={17} /></Link>}
            <button className="iconbtn glass sm" onClick={() => share(`${u.name} sur SpotLa`, `#/u/${u.id}`)} aria-label="Partager le profil"><Share2 size={17} /></button>
            {isMe && <button className="iconbtn glass sm" onClick={() => setEditing(true)} aria-label="Modifier le profil"><Pencil size={17} /></button>}
            {isMe && <Link className="iconbtn glass sm" to="/settings" aria-label="Réglages"><Settings size={17} /></Link>}
          </div>
        </div>
      </div>

      <div className="pad prof-id">
        <button className="prof-av" onClick={() => group ? nav(`/stories/${u.id}`) : isMe && nav('/create?mode=story')} aria-label={group ? 'Voir la story' : 'Ajouter une story'}>
          <Avatar u={u} size={88} ring={group ? (group.live ? 'live' : group.unseen ? 'new' : 'seen') : 'seen'} />
        </button>
        <h1 className="prof-name">{u.name} <Verified u={u} /></h1>
        <p className="prof-sub">@{u.handle}{u.city ? ` · ${u.city}` : ''}</p>
        {u.bio && <p className="prof-bio">{u.bio}</p>}
        <p className="prof-line">
          <span><b>{places.length}</b> lieux</span>
          <span><b>{events.length}</b> {events.length > 1 ? 'sorties à venir' : 'sortie à venir'}</span>
        </p>
        {!isMe && <button className={`pill-btn ${following ? '' : 'on'}`} onClick={() => toggleFollow(u.id)}>{following ? 'Abonné' : 'Suivre'}</button>}
      </div>

      <nav className="prof-nav" role="tablist">
        <button role="tab" aria-selected={tab === 'places'} onClick={() => setTab('places')}>Lieux</button>
        <button role="tab" aria-selected={tab === 'events'} onClick={() => setTab('events')}>Soirées</button>
        <button role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')}>Partages</button>
      </nav>

      {tab === 'places' && (
        places.length === 0 ? (
          <Empty>{isMe ? <>Aime ou note un lieu du <Link to="/">Top 10</Link> et il apparaîtra ici.</> : 'Aucun lieu partagé pour le moment.'}</Empty>
        ) : (
          <div className="pad prof-places">
            {places.map((p) => {
              const Icon = CAT_ICON[p!.category]
              const r = ratingOf(p!.id)
              return (
                <Link key={p!.id} to={`/place/${encodeURIComponent(p!.id)}`} className={`pplace c-${p!.category}`}>
                  {p!.photo ? <img src={p!.photo} alt="" /> : <Icon className="pplace-ic" size={40} strokeWidth={1.2} aria-hidden="true" />}
                  <div className="pplace-txt">
                    <b>{p!.name}</b>
                    <span>{p!.area}</span>
                    {r && <Stars rating={r.rating} size={11} />}
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}
      {tab === 'events' && (
        <div className="list mt12">{events.length === 0 ? <Empty>{isMe ? <>Aucune soirée à venir. <Link to="/create">Partage une soirée</Link>.</> : 'Aucune soirée à venir.'}</Empty> : events.map((e) => <EventCard key={e.id} e={e} />)}</div>
      )}
      {tab === 'posts' && (
        <div className="feed">
          {posts.length === 0 ? <Empty>{isMe ? <>Rien de partagé pour l'instant. <Link to="/create?mode=post">Partage un moment</Link>.</> : 'Aucune publication pour le moment.'}</Empty> : posts.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      )}

      {editing && <EditProfile u={u} onClose={() => setEditing(false)} />}
    </div>
  )
}

/** Durée d'une vidéo choisie, pour refuser les couvertures trop longues. */
const videoSeconds = (f: File) => new Promise<number>((res) => {
  const v = document.createElement('video')
  v.preload = 'metadata'
  v.onloadedmetadata = () => { res(v.duration); URL.revokeObjectURL(v.src) }
  v.onerror = () => res(0)
  v.src = URL.createObjectURL(f)
})

function EditProfile({ u, onClose }: { u: User; onClose: () => void }) {
  const updateProfile = useStore((s) => s.updateProfile)
  const [bio, setBio] = useState(u.bio)
  const [busy, setBusy] = useState<string | null>(null)

  const upload = async (f: File) => (isRemote ? uploadMedia(u.id, f, 'profile') : URL.createObjectURL(f))

  const pickCover = async (f?: File) => {
    if (!f) return
    const video = f.type.startsWith('video')
    if (video && (await videoSeconds(f)) > COVER_MAX_S + 0.5) { toast('Vidéo trop longue', `La couverture peut durer ${COVER_MAX_S} secondes au maximum.`); return }
    setBusy('cover')
    try { await updateProfile({ coverUrl: await upload(f), coverKind: video ? 'video' : 'image' }) } catch (e) { toast('La couverture n\'a pas pu être changée', (e as Error).message) }
    setBusy(null)
  }
  const pickAvatar = async (f?: File) => {
    if (!f) return
    setBusy('avatar')
    try { await updateProfile({ avatarUrl: await upload(f) }) } catch (e) { toast('La photo n\'a pas pu être changée', (e as Error).message) }
    setBusy(null)
  }
  const save = async () => {
    setBusy('bio')
    try { await updateProfile({ bio: bio.trim() }); onClose() } catch (e) { toast('Ça n\'a pas marché', (e as Error).message) }
    setBusy(null)
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="confirm edit-sheet" role="dialog" aria-modal="true" aria-label="Modifier le profil" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><b className="sec-title">Modifier le profil</b><button className="iconbtn" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div>
        <label className="edit-cover">
          {u.coverUrl && u.coverKind === 'video' ? <video src={u.coverUrl} autoPlay muted loop playsInline /> : u.coverUrl ? <img src={u.coverUrl} alt="" /> : null}
          <span><Camera size={18} /> {busy === 'cover' ? 'Envoi…' : 'Couverture : photo ou vidéo (15 s max)'}</span>
          <input type="file" accept="image/*,video/*" hidden onChange={(e) => pickCover(e.target.files?.[0])} />
        </label>
        <label className="edit-av">
          <Avatar u={u} size={56} />
          <span>{busy === 'avatar' ? 'Envoi…' : 'Changer la photo de profil'}</span>
          <input type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
        </label>
        <textarea className="input area" rows={3} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Une phrase sur toi : tes spots, ton style de soirée…" aria-label="Bio" />
        <button className="btn btn-primary btn-block" disabled={!!busy} onClick={save}>Enregistrer</button>
      </div>
    </div>
  )
}
