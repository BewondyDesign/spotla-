import { useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { useStore } from '../data/store'

/**
 * Règle d'âge : avant d'entrer dans l'app (avec ou sans compte), on confirme avoir 18 ans ou plus.
 * Si la personne répond « Non », l'app reste bloquée sur cet appareil (même après fermeture)
 * jusqu'à ce qu'elle confirme son âge et accepte les règles de SpotLa.
 */
export function AgeGate() {
  const blocked = useStore((s) => s.minorBlocked)
  const [agree, setAgree] = useState(false)
  const enter = () => useStore.setState({ adultOk: true, minorBlocked: false, adultAt: new Date().toISOString() })

  if (blocked) {
    return (
      <div className="scr">
        <div className="pad join-screen">
          <span className="join-ic big danger"><ShieldAlert size={28} /></span>
          <h1 className="h2">Accès bloqué</h1>
          <p className="muted">Tu as indiqué avoir moins de 18 ans. SpotLa propose des sorties dans des bars, des clubs et des soirées pour adultes : l'accès est donc fermé.</p>
          <p className="muted">Si tu as répondu par erreur, confirme ton âge et accepte les règles pour entrer.</p>
          <label className="adult-check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span><b>Je confirme avoir 18 ans ou plus</b><small>et j'accepte les règles de la communauté SpotLa. Fournir un faux âge est contraire à nos règles.</small></span>
          </label>
          <button className="btn btn-primary btn-block" disabled={!agree} onClick={enter}>Confirmer et entrer</button>
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
        <label className="adult-check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span><b>J'accepte les règles de la communauté SpotLa</b><small>En entrant, je confirme avoir 18 ans ou plus.</small></span>
        </label>
        <button className="btn btn-primary btn-block" disabled={!agree} onClick={enter}>Oui, j'ai 18 ans ou plus</button>
        <button className="btn btn-ghost btn-block" onClick={() => useStore.setState({ minorBlocked: true, adultOk: false })}>Non, j'ai moins de 18 ans</button>
      </div>
    </div>
  )
}
