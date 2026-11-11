import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, UserRound, Users } from 'lucide-react'
import type { SpotEvent } from '../data/types'
import { requireAccount, toast, useStore } from '../data/store'
import { chatOpen, setSolo, setVibe, soloMembers, vibeOf, VIBE_LABEL, type VibeLevel } from '../data/social'
import { useLang, useT } from '../data/i18n'

const VIBE_EN: Record<VibeLevel, string> = { 1: 'Quiet', 2: 'Lively', 3: 'Packed' }

/** « J'y vais seul·e » : rejoindre le petit groupe des gens qui viennent seuls, avec une discussion temporaire. */
export function SoloCard({ e }: { e: SpotEvent }) {
  const meId = useStore((s) => s.meId)
  const t = useT()
  const en = useLang((s) => s.lang) === 'en'
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
      if (!inGroup) toast('Tu fais partie du groupe', 'Dis bonjour dans la discussion. Retrouvez-vous dans un lieu public.')
    } catch (err) { toast('Ça n\'a pas marché', (err as Error).message) }
    setBusy(false)
  }

  return (
    <section className="solo-card solo-compact">
      <div className="row gap10">
        <span className="solo-ic"><UserRound size={18} /></span>
        <div className="grow stack4">
          <b>{t('Tu y vas seul·e ?', 'Going solo?')}</b>
          <span className="muted small">{members.length === 0 ? t('Rejoins le groupe des gens qui viennent seuls.', 'Join the people going solo.') : en ? `${members.length} going solo` : `${members.length} ${members.length > 1 ? 'personnes y vont seules' : 'personne y va seule'}`}</span>
        </div>
        {inGroup && open
          ? <Link className="btn-mini accent" to={`/event/${e.id}/chat`}><MessageCircle size={15} /> {t('Discussion', 'Chat')}</Link>
          : <button className="btn-mini accent" disabled={busy || !open} onClick={join}><Users size={15} /> {t('Rejoindre', 'Join')}</button>}
      </div>
      {inGroup && <button className="textlink small" disabled={busy} onClick={join}>{t('Quitter le groupe', 'Leave the group')}</button>}
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
  const lvl = v.total ? (Number(top[0]) as VibeLevel) : null
  return (
    <div className="vibe-line">
      <div className="row gap10">
        <i className={`vibe-dot${lvl ? ` l${lvl}` : ''}`} aria-hidden="true" />
        <span className="grow small">{lvl ? <><b>{label(lvl)}</b> · {v.total} {t('avis sur place', 'on site')}</> : <span className="muted">{t('Ambiance : pas encore d\'avis', 'Vibe: no votes yet')}</span>}</span>
      </div>
      <div className="vibe-chips" role="group" aria-label="Ton avis sur l'ambiance">
        {([1, 2, 3] as VibeLevel[]).map((l) => <button key={l} className={v.mine === l ? 'on' : ''} onClick={() => vote(l)}>{label(l)}</button>)}
      </div>
    </div>
  )
}
