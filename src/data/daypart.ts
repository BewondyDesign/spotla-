// Moment de la journée en temps réel : matin, après-midi, soir, nuit.
// La lumière (jour, aube/crépuscule, noir) vient du vrai lever et coucher du soleil à la position de la personne,
// donc la photo d'accueil suit l'hiver (nuit à 16 h 30) comme l'été (jour jusqu'à 20 h 30).
import { useEffect, useState } from 'react'
import { useStore } from './store'

export type DayPart = 'matin' | 'aprem' | 'soir' | 'nuit'
export type Light = 'aube' | 'jour' | 'crepuscule' | 'noir'

const rad = Math.PI / 180
/** Lever et coucher du soleil en heures locales (formule NOAA simplifiée, précision de quelques minutes). */
export function sunTimes(d: Date, lat: number, lng: number) {
  const start = new Date(d.getFullYear(), 0, 0)
  const doy = Math.floor((d.getTime() - start.getTime()) / 864e5)
  const g = (2 * Math.PI / 365) * (doy - 1)
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl))) - Math.tan(lat * rad) * Math.tan(decl)
  const tz = -d.getTimezoneOffset() / 60
  const noon = (720 - 4 * lng - eqt) / 60 + tz
  if (cosH > 1) return { rise: noon, set: noon } // nuit polaire
  if (cosH < -1) return { rise: 0, set: 24 } // jour polaire
  const half = Math.acos(cosH) / rad / 15
  return { rise: noon - half, set: noon + half }
}

export function dayInfo(d = new Date(), pos = { lat: 45.5, lng: -73.57 }) {
  const h = d.getHours() + d.getMinutes() / 60
  const { rise, set } = sunTimes(d, pos.lat, pos.lng)
  // Le soir commence au coucher du soleil, mais jamais avant 16 h 30 ni après 18 h 30.
  const evening = Math.min(18.5, Math.max(16.5, set))
  const part: DayPart = h >= 22 || h < 5 ? 'nuit' : h < 12 ? 'matin' : h < evening ? 'aprem' : 'soir'
  const light: Light = h < rise - 0.4 || h > set + 0.6 ? 'noir' : h < rise + 1.2 ? 'aube' : h > set - 1.2 ? 'crepuscule' : 'jour'
  return { part, light, hour: h }
}

/** « On va où … ? » selon le moment : FR puis EN. */
export const PART_WHEN: Record<DayPart, [string, string]> = {
  matin: ['aujourd\'hui', 'today'],
  aprem: ['cet après-midi', 'this afternoon'],
  soir: ['ce soir', 'tonight'],
  nuit: ['cette nuit', 'tonight'],
}

/** Se met à jour chaque minute. */
export function useDayInfo() {
  const pos = useStore((s) => s.pos)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    const vis = () => { if (document.visibilityState === 'visible') setNow(new Date()) }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [])
  return dayInfo(now, pos)
}
