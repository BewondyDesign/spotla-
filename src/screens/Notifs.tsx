import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Clapperboard, Heart, MapPin, UserPlus } from 'lucide-react'
import { useStore } from '../data/store'
import { timeAgo } from '../data/util'
import { Empty } from '../components/ui'
import type { Notif } from '../data/types'

const ICON: Record<Notif['kind'], React.ReactNode> = {
  nearby: <MapPin size={18} />, request: <UserPlus size={18} />, accepted: <Check size={18} />, like: <Heart size={18} />, comment: <Heart size={18} />, follow: <UserPlus size={18} />, story: <Clapperboard size={18} />,
}

export function Notifs() {
  const notifs = useStore((s) => s.notifs)
  const readNotifs = useStore((s) => s.readNotifs)
  useEffect(() => () => readNotifs(), [readNotifs])

  const askPush = async () => {
    if (!('Notification' in window)) return
    const r = await Notification.requestPermission()
    if (r === 'granted') new Notification('SpotLa', { body: 'On te préviendra quand ça se passe près de toi ce soir (1 fois par soir max).' })
  }

  return (
    <div className="scr">
      <div className="pad stack16">
        <h1 className="h2">Activité</h1>
        {'Notification' in window && Notification.permission === 'default' && (
          <button className="push-cta" onClick={askPush}>
            <Bell size={20} /><div><b>« Ça se passe près de toi ce soir »</b><span>Une alerte par soir maximum, entre 18 h et 21 h.</span></div>
          </button>
        )}
        {notifs.length === 0 && <Empty>Rien de neuf pour l'instant.</Empty>}
        <div className="notifs">
          {notifs.map((n) => {
            const body = <><span className={`n-ic n-${n.kind}`}>{ICON[n.kind]}</span><div className="grow"><b>{n.title}</b><span>{n.body}</span><small>{timeAgo(n.createdAt)}</small></div>{!n.read && <i className="n-dot" aria-label="Non lu" />}</>
            return n.link ? <Link key={n.id} to={n.link} className="notif">{body}</Link> : <div key={n.id} className="notif">{body}</div>
          })}
        </div>
      </div>
    </div>
  )
}
