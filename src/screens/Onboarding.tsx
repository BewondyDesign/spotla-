import { useState } from 'react'
import { Building2, PartyPopper } from 'lucide-react'
import { toast, useStore } from '../data/store'
import { createProfile, isRemote, sendLoginEmail, verifyCode } from '../data/backend'
import { VIBES } from '../data/util'
import type { AccountKind } from '../data/types'

export function Onboarding({ authId }: { authId?: string }) {
  const onboard = useStore((s) => s.onboard)
  const reload = useStore((s) => s.reload)
  const [step, setStep] = useState(authId ? 1 : 0)
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState<AccountKind>('perso')
  const [name, setName] = useState('')
  const [addr, setAddr] = useState('')
  const [vibes, setVibes] = useState<string[]>(['danser', 'live'])

  if (step === 0)
    return (
      <div className="scr onboard">
        <div className="onboard-art"><div className="glow g1" /><div className="glow g2" /><div className="glow g3" /></div>
        <div className="pad onboard-body">
          <div className="brand"><span className="dot" />SpotLa</div>
          <h1 className="title-xl">Où on sort <em>ce soir</em>&nbsp;?</h1>
          <p className="lede">Les soirées, concerts, apéros et fêtes près de toi, en temps réel. Même si tu ne connais personne en ville.</p>
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>C'est parti</button>
          <p className="hint center">Gratuit. Tu peux explorer sans publier.</p>
        </div>
      </div>
    )

  if (isRemote && !authId) return <EmailLogin />

  const ok = name.trim().length >= 2 && (kind === 'perso' || addr.trim().length > 4)
  return (
    <div className="scr">
      <div className="pad stack18">
        <div className="steps"><i className="on" /><i className={step >= 1 ? 'on' : ''} /></div>
        <h2 className="h2">Crée ton compte</h2>
        <div className="kind-pick" role="radiogroup" aria-label="Type de compte">
          <button role="radio" aria-checked={kind === 'perso'} onClick={() => setKind('perso')}>
            <PartyPopper /><b>Je veux sortir</b><span>Découvrir, publier mes soirées, partager des stories.</span>
          </button>
          <button role="radio" aria-checked={kind === 'business'} onClick={() => setKind('business')}>
            <Building2 /><b>J'ai un lieu</b><span>Bar, club, salle, orga : page vérifiée, agenda, stats.</span>
          </button>
        </div>
        <div className="field">
          <label htmlFor="nm">{kind === 'business' ? 'Nom du lieu ou de l\'organisation' : 'Ton prénom'}</label>
          <input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'business' ? 'Ex. Le Comptoir' : 'Ex. Inès'} autoComplete="given-name" />
        </div>
        {kind === 'business' && (
          <div className="field">
            <label htmlFor="ad">Adresse du lieu</label>
            <input id="ad" className="input" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Numéro, rue, code postal" autoComplete="street-address" />
            <span className="hint">On vérifie chaque lieu avant d'afficher le badge (SIRET ou justificatif).</span>
          </div>
        )}
        <div className="field">
          <span className="lbl">Tes ambiances</span>
          <div className="wrap-chips">
            {VIBES.map((v) => (
              <button key={v.k} className="chip" aria-pressed={vibes.includes(v.k)} onClick={() => setVibes(vibes.includes(v.k) ? vibes.filter((x) => x !== v.k) : [...vibes, v.k])}>{v.l}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={!ok || busy} onClick={async () => {
          const p = { name: name.trim(), kind, vibes, venueAddress: kind === 'business' ? addr.trim() : undefined }
          if (!isRemote) return onboard(p)
          setBusy(true)
          try { await createProfile({ id: authId!, ...p }); await reload() } catch (e) { toast('Création du profil impossible', (e as Error).message); setBusy(false) }
        }}>
          {busy ? 'Création…' : 'Voir ce qui se passe ce soir'}
        </button>
      </div>
    </div>
  )
}

/** Connexion sans mot de passe : lien magique ou code à 6 chiffres reçu par e-mail. */
function EmailLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const valid = /^\S+@\S+\.\S+$/.test(email.trim())

  const send = async () => {
    setBusy(true); setErr('')
    try { await sendLoginEmail(email.trim()); setSent(true) } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }
  const check = async () => {
    setBusy(true); setErr('')
    try { await verifyCode(email.trim(), code.trim()) } catch { setErr('Code incorrect ou expiré. Vérifie le dernier e-mail reçu, ou renvoie un code.') }
    setBusy(false)
  }

  return (
    <div className="scr">
      <div className="pad stack18">
        <div className="steps"><i className="on" /><i /></div>
        <h2 className="h2">{sent ? 'Regarde tes e-mails' : 'Connecte-toi'}</h2>
        {!sent ? (
          <>
            <p className="muted">Pas de mot de passe : on t'envoie un lien de connexion par e-mail.</p>
            <div className="field">
              <label className="lbl" htmlFor="em">Adresse e-mail</label>
              <input id="em" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && valid && send()} placeholder="toi@exemple.com" />
            </div>
            <button className="btn btn-primary btn-block" disabled={!valid || busy} onClick={send}>{busy ? 'Envoi…' : 'Recevoir mon lien'}</button>
          </>
        ) : (
          <>
            <p className="muted">On a envoyé un e-mail à <b>{email}</b>. Clique sur le lien depuis ce téléphone, ou tape le code s'il y en a un dans l'e-mail.</p>
            <div className="field">
              <label className="lbl" htmlFor="code">Code reçu (option)</label>
              <input id="code" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
            </div>
            <button className="btn btn-primary btn-block" disabled={code.length < 6 || busy} onClick={check}>Valider le code</button>
            <button className="textlink" onClick={() => { setSent(false); setCode('') }}>Changer d'adresse ou renvoyer</button>
          </>
        )}
        {err && <p className="error" role="alert">{err}</p>}
      </div>
    </div>
  )
}
