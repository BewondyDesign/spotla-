import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { inNextDays, isOnNow, useAgenda } from '../data/agenda'
import { AgendaCard } from '../components/AgendaCard'
import { Empty } from '../components/ui'

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

/** Tout l'agenda culturel, mois par mois. */
export function Agenda() {
  const nav = useNavigate()
  const all = useAgenda()
  const [when, setWhen] = useState<'all' | 'now' | 'week'>('all')
  const [free, setFree] = useState(false)
  const [big, setBig] = useState(false)
  const list = useMemo(() => all
    .filter((e) => !free || e.free)
    .filter((e) => !big || e.source === 'Bonjour Québec')
    .filter((e) => when === 'all' || (when === 'now' ? isOnNow(e) : inNextDays(e, 7))), [all, free, big, when])
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>()
    for (const e of list) { const k = isOnNow(e) ? 'En ce moment' : `${MOIS[Number(e.start.slice(5, 7)) - 1]} ${e.start.slice(0, 4)}`; m.set(k, [...(m.get(k) ?? []), e]) }
    return [...m.entries()]
  }, [list])
  return (
    <div className="scr settings">
      <header className="pad set-head">
        <button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
        <h1>Agenda de Montréal</h1>
        <span />
      </header>
      <div className="chips" role="group" aria-label="Filtres">
        <button className="chip" aria-pressed={when === 'all'} onClick={() => setWhen('all')}>Tout</button>
        <button className="chip" aria-pressed={when === 'now'} onClick={() => setWhen('now')}>En ce moment</button>
        <button className="chip" aria-pressed={when === 'week'} onClick={() => setWhen('week')}>7 prochains jours</button>
        <span className="chips-sep" aria-hidden="true" />
        <button className="chip" aria-pressed={free} onClick={() => setFree(!free)}>Gratuit</button>
        <button className="chip" aria-pressed={big} onClick={() => setBig(!big)}>Grands festivals</button>
      </div>
      {groups.length === 0 ? <Empty>Rien pour ces filtres.</Empty> : groups.map(([k, items]) => (
        <section key={k} className="pad stack12 agenda-month">
          <h2 className="sec-title">{k}</h2>
          <div className="agenda-grid">{items.slice(0, 40).map((e) => <AgendaCard key={e.id} e={e} wide />)}</div>
        </section>
      ))}
      <p className="pad hint center">Sources officielles : Ville de Montréal (données ouvertes, CC BY 4.0) et Bonjour Québec.</p>
    </div>
  )
}
