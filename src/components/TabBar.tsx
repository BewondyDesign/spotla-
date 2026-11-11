import { NavLink } from 'react-router-dom'
import { Compass, Map, Plus, Ticket, User } from 'lucide-react'
import { useT } from '../data/i18n'

export function TabBar() {
  const t = useT()
  return (
    <nav className="tabbar" aria-label={t('Navigation principale', 'Main navigation')}>
      <NavLink to="/" end><Compass /><span>{t('Maintenant', 'Now')}</span></NavLink>
      <NavLink to="/map"><Map /><span>{t('Carte', 'Map')}</span></NavLink>
      <NavLink to="/create" className="fab-wrap" aria-label={t('Publier', 'Post')}><span className="fab"><Plus /></span><span>{t('Publier', 'Post')}</span></NavLink>
      <NavLink to="/sorties"><Ticket /><span>{t('Mes sorties', 'My plans')}</span></NavLink>
      <NavLink to="/u/me"><User /><span>{t('Profil', 'Profile')}</span></NavLink>
    </nav>
  )
}
