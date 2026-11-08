import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useMe, useStore } from './data/store'
import { isRemote, sb, subscribe } from './data/backend'
import { NewPassword, Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { EventDetail } from './screens/EventDetail'
import { Create } from './screens/Create'
import { Profile } from './screens/Profile'
import { Business } from './screens/Business'
import { Notifs } from './screens/Notifs'
import { StoryViewer } from './components/Stories'
import { TabBar } from './components/TabBar'
import { ConfirmSheet, Toast } from './components/ui'

function Shell() {
  const meId = useStore((s) => s.meId)
  const loading = useStore((s) => s.loading)
  const recovery = useStore((s) => s.recovery)
  const me = useMe()
  const loc = useLocation()

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
  useEffect(() => {
    if (!meId) return
    const go = () => { if (!useStore.getState().manual) useStore.getState().locate() }
    go()
    const onVis = () => { if (document.visibilityState === 'visible') go() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [meId])
  useEffect(() => {
    if (!isRemote || !meId) return
    return subscribe(() => useStore.getState().reload())
  }, [meId])

  if (isRemote && loading) return <div className="app"><div className="splash"><span className="dot" />SpotLa</div></div>
  if (recovery) return <div className="app"><NewPassword /><Toast /></div>
  if (!meId) return <div className="app"><Onboarding /><Toast /></div>
  if (!me) return <div className="app"><Onboarding authId={meId} /><Toast /></div>
  const fullscreen = loc.pathname.startsWith('/event/') || loc.pathname.startsWith('/stories/')
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/stories/:authorId" element={<StoryViewer />} />
        <Route path="/create" element={<Create />} />
        <Route path="/u/:id" element={<Profile />} />
        <Route path="/business" element={<Business />} />
        <Route path="/notifs" element={<Notifs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!fullscreen && <TabBar />}
      <Toast />
      <ConfirmSheet />
    </div>
  )
}

// HashRouter : l'app marche sur n'importe quel hébergement statique sans config serveur.
export function App() {
  return <HashRouter><Shell /></HashRouter>
}
