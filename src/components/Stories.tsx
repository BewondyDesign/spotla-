import { money } from '../data/util'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Plus, Trash2, X, Volume2, VolumeX } from 'lucide-react'
import { ConfirmDelete } from './Confirm'
import { useStore } from '../data/store'
import type { Story } from '../data/types'
import { blobUrl, MAX_STORY_SECONDS } from '../data/media'
import { isLive, timeAgo } from '../data/util'
import { Art, Avatar, LiveBadge, Verified } from './ui'

/** Stories actives (moins de 24 h), regroupées par auteur, les non vues d'abord. */
export function useStoryGroups() {
  const stories = useStore((s) => s.stories)
  const events = useStore((s) => s.events)
  const meId = useStore((s) => s.meId)
  return useMemo(() => {
    const now = Date.now()
    const active = stories.filter((s) => new Date(s.expiresAt).getTime() > now)
    const by = new Map<string, Story[]>()
    for (const s of active) by.set(s.authorId, [...(by.get(s.authorId) ?? []), s])
    const groups = [...by.entries()].map(([authorId, list]) => {
      const sorted = list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const live = sorted.some((s) => { const e = events.find((x) => x.id === s.eventId); return e ? isLive(e) : false })
      const unseen = sorted.some((s) => !s.seenBy.includes(meId ?? ''))
      return { authorId, stories: sorted, live, unseen }
    })
    return groups.sort((a, b) => Number(b.authorId === meId) - Number(a.authorId === meId) || Number(b.live) - Number(a.live) || Number(b.unseen) - Number(a.unseen))
  }, [stories, events, meId])
}

export function StoriesBar() {
  const groups = useStoryGroups()
  const users = useStore((s) => s.users)
  const meId = useStore((s) => s.meId)
  const nav = useNavigate()
  const hasMine = groups.some((g) => g.authorId === meId)
  // Personne n'a encore de story : une ligne d'invitation plutôt qu'un rond seul.
  if (groups.length === 0) return (
    <button className="story-cta" onClick={() => nav('/create?mode=story')}>
      <span className="story-add"><Plus size={20} /></span>
      <span className="grow"><b>Ta soirée en story</b><small>30 s max · visible par tes abonnés</small></span>
    </button>
  )
  return (
    <div className="stories" role="list" aria-label="Stories">
      {!hasMine && (
        <button className="story-b" role="listitem" onClick={() => nav('/create?mode=story')}>
          <span className="story-add"><Plus size={22} /></span>
          <span className="nm">Ta story</span>
        </button>
      )}
      {groups.map((g) => {
        const u = users.find((x) => x.id === g.authorId)
        return (
          <button key={g.authorId} className="story-b" role="listitem" onClick={() => nav(`/stories/${g.authorId}`)}>
            <Avatar u={u} size={58} ring={g.live ? 'live' : g.unseen ? 'new' : 'seen'} />
            {g.live && <span className="story-live">LIVE</span>}
            <span className="nm">{g.authorId === meId ? 'Ta story' : u?.name}</span>
          </button>
        )
      })}
    </div>
  )
}

const DEMO_SECONDS = 6

