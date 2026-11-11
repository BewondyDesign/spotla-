import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, UserRound, Users } from 'lucide-react'
import type { SpotEvent } from '../data/types'
import { requireAccount, toast, useStore } from '../data/store'
import { chatOpen, setSolo, setVibe, soloMembers, vibeOf, VIBE_LABEL, type VibeLevel } from '../data/social'
import { Avatar } from './ui'
import { useLang, useT } from '../data/i18n'

const VIBE_EN: Record<VibeLevel, string> = { 1: 'Quiet', 2: 'Lively', 3: 'Packed' }

/** « J'y vais seul·e » : rejoindre le petit groupe des gens qui viennent seuls, avec une discussion temporaire. */
export function SoloCard({ e }: { e: SpotEvent }) {
  const meId = useStore((s) => s.meId)
  const t = useT()
  const en = useLang((s) => s.lang) === 'en'
  const users = useStore((s) => s.users)
  const toggleGoing = useStore((s) => s.toggleGoing)
  const [members, setMembers] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { soloMembers(e.id).then(setMembers) }, [e.id])
  const inGroup = !!meId && members.includes(meId)
  const open = chatOpen(e.end)
  const needsApproval = e.visibility === 'request' || e.visibility === 'circle'

  const join = async () => {
    if (!requireAccount('rejoindre le groupe des gens qui viennent seuls')) return
    setBusy(true)
    try {
      await setSolo(e.id, meId!, !inGroup)
      // Rejoindre le groupe, c'est aussi dire « J'y vais » (sauf événement sur demande : l'hôte valide d'abord).
      if (!inGroup && !needsApproval && !e.going.includes(meId!)) toggleGoing(e.id)
      setMembers(await soloMembers(e.id))
      if (!inGroup) toast('Tu fais partie du groupe', 'Dis bonjour dans la discussion : vous pourrez vous retrouver sur place.')
    } catch (err) { toast('Ça n\'a pas marché', (err as Error).message) }
    setBusy(false)
  }

  const faces = members.map((id) => users.find((u) => u.id === id)).filter((u) => !!u).slice(0, 6)
  return (
    <section className="solo-card">
      <div className="row gap10">
        <span className="solo-ic"><UserRound size={20} /></span>
        <div className="grow stack4">
          <b>{t('Tu y vas seul·e ?', 'Going solo?')}</b>
          <span className="muted small">{members.length === 0 ? t('Sois la première personne du groupe : d\'autres viendront.', 'Be the first in the group, others will join.') : en ? `${members.length} going solo. Meet up there.` : `${members.length} ${members.length > 1 ? 'personnes y vont' : 'personne y va'} seule${members.length > 1 ? 's' : ''}. Retrouvez-vous sur place.`}</span>
        </div>
      </div>
      {faces.length > 0 && <div className="solo-faces">{faces.map((u) => <Link key={u!.id} to={`/u/${u!.id}`}><Avatar u={u} size={34} /></Link>)}{members.length > 6 && <span>+{members.length - 6}</span>}</div>}
      <div className="row gap8">
        <button className={`btn grow ${inGroup ? 'btn-ghost' : 'btn-primary'}`} disabled={busy || !open} onClick={join}>{inGroup ? t('Quitter le groupe', 'Leave the group') : <><Users size={17} /> {t('J\'y vais seul·e', 'I\'m going solo')}</>}</button>
        {inGroup && open && <Link className="btn btn-primary grow" to={`/event/${e.id}/chat`}><MessageCircle size={17} /> {t('Discussion', 'Chat')}</Link>}
      </div>
      <p className="hint">{t('Petit groupe, discussion ouverte jusqu\'à 12 h après la fin. Retrouvez-vous dans un lieu public.', 'Small group, chat open until 12 h after the end. Meet in a public place.')}</p>
    </section>
  )
}

/** « Ça bouge ? » : jauge d'ambiance en direct, votée par les gens sur place. */
export function VibeGauge({ e }: { e: SpotEvent }) {
  const meId = useStore((s) => s.meId)
  const t = useT()
  const en = useLang((s) => s.lang) === 'en'
  const label = (l: VibeLevel) => (en ? VIBE_EN[l] : VIBE_LABEL[l])
  const [v, setV] = useState<{ counts: Record<VibeLevel, number>; mine: VibeLevel | null; total: number } | null>(null)
  const load = () => vibeOf(e.id, meId).then(setV)
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t) }, [e.id, meId]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return null
  const top = (Object.entries(v.counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
  const vote = async (l: VibeLevel) => {
    if (!requireAccount('dire comment est l\'ambiance')) return
    try { await setVibe(e.id, meId!, l); load() } catch (err) { toast('Ça n\'a pas marché', (err as Error).message) }
  }
  return (
    <section className="vibe-card">
      <div className="row between">
        <b>{t('Ça bouge ?', 'How busy is it?')}</b>
        <span className="muted small">{v.total === 0 ? t('Personne n\'a encore voté', 'No votes yet') : `${label(Number(top[0]) as VibeLevel)} · ${v.total} ${t('avis sur place', 'on site')}`}</span>
      </div>
      <div className="vibe-bar" aria-hidden="true">
        {([1, 2, 3] as VibeLevel[]).map((l) => <i key={l} className={`l${l}`} style={{ flexGrow: v.total ? v.counts[l] || 0.0001 : 1, opacity: v.total ? 1 : 0.25 }} />)}
      </div>
      <div className="vibe-btns" role="group" aria-label="Ton avis sur l'ambiance">
        {([1, 2, 3] as VibeLevel[]).map((l) => <button key={l} className={v.mine === l ? 'on' : ''} onClick={() => vote(l)}>{label(l)}</button>)}
      </div>
    </section>
  )
}
