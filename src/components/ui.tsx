import { money } from '../data/util'
import { BadgeCheck, Lock, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SpotEvent, User } from '../data/types'
import { useConfirm, useToast } from '../data/store'

export function Art({ colors, word, big }: { colors: [string, string]; word?: string; big?: boolean }) {
  return (
    <>
      <div className="art" style={{ background: `radial-gradient(circle at 18% 22%, ${colors[0]}, transparent 58%), radial-gradient(circle at 85% 80%, ${colors[1]}, transparent 60%), #1A1426` }} />
      {word && <span className={`word${big ? ' big' : ''}`} aria-hidden="true">{word}</span>}
    </>
  )
}

export function PriceBadge({ e }: { e: SpotEvent }) {
  return e.price === 0 ? <span className="badge b-free">Gratuit</span> : <span className="badge b-paid">{money(e.price)}</span>
}

export function VisBadge({ e }: { e: SpotEvent }) {
  if (e.visibility === 'open') return null
  const label = e.visibility === 'limited' ? `${e.capacity ?? ''} places` : e.visibility === 'request' ? 'Sur demande' : 'Cercle'
  return <span className="badge b-lim">{e.visibility === 'limited' ? <Users size={11} /> : <Lock size={11} />}{label}</span>
}

export function LiveBadge({ label = 'En direct' }: { label?: string }) {
  return <span className="badge b-live"><span className="live-dot" />{label}</span>
}

export function Avatar({ u, size = 40, ring }: { u: User | undefined; size?: number; ring?: 'new' | 'seen' | 'live' }) {
  if (!u) return null
  const initials = u.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const pic = (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, borderRadius: u.kind === 'business' ? size * 0.3 : '50%', ...(u.avatarUrl ? { backgroundImage: `url(${u.avatarUrl})` } : {}) }}>
      {!u.avatarUrl && initials}
    </span>
  )
  if (!ring) return pic
  // Les stories sont des « spots » : carrés arrondis, pas des cercles.
  return <span className={`ring ring-${ring}`} style={{ borderRadius: size * 0.38 }}><span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, borderRadius: size * 0.3, ...(u.avatarUrl ? { backgroundImage: `url(${u.avatarUrl})` } : {}) }}>{!u.avatarUrl && initials}</span></span>
}

export function Verified({ u }: { u?: User }) {
  if (!u?.verified) return null
  return <BadgeCheck size={16} className="verified" aria-label="Compte vérifié" />
}

export function Toast() {
  const t = useToast((s) => s.t)
  if (!t) return null
  return (
    <div className="toast" role="status">
      <span className="toast-dot" />
      <div><b>{t.title}</b>{t.body && <span>{t.body}</span>}</div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function ConfirmSheet() {
  const q = useConfirm((s) => s.q)
  if (!q) return null
  const done = (v: boolean) => { useConfirm.setState({ q: null }); q.resolve(v) }
  return (
    <div className="backdrop" onClick={() => done(false)}>
      <div className="confirm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{q.text}</p>
        <div className="row gap8">
          <button className="btn btn-ghost grow" onClick={() => done(false)}>Annuler</button>
          <button className="btn btn-primary grow" onClick={() => done(true)} autoFocus>{q.ok}</button>
        </div>
      </div>
    </div>
  )
}
