import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './data/store'
import { Onboarding } from './screens/Onboarding'
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
  const loc = useLocation()
  if (!meId) return <div className="app"><Onboarding /><Toast /></div>
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
