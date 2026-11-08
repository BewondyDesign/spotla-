import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Send, Share2 } from 'lucide-react'
import type { Post } from '../data/types'
import { useStore } from '../data/store'
import { blobUrl } from '../data/media'
import { fmtDay, fmtTime, timeAgo } from '../data/util'
import { Art, Avatar, PriceBadge, Verified } from './ui'
import { share } from './share'

/** Publication du mur, façon Instagram / Facebook : visuel, texte, j'aime, commentaires, événement lié. */
export function PostCard({ p }: { p: Post }) {
  const users = useStore((s) => s.users)
  const meId = useStore((s) => s.meId)
  const ev = useStore((s) => s.events.find((e) => e.id === p.eventId))
  const toggleLike = useStore((s) => s.toggleLike)
  const addComment = useStore((s) => s.addComment)
  const nav = useNavigate()
  const [img, setImg] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const u = users.find((x) => x.id === p.authorId)
  const liked = p.likes.includes(meId ?? '')

  useEffect(() => { if (p.imageKey) blobUrl(p.imageKey).then(setImg) }, [p.imageKey])

  const visual = img ? <img src={img} alt="" className="post-img" /> : p.colors ? <div className="cover post-art"><Art colors={p.colors} word={ev?.vibe} big /></div> : null

  return (
    <article className="post">
      <header className="row gap10">
        <Link to={`/u/${u?.id}`}><Avatar u={u} size={38} /></Link>
        <div className="post-who">
          <Link to={`/u/${u?.id}`}><b>{u?.name}</b> <Verified u={u} /></Link>
          <span>{timeAgo(p.createdAt)}</span>
        </div>
      </header>
      {p.text && <p className="post-text">{p.text}</p>}
      {visual}
      {ev && (
        <button className="post-ev" onClick={() => nav(`/event/${ev.id}`)}>
          <div className="cover mini"><Art colors={ev.colors} /></div>
          <div><b>{ev.title}</b><span>{fmtDay(ev.start)} · {fmtTime(ev.start)} · {ev.area}</span></div>
          <PriceBadge e={ev} />
        </button>
      )}
      <div className="post-actions">
        <button className={liked ? 'on' : ''} onClick={() => toggleLike(p.id)} aria-pressed={liked}><Heart size={20} fill={liked ? 'currentColor' : 'none'} /> {p.baseLikes + p.likes.length}</button>
        <button onClick={() => setOpen(!open)}><MessageCircle size={20} /> {p.comments.length}</button>
        <button onClick={() => share(ev ? ev.title : `Publication de ${u?.name}`, ev ? `#/event/${ev.id}` : `#/u/${u?.id}`)}><Share2 size={20} /></button>
      </div>
      {(open || p.comments.length > 0) && (
        <div className="comments">
          {(open ? p.comments : p.comments.slice(-1)).map((c) => {
            const cu = users.find((x) => x.id === c.authorId)
            return <p key={c.id}><b>{cu?.name}</b> {c.text}</p>
          })}
          {!open && p.comments.length > 1 && <button className="textlink" onClick={() => setOpen(true)}>Voir les {p.comments.length} commentaires</button>}
          {open && (
            <form className="comment-form" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { addComment(p.id, draft.trim()); setDraft('') } }}>
              <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ajouter un commentaire…" aria-label="Commentaire" />
              <button className="iconbtn" aria-label="Envoyer"><Send size={18} /></button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}
