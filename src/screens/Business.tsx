import { money } from '../data/util'
import { useShallow } from 'zustand/react/shallow'
import { Link, Navigate } from 'react-router-dom'
import { BadgeCheck, Eye, Share2, Sparkles, Users } from 'lucide-react'
import { askConfirm, goingCount, toast, useMe, useStore } from '../data/store'
import { fmtDay, fmtTime, momentOf } from '../data/util'
import { Art, PriceBadge } from '../components/ui'

export const BOOST_PRICE = money(9.99)

export function Business() {
  const me = useMe()!
  const events = useStore(useShallow((s) => s.events.filter((e) => e.hostId === me.id)))
  const boost = useStore((s) => s.boost)
  if (me.kind !== 'business') return <Navigate to="/u/me" replace />

  const upcoming = events.filter((e) => momentOf(e) !== 'past').sort((a, b) => a.start.localeCompare(b.start))
  const sum = (f: (e: (typeof events)[number]) => number) => events.reduce((n, e) => n + f(e), 0)
  const stats = [
    { i: <Eye size={18} />, l: 'Vues', v: sum((e) => e.views) },
    { i: <Users size={18} />, l: '« J\'y vais »', v: sum(goingCount) },
    { i: <Share2 size={18} />, l: 'Partages', v: sum((e) => e.shares) },
  ]

  return (
    <div className="scr">
      <div className="pad stack16">
        <div>
          <span className="eyebrow">Espace business</span>
          <h1 className="h2">{me.name}</h1>
        </div>
        <div className={`verif ${me.verified ? 'ok' : ''}`}>
          <BadgeCheck size={22} />
          <div><b>{me.verified ? 'Lieu vérifié' : 'Vérification en cours'}</b><span>{me.verified ? 'Ton badge est visible sur ta page et tes événements.' : 'On contrôle ton NEQ (Registraire des entreprises du Québec) ou un justificatif. Ça prend en général moins de 24 h.'}</span></div>
        </div>
        <div className="stats">
          {stats.map((s) => <div key={s.l} className="stat">{s.i}<b>{s.v.toLocaleString(document.documentElement.lang === 'en' ? 'en-CA' : 'fr-FR')}</b><span>{s.l}</span></div>)}
        </div>

        <div className="row between"><h2 className="sec-title">Agenda</h2><Link className="btn-mini accent" to="/create">+ Événement</Link></div>
        {upcoming.length === 0 && <p className="muted">Aucun événement à venir. Publie ta prochaine soirée pour apparaître dans « Ce soir ».</p>}
        {upcoming.map((e) => (
          <div key={e.id} className="biz-ev">
            <Link to={`/event/${e.id}`} className="row gap10 grow">
              <div className="cover mini lg"><Art colors={e.colors} /></div>
              <div className="grow"><b>{e.title}</b><span>{fmtDay(e.start)} · {fmtTime(e.start)} · {goingCount(e)} y vont · {e.views} vues</span></div>
              <PriceBadge e={e} />
            </Link>
            {e.boosted ? (
              <span className="badge b-boost"><Sparkles size={11} /> Boosté</span>
            ) : (
              <button className="btn-mini accent" onClick={async () => { if (await askConfirm(`Booster « ${e.title} » pour ${BOOST_PRICE} ? Il passe en tête de « Ce soir » dans un rayon de 3 km.`, 'Booster')) { boost(e.id); toast('Boost activé', 'Ton événement est mis en avant ce soir. (Paiement simulé dans le MVP.)') } }}>
                Booster · {BOOST_PRICE}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
