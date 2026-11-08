import { useState } from 'react'
import { Building2, PartyPopper } from 'lucide-react'
import { useStore } from '../data/store'
import { VIBES } from '../data/util'
import type { AccountKind } from '../data/types'

export function Onboarding() {
  const onboard = useStore((s) => s.onboard)
  const [step, setStep] = useState(0)
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
        <button className="btn btn-primary btn-block" disabled={!ok} onClick={() => onboard({ name: name.trim(), kind, vibes, venueAddress: kind === 'business' ? addr.trim() : undefined })}>
          Voir ce qui se passe ce soir
        </button>
      </div>
    </div>
  )
}
