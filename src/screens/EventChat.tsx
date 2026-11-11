import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { toast, useStore } from '../data/store'
import { chatOpen, CHAT_HOURS_AFTER, deleteMessage, sendMessage, soloMembers, useChat } from '../data/social'
import { fmtTime } from '../data/util'
import { Avatar } from '../components/ui'

/** Discussion temporaire du groupe « J'y vais seul·e » d'une sortie. */
export function EventChat() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const e = useStore((s) => s.events.find((x) => x.id === id))
  const users = useStore((s) => s.users)
  const meId = useStore((s) => s.meId)
  const { msgs, err, refresh } = useChat(id)
  const [draft, setDraft] = useState('')
  const [member, setMember] = useState<boolean | null>(null)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { soloMembers(id).then((m) => setMember(!!meId && (m.includes(meId) || e?.hostId === meId))) }, [id, meId, e?.hostId])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  if (!e) return <div className="scr"><div className="pad"><button className="iconbtn" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft /></button><p className="empty">Cette sortie n'existe plus.</p></div></div>
  const open = chatOpen(e.end)
  const closesAt = new Date(Date.parse(e.end) + CHAT_HOURS_AFTER * 3600_000).toISOString()

  const send = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const body = draft.trim()
    if (!body || !meId) return
    setDraft('')
    try { await sendMessage(id, meId, body); refresh() } catch (x) { toast('Message non envoyé', (x as Error).message); setDraft(body) }
  }

  return (
    <div className="scr no-tab chat-scr">
      <header className="chat-head pad">
        <button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
        <Link to={`/event/${e.id}`} className="grow stack4">
          <b>{e.title}</b>
          <span className="muted small">Groupe « J'y vais seul·e » · {open ? `se ferme demain à ${fmtTime(closesAt)}` : 'discussion fermée'}</span>
        </Link>
      </header>
      <div className="chat-list pad">
        {member === false && <p className="hint center">Rejoins le groupe depuis la page de la sortie pour lire et écrire ici.</p>}
        {member && msgs.length === 0 && <p className="hint center">Personne n'a encore écrit. Dis bonjour et propose un point de rendez-vous (dans un lieu public).</p>}
        {member && msgs.map((m) => {
          const u = users.find((x) => x.id === m.userId)
          const mine = m.userId === meId
          return (
            <div key={m.id} className={`msg${mine ? ' mine' : ''}`}>
              {!mine && <Link to={`/u/${m.userId}`}><Avatar u={u} size={28} /></Link>}
              <div className="bubble">
                {!mine && <b>{u?.name.split(' ')[0] ?? 'Membre'}</b>}
                <p>{m.body}</p>
                <small>{fmtTime(m.createdAt)}{mine && <button className="msg-del" onClick={async () => { await deleteMessage(m.id).catch(() => {}); refresh() }} aria-label="Supprimer mon message"><Trash2 size={12} /></button>}</small>
              </div>
            </div>
          )
        })}
        {err && <p className="error">{err}</p>}
        <div ref={end} />
      </div>
      {member && open && (
        <form className="chat-input" onSubmit={send}>
          <input className="input" value={draft} onChange={(x) => setDraft(x.target.value)} placeholder="Écris au groupe…" maxLength={500} aria-label="Message" />
          <button className="iconbtn" aria-label="Envoyer" disabled={!draft.trim()}><Send size={18} /></button>
        </form>
      )}
    </div>
  )
}
