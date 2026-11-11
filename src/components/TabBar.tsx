import { NavLink } from 'react-router-dom'
import { Home, Map, Plus, Heart, User } from 'lucide-react'
import { useStore } from '../data/store'

export function TabBar() {
  const unread = useStore((s) => s.notifs.filter((n) => !n.read).length)
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <NavLink to="/" end><Home /><span>Ce soir</span></NavLink>
      <NavLink to="/map"><Map /><span>Carte</span></NavLink>
      <NavLink to="/create" className="fab-wrap" aria-label="Publier"><span className="fab"><Plus /></span></NavLink>
      <NavLink to="/notifs"><span className="bell"><Heart />{unread > 0 && <i>{unread}</i>}</span><span>Activité</span></NavLink>
      <NavLink to="/u/me"><User /><span>Profil</span></NavLink>
    </nav>
  )
}
