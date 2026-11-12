import { useState } from 'react'
import { create } from 'zustand'
import { Ban, Flag, X } from 'lucide-react'
import { blockUser, REPORT_REASONS, reportContent, type ReportKind } from '../data/safety'
import { requireAccount, toast, useStore } from '../data/store'
import { useLang } from '../data/i18n'

interface Target { kind: ReportKind; targetId: string | null; userId?: string; userName?: string }
const useReport = create<{ t: Target | null }>(() => ({ t: null }))

/** Ouvre la fenêtre « Signaler » (et « Bloquer » si un membre est concerné). */
export function openReport(t: Target) {
  if (!requireAccount('signaler un contenu')) return
  useReport.setState({ t })
}

const LABEL: Record<ReportKind, [string, string]> = {
  user: ['Signaler ce profil', 'Report this profile'], post: ['Signaler cette publication', 'Report this post'],
  comment: ['Signaler ce commentaire', 'Report this comment'], story: ['Signaler cette story', 'Report this story'],
  message: ['Signaler ce message', 'Report this message'], event: ['Signaler cette sortie', 'Report this outing'],
  support: ['Contacter SpotLa', 'Contact SpotLa'],
}

export function ReportSheet() {
  const t = useReport((s) => s.t)
  const meId = useStore((s) => s.meId)
  const en = useLang((s) => s.lang) === 'en'
  const [reason, setReason] = useState('')
  const [more, setMore] = useState('')
  const [block, setBlock] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!t) return null
  const close = () => { useReport.setState({ t: null }); setReason(''); setMore(''); setBlock(false); setBusy(false) }
  const support = t.kind === 'support'
  const canBlock = !!t.userId && t.userId !== meId
  const send = async () => {
    setBusy(true)
    try {
      const label = REPORT_REASONS.find((r) => r.k === reason)?.fr ?? ''
      await reportContent(t.kind, t.targetId, [label, more.trim()].filter(Boolean).join(' — ') || 'Message')
      if (t.kind === 'event' && t.targetId) useStore.getState().report(t.targetId) // masquage auto à 3 signalements
      if (block && t.userId) await blockUser(t.userId)
      toast(support ? (en ? 'Message sent' : 'Message envoyé') : (en ? 'Thanks, we\'re on it' : 'Merci, on s\'en occupe'),
        support ? (en ? 'The SpotLa team will reply by email within 48 h.' : 'L\'équipe SpotLa te répond par e-mail sous 48 h.')
          : (en ? 'Our team reviews every report within 24 h. Content reported several times is removed automatically.' : 'L\'équipe examine chaque signalement sous 24 h. Un contenu signalé plusieurs fois est retiré automatiquement.'))
      close()
    } catch (e) { toast(en ? 'Not sent' : 'Pas envoyé', (e as Error).message); setBusy(false) }
  }
  return (
    <div className="rs-back" onClick={close}>
      <div className="rs-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 className="row gap8">{support ? null : <Flag size={18} />}{en ? LABEL[t.kind][1] : LABEL[t.kind][0]}</h2>
          <button className="iconbtn soft" onClick={close} aria-label={en ? 'Close' : 'Fermer'}><X size={18} /></button>
        </div>
        {!support && (
          <div className="report-reasons" role="radiogroup">
            {REPORT_REASONS.map((r) => (
              <button key={r.k} role="radio" aria-checked={reason === r.k} className={reason === r.k ? 'on' : ''} onClick={() => setReason(r.k)}>{en ? r.en : r.fr}</button>
            ))}
          </div>
        )}
        <textarea rows={3} maxLength={800} value={more} onChange={(e) => setMore(e.target.value)}
          placeholder={support ? (en ? 'Your question, a bug, a suggestion…' : 'Ta question, un bug, une idée…') : (en ? 'Details (optional)' : 'Précisions (facultatif)')} />
        {canBlock && (
          <label className="report-block">
            <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} />
            <span><Ban size={16} /> {en ? `Also block ${t.userName ?? 'this member'}` : `Bloquer aussi ${t.userName ?? 'ce membre'}`}<small>{en ? 'You won\'t see their content anymore and they won\'t be able to follow you.' : 'Tu ne verras plus ses contenus et il ne pourra plus te suivre.'}</small></span>
          </label>
        )}
        <button className="btn btn-primary btn-block" disabled={busy || (support ? more.trim().length < 3 : !reason)} onClick={send}>
          {busy ? '…' : support ? (en ? 'Send' : 'Envoyer') : (en ? 'Send report' : 'Envoyer le signalement')}
        </button>
      </div>
    </div>
  )
}
