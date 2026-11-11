import { createPortal } from 'react-dom'
import { UserPlus } from 'lucide-react'
import { useStore } from '../data/store'

/** Ce qu'on fait quand une personne sans compte veut agir : on lui propose de s'inscrire, sans perdre la page. */
const startSignup = () => useStore.setState({ guest: false, joinAsk: null })

export function JoinSheet() {
  const ask = useStore((s) => s.joinAsk)
  if (!ask) return null
  const close = () => useStore.setState({ joinAsk: null })
  return createPortal(
    <div className="backdrop fixed" onClick={close}>
      <div className="confirm join-sheet" role="dialog" aria-modal="true" aria-label="Créer un compte" onClick={(e) => e.stopPropagation()}>
        <span className="join-ic"><UserPlus size={22} /></span>
        <div className="stack4"><b className="sec-title">Crée ton compte pour {ask}</b><p className="muted small">C'est gratuit et ça prend 30 secondes. Tu reviens ensuite sur cette page.</p></div>
        <button className="btn btn-primary btn-block" onClick={startSignup}>Créer mon compte</button>
        <button className="btn btn-ghost btn-block" onClick={close}>Plus tard</button>
      </div>
    </div>,
    document.body,
  )
}

/** Page affichée à la place d'un écran qui demande un compte (Publier, Mes sorties, Profil…). */
export function JoinScreen({ what }: { what: string }) {
  return (
    <div className="scr">
      <div className="pad join-screen">
        <span className="join-ic big"><UserPlus size={28} /></span>
        <h1 className="h2">{what}</h1>
        <p className="muted">Avec un compte, tu dis « J'y vais », tu rejoins les groupes de gens qui sortent seuls et tu retrouves tes sorties ici.</p>
        <button className="btn btn-primary btn-block" onClick={startSignup}>Créer mon compte</button>
        <button className="btn btn-ghost btn-block" onClick={startSignup}>J'ai déjà un compte</button>
      </div>
    </div>
  )
}