export function StoryViewer() {
  const { authorId } = useParams()
  const nav = useNavigate()
  const groups = useStoryGroups()
  const users = useStore((s) => s.users)
  const events = useStore((s) => s.events)
  const seeStory = useStore((s) => s.seeStory)
  const deleteStory = useStore((s) => s.deleteStory)
  const myId = useStore((s) => s.meId)
  const [askDel, setAskDel] = useState(false)

  // On fige l'ordre à l'ouverture pour ne pas sauter quand une story passe en « vue ».
  const [order] = useState(() => groups.map((g) => g.authorId))
  const [gi, setGi] = useState(() => Math.max(0, order.indexOf(authorId ?? '')))
  const group = groups.find((g) => g.authorId === order[gi])
  const [si, setSi] = useState(() => {
    const first = group?.stories.findIndex((s) => !s.seenBy.includes(useStore.getState().meId ?? '')) ?? 0
    return first < 0 ? 0 : first
  })
  const story = group?.stories[si]
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [src, setSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const close = () => nav(-1)
  const next = () => {
    if (!group) return close()
    if (si < group.stories.length - 1) { setSi(si + 1); return }
    if (gi < order.length - 1) { setGi(gi + 1); setSi(0); return }
    close()
  }
  const prev = () => {
    if (si > 0) { setSi(si - 1); return }
    if (gi > 0) { const pg = groups.find((g) => g.authorId === order[gi - 1]); setGi(gi - 1); setSi(Math.max(0, (pg?.stories.length ?? 1) - 1)) }
  }

  useEffect(() => { setProgress(0); setSrc(null); if (story) seeStory(story.id) }, [story?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (story?.media.kind !== 'video') return
    if (story.media.url) setSrc(story.media.url)
    else if (story.media.blobKey) blobUrl(story.media.blobKey).then(setSrc)
  }, [story])

  // Minuterie pour les stories de démo (pas de vidéo) ; la vidéo pilote sa propre progression.
  useEffect(() => {
    if (!story || story.media.kind !== 'demo' || paused) return
    const t = setInterval(() => setProgress((p) => { const n = p + 0.1 / DEMO_SECONDS; if (n >= 1) { clearInterval(t); setTimeout(next, 0); return 1 } return n }), 100)
    return () => clearInterval(t)
  }, [story?.id, paused]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (paused) v.pause(); else v.play().catch(() => {})
  }, [paused, src])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!group || !story) return <div className="viewer"><button className="iconbtn viewer-x" onClick={close} aria-label="Fermer"><X /></button></div>
  const u = users.find((x) => x.id === group.authorId)
  const ev = events.find((e) => e.id === story.eventId)
  const live = ev ? isLive(ev) : false

  return (
    <div className="viewer" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerCancel={() => setPaused(false)}>
      <div className="viewer-media">
        {story.media.kind === 'demo' ? (
          <div className="demo-story"><Art colors={story.media.colors} word={story.media.label} big /><div className="demo-pulse" /></div>
        ) : src ? (
          <video
            ref={videoRef} src={src} playsInline autoPlay muted={muted}
            onTimeUpdate={(e) => {
              const v = e.currentTarget
              const d = Math.min(v.duration || MAX_STORY_SECONDS, MAX_STORY_SECONDS)
              setProgress(v.currentTime / d)
              if (v.currentTime >= MAX_STORY_SECONDS) next()
            }}
            onEnded={next}
          />
        ) : <div className="demo-story loading" />}
      </div>

      <div className="viewer-top">
        <div className="bars">
          {group.stories.map((s, i) => <span key={s.id}><i style={{ width: `${(i < si ? 1 : i === si ? progress : 0) * 100}%` }} /></span>)}
        </div>
        <div className="row between">
          <div className="row gap8">
            <Link to={`/u/${group.authorId}`} className="row gap8" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <Avatar u={u} size={34} />
              <div className="viewer-who"><b>{u?.name} <Verified u={u} /></b><span>{timeAgo(story.createdAt)}</span></div>
            </Link>
            {live && <LiveBadge label="En ce moment" />}
          </div>
          <div className="row gap6">
            {story.media.kind === 'video' && (
              <button className="iconbtn glass" onPointerDown={(e) => e.stopPropagation()} onClick={() => setMuted(!muted)} aria-label={muted ? 'Activer le son' : 'Couper le son'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            )}
            {story.authorId === myId && <button className="iconbtn glass" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setPaused(true); setAskDel(true) }} aria-label="Supprimer ma story"><Trash2 size={18} /></button>}
            <button className="iconbtn glass" onPointerDown={(e) => e.stopPropagation()} onClick={close} aria-label="Fermer"><X size={20} /></button>
          </div>
        </div>
      </div>

      {askDel && <ConfirmDelete title="Supprimer ta story ?" text="Elle disparaîtra pour tout le monde." onConfirm={() => { deleteStory(story.id); close() }} onClose={() => { setAskDel(false); setPaused(false) }} />}
      <button className="tapzone left" aria-label="Story précédente" onClick={prev} />
      <button className="tapzone right" aria-label="Story suivante" onClick={next} />

      <div className="viewer-bottom" onPointerDown={(e) => e.stopPropagation()}>
        {story.caption && <p className="viewer-caption">{story.caption}</p>}
        {ev && (
          <button className="viewer-ev" onClick={() => nav(`/event/${ev.id}`, { replace: true })}>
            <div className="cover mini"><Art colors={ev.colors} /></div>
            <div><b>{ev.title}</b><span>{live ? 'Ça se passe maintenant · ' : ''}{ev.price === 0 ? 'Gratuit' : money(ev.price)} · {ev.area}</span></div>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
