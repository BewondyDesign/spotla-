import { NavLink } from 'react-router-dom'
import { Compass, Map, Plus, Ticket, User } from 'lucide-react'

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <NavLink to="/" end><Compass /><span>Maintenant</span></NavLink>
      <NavLink to="/map"><Map /><span>Carte</span></NavLink>
      <NavLink to="/create" className="fab-wrap" aria-label="Publier"><span className="fab"><Plus /></span><span>Publier</span></NavLink>
      <NavLink to="/sorties"><Ticket /><span>Mes sorties</span></NavLink>
      <NavLink to="/u/me"><User /><span>Profil</span></NavLink>
    </nav>
  )
}
