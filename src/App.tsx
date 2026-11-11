import { Agenda } from './screens/Agenda'
import { AgendaDetail } from './screens/AgendaDetail'
import { Settings } from './screens/Settings'
import { MySorties } from './screens/MySorties'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useMe, useStore } from './data/store'
import { isRemote, sb, subscribe } from './data/backend'
import { NewPassword, Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { PlaceDetail } from './screens/PlaceDetail'
import { EventDetail } from './screens/EventDetail'
import { Create } from './screens/Create'
import { Profile } from './screens/Profile'
import { Business } from './screens/Business'
import { Notifs } from './screens/Notifs'
import { StoryViewer } from './components/Stories'
import { TabBar } from './components/TabBar'
import { ConfirmSheet, Toast } from './components/ui'
import { JoinScreen, JoinSheet } from './components/Join'
import { EventChat } from './screens/EventChat'
import { useOutingReminders } from './data/reminders'

function Shell() {
  const meId = useStore((s) => s.meId)
  const loading = useStore((s) => s.loading)
  const recovery = useStore((s) => s.recovery)
  const guest = useStore((s) => s.guest)
  const me = useMe()
  const loc = useLocation()
  useOutingReminders()

  // Mode Supabase : on suit la session et on recharge en temps réel.
  useEffect(() => {
    if (!sb) return
    const { setSession } = useStore.getState()
    sb.auth.getSession().then(({ data }) => setSession(data.session?.user.id ?? null))
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') useStore.setState({ recovery: true })
      const id = session?.user.id ?? null
      if (id !== useStore.getState().meId) setSession(id)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  // Localisation automatique dès qu'on est dans l'app.
  // Localisation automatique à chaque ouverture, et à chaque retour dans l'app.
  // Lien partagé (événement, lieu, profil, agenda) : on laisse regarder sans compte.
  useEffect(() => {
    const p = loc.pathname
    if (!meId && !guest && (p.startsWith('/event/') || p.startsWith('/place/') || p.startsWith('/agenda') || (p.startsWith('/u/') && p !== '/u/me'))) useStore.getState().setGuest(true)
  }, [meId, guest, loc.pathname])
  useEffect(() => {
    if (!meId && !guest) return
    const go = () => { if (!useStore.getState().manual) useStore.getState().locate() }
    go()
    const onVis = () => { if (document.visibilityState === 'visible') go() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [meId, guest])
  useEffect(() => {
    if (!isRemote || (!meId && !guest)) return
    return subscribe(() => useStore.getState().reload())
  }, [meId, guest])

  if (isRemote && loading) return <div className="app"><div className="splash"><span className="dot" />SpotLa</div></div>
  if (recovery) return <div className="app"><NewPassword /><Toast /></div>
  if (!meId && !guest) return <div className="app"><Onboarding /><Toast /></div>
  if (meId && !me) return <div className="app"><Onboarding authId={meId} /><Toast /></div>
  const need = (el: React.ReactElement, what: string) => (me ? el : <JoinScreen what={what} />)
  const fullscreen = loc.pathname.startsWith('/event/') || loc.pathname.startsWith('/place/') || loc.pathname.startsWith('/stories/') || loc.pathname === '/settings' || loc.pathname.startsWith('/agenda')
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="/stories/:authorId" element={<StoryViewer />} />
        <Route path="/event/:id/chat" element={need(<EventChat />, 'Rejoins la discussion')} />
        <Route path="/create" element={need(<Create />, 'Publie une sortie ou une story')} />
        <Route path="/u/me" element={need(<Profile />, 'Ton profil SpotLa')} />
        <Route path="/u/:id" element={<Profile />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/agenda/:id" element={<AgendaDetail />} />
        <Route path="/settings" element={need(<Settings />, 'Tes réglages')} />
        <Route path="/business" element={need(<Business />, 'Ton espace pro')} />
        <Route path="/notifs" element={need(<Notifs />, 'Tes notifications')} />
        <Route path="/sorties" element={need(<MySorties />, 'Retrouve tes sorties ici')} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!fullscreen && <TabBar />}
      <Toast />
      <ConfirmSheet />
      <JoinSheet />
    </div>
  )
}

// HashRouter : l'app marche sur n'importe quel hébergement statique sans config serveur.
export function App() {
  return <HashRouter><Shell /></HashRouter>
}
