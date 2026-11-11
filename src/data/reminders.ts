import { useEffect } from 'react'
import { useStore } from './store'
import { fmtTime } from './util'

const KEY = 'spotla-reminded'
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
const write = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids.slice(-200))) } catch { /* stockage indisponible */ } }

/** Rappel de sortie : une notif dans l'app (et sur le téléphone si autorisé) ~1 h avant chaque sortie où tu vas. */
export function useOutingReminders() {
  const meId = useStore((s) => s.meId)
  useEffect(() => {
    if (!meId) return
    const check = () => {
      const { events, pushNotif } = useStore.getState()
      const done = read()
      const now = Date.now()
      for (const e of events) {
        const t = Date.parse(e.start) - now
        if (!e.going.includes(meId) || done.includes(e.id) || t < -15 * 60_000 || t > 75 * 60_000) continue
        const title = `Ta sortie commence à ${fmtTime(e.start)}`
        const body = `« ${e.title} » · ${e.venue}. Bonne sortie !`
        pushNotif({ kind: 'nearby', title, body, link: `/event/${e.id}` })
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/icon.svg' }) } catch { /* certains navigateurs refusent hors service worker */ }
        done.push(e.id)
      }
      write(done)
    }
    check()
    const t = setInterval(check, 5 * 60_000)
    return () => clearInterval(t)
  }, [meId])
}
