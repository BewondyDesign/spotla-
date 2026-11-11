import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useStore } from '../data/store'

/** Avant d'entrer dans l'app (avec ou sans compte) : confirmer qu'on a 18 ans ou plus. */
export function AgeGate() {
  const [minor, setMinor] = useState(false)
  if (minor) {
    return (
      <div className="scr">
        <div className="pad join-screen">
          <span className="join-ic big"><ShieldCheck size={28} /></span>
          <h1 className="h2">SpotLa est réservé aux 18 ans et plus</h1>
          <p className="muted">L'app propose des sorties dans des bars, des clubs et des soirées pour adultes. Reviens nous voir à tes 18 ans !</p>
          <button className="btn btn-ghost btn-block" onClick={() => setMinor(false)}>Retour</button>
        </div>
      </div>
    )
  }
  return (
    <div className="scr">
      <div className="pad join-screen">
        <span className="join-ic big"><ShieldCheck size={28} /></span>
        <h1 className="h2">As-tu 18 ans ou plus ?</h1>
        <p className="muted">SpotLa propose des sorties dans des bars, des clubs et des soirées : l'app est réservée aux personnes majeures.</p>
        <button className="btn btn-primary btn-block" onClick={() => useStore.setState({ adultOk: true })}>Oui, j'ai 18 ans ou plus</button>
        <button className="btn btn-ghost btn-block" onClick={() => setMinor(true)}>Non</button>
      </div>
    </div>
  )
}
