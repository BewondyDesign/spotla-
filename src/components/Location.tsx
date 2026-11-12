import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { isHidden, useStore } from '../data/store'
import { activeCatalog } from '../data/catalog'
import { useAgenda } from '../data/agenda'
import { useT } from '../data/i18n'
import { distanceKm, geocode, momentOf, RADII, type Place } from '../data/util'

/** En-tête « Autour de toi » : ville détectée + rayon. Un tap ouvre le réglage. */
export function LocationButton({ pill }: { pill?: boolean } = {}) {
  const city = useStore((s) => s.city)
  const radius = useStore((s) => s.radius)
  const geo = useStore((s) => s.geo)
  const [open, setOpen] = useState(false)
  return (
    <>
      {pill ? (
        <button className="loc-pill" onClick={() => setOpen(true)} aria-label="Changer de ville ou de rayon">
          <MapPin size={15} /><b>{city}</b><span>· {radius} km</span>{geo === 'ok' && <i className="live-dot" aria-label="Position en direct" />}<ChevronDown size={15} />
        </button>
      ) : (
      <button className="loc" onClick={() => setOpen(true)} aria-label="Changer de ville ou de rayon">
        <span className="wordmark">spotla<i /></span>
        <b>{city} <span className="loc-caret">▾</span></b>
        <small>{geo === 'locating' ? 'Localisation…' : geo === 'ok' ? <><i className="live-dot" /> Position en direct · {radius} km</> : `Rayon de ${radius} km`}</small>
      </button>
      )}
      {open && <LocationSheet onClose={() => setOpen(false)} />}
    </>
  )
}

export function LocationSheet({ onClose }: { onClose: () => void }) {
  const { locate, setPlace, setRadius } = useStore.getState()
  const radius = useStore((s) => s.radius)
  const geo = useStore((s) => s.geo)
  const pos = useStore((s) => s.pos)
  const city = useStore((s) => s.city)
  const events = useStore((s) => s.events)
  const meId = useStore((s) => s.meId)
  const agenda = useAgenda()
  const t = useT()
  // Ce que le rayon choisi donne, recalculé à chaque tap : l'accueil derrière suit en même temps.
  const found = useMemo(() => {
    const near = (x: { lat: number; lng: number }) => distanceKm(pos, x) <= radius
    return {
      ev: events.filter((e) => !isHidden(e, meId) && momentOf(e) !== 'past' && near(e)).length,
      places: activeCatalog().filter(near).length,
      acts: agenda.filter(near).length,
    }
  }, [events, agenda, pos, radius, meId])
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[]>([])

  // Recherche de ville, avec un petit délai pour ne pas interroger à chaque lettre.
  useEffect(() => {
    if (q.trim().length < 3) { setResults([]); return }
    const t = setTimeout(() => geocode(q.trim(), pos, true).then(setResults), 450)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="confirm loc-sheet" role="dialog" aria-modal="true" aria-label="Où chercher" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><b className="sec-title">Où chercher ?</b><button className="iconbtn" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div>
        <button className="btn btn-ghost btn-block" onClick={() => { locate(); onClose() }}><LocateFixed size={18} /> Utiliser ma position</button>
        {geo === 'denied' && <p className="hint">La localisation est bloquée. Autorise-la dans les réglages du navigateur, ou choisis une ville ci-dessous.</p>}
        <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Changer de ville : Laval, Québec, Toronto…" aria-label="Changer de ville" /></label>
        {q.trim().length >= 3 && results.length === 0 && <p className="hint">Aucune ville trouvée. Pour chercher un bar ou un club, utilise la recherche de la carte.</p>}
        {results.length > 0 && (
          <div className="places">
            {results.map((r) => (
              <button key={`${r.lat},${r.lng}`} onClick={() => { setPlace({ lat: r.lat, lng: r.lng, city: r.name.split(',')[0] }); onClose() }}>
                <MapPin size={16} /><span>{r.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="field">
          <span className="lbl">Rayon</span>
          <div className="seg five">
            {RADII.map((km) => <button key={km} aria-pressed={radius === km} onClick={() => setRadius(km)}>{km} km</button>)}
          </div>
        </div>
        <p className="loc-found" aria-live="polite">
          {t(`Autour de ${city}, à moins de ${radius} km :`, `Around ${city}, within ${radius} km:`)}{' '}
          <b>{found.ev} {t(found.ev > 1 ? 'sorties' : 'sortie', found.ev > 1 ? 'outings' : 'outing')}</b> · <b>{found.places} {t(found.places > 1 ? 'lieux' : 'lieu', found.places > 1 ? 'places' : 'place')}</b> · <b>{found.acts} {t(found.acts > 1 ? 'activités' : 'activité', found.acts > 1 ? 'activities' : 'activity')}</b>
        </p>
        <button className="btn btn-primary btn-block" onClick={onClose}>{t('Voir les résultats', 'See results')}</button>
      </div>
    </div>
  )
}
