// Les autres écrans se chargent à part (l'ouverture ne télécharge que l'accueil),
// puis en arrière-plan une fois l'ouverture terminée : un tap ensuite est instantané.
const LOADERS: Record<string, () => Promise<unknown>> = import.meta.glob(['./screens/*.tsx', '!./screens/{Home,Onboarding,Explore,Legal}.tsx'])
const load = (path: string) => LOADERS[path + '.tsx']() as Promise<Record<string, unknown>>
function usePrefetchScreens() {
  useEffect(() => {
    const go = () => Object.values(LOADERS).forEach((f) => f().catch(() => {}))
    const id = setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(go) : go()), 12000)
    return () => clearTimeout(id)
  }, [])
}
const Agenda = lazy(() => load('./screens/Agenda').then((m) => ({ default: (m as Record<string, React.ComponentType>).Agenda })))
const AgendaDetail = lazy(() => load('./screens/AgendaDetail').then((m) => ({ default: (m as Record<string, React.ComponentType>).AgendaDetail })))
const Settings = lazy(() => load('./screens/Settings').then((m) => ({ default: (m as Record<string, React.ComponentType>).Settings })))
const MySorties = lazy(() => load('./screens/MySorties').then((m) => ({ default: (m as Record<string, React.ComponentType>).MySorties })))
import { lazy, Suspense, useEffect } from 'react'
import { SkelScreen } from './components/Skeleton'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useConfirm, useMe, useStore } from './data/store'
import { isRemote, sb, subscribe } from './data/backend'
import { NewPassword, Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
const MapScreen = lazy(() => load('./screens/MapScreen').then((m) => ({ default: (m as Record<string, React.ComponentType>).MapScreen })))
const PlaceDetail = lazy(() => load('./screens/PlaceDetail').then((m) => ({ default: (m as Record<string, React.ComponentType>).PlaceDetail })))
const EventDetail = lazy(() => load('./screens/EventDetail').then((m) => ({ default: (m as Record<string, React.ComponentType>).EventDetail })))
const Create = lazy(() => load('./screens/Create').then((m) => ({ default: (m as Record<string, React.ComponentType>).Create })))
const Profile = lazy(() => load('./screens/Profile').then((m) => ({ default: (m as Record<string, React.ComponentType>).Profile })))
const Business = lazy(() => load('./screens/Business').then((m) => ({ default: (m as Record<string, React.ComponentType>).Business })))
const Notifs = lazy(() => load('./screens/Notifs').then((m) => ({ default: (m as Record<string, React.ComponentType>).Notifs })))
import { StoryViewer } from './components/Stories'
import { TabBar } from './components/TabBar'
import { ConfirmSheet, Toast } from './components/ui'
import { JoinScreen, JoinSheet } from './components/Join'
const EventChat = lazy(() => load('./screens/EventChat').then((m) => ({ default: (m as Record<string, React.ComponentType>).EventChat })))
import { useOutingReminders } from './data/reminders'
import { AgeGate } from './components/AgeGate'
import { Explore } from './screens/Explore'
import { Intro } from './components/Intro'
import { startAutoTranslate, useLang } from './data/i18n'
import { Legal } from './screens/Legal'
import { ReportSheet } from './components/ReportSheet'
import { startSafety } from './data/safety'

function Shell() {
  const meId = useStore((s) => s.meId)
  const loading = useStore((s) => s.loading)
  const recovery = useStore((s) => s.recovery)
  const guest = useStore((s) => s.guest)
  const adultOk = useStore((s) => s.adultOk)
  const minorBlocked = useStore((s) => s.minorBlocked)
  const me = useMe()
  const loc = useLocation()
  useOutingReminders()
  // Changer d'écran ferme une question restée ouverte (comme « Annuler »).
  useEffect(() => { const q = useConfirm.getState().q; if (q) { useConfirm.setState({ q: null }); q.resolve(false) } }, [loc.pathname])

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

  // Pages légales : publiques, lisibles sans compte ni écran d'âge (liens donnés à Apple, Google et Meta).
  if (loc.pathname.startsWith('/legal')) return <div className="app"><Routes><Route path="/legal/:doc" element={<Legal />} /><Route path="*" element={<Legal />} /></Routes><Toast /></div>
  // Moins de 18 ans : rien d'autre ne s'affiche (ni inscription, ni visite) tant que l'âge n'est pas confirmé.
  if (minorBlocked) return <div className="app"><AgeGate /></div>
  // Premier chargement : la forme de l'accueil s'affiche tout de suite (squelette), pas un écran vide.
  if (isRemote && loading) return <div className="app"><SkelScreen home /></div>
  if (recovery) return <div className="app"><NewPassword /><Toast /></div>
  if (!meId && !guest) return <div className="app"><Onboarding /><Toast /></div>
  if (meId && !me) return <div className="app"><Onboarding authId={meId} /><Toast /></div>
  // Règle d'âge : personne n'entre dans l'app sans avoir confirmé ses 18 ans (avec ou sans compte).
  if (!adultOk) return <div className="app"><AgeGate /><Toast /></div>
  const need = (el: React.ReactElement, what: string) => (me ? el : <JoinScreen what={what} />)
  const fullscreen = loc.pathname.startsWith('/event/') || loc.pathname.startsWith('/place/') || loc.pathname.startsWith('/stories/') || loc.pathname === '/settings' || loc.pathname.startsWith('/agenda') || loc.pathname.startsWith('/explore/')
  return (
    <div className="app">
      <Suspense fallback={<SkelScreen />}>
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
        <Route path="/explore/:k" element={<Explore />} />
        <Route path="/agenda/:id" element={<AgendaDetail />} />
        <Route path="/settings" element={need(<Settings />, 'Tes réglages')} />
        <Route path="/business" element={need(<Business />, 'Ton espace pro')} />
        <Route path="/notifs" element={need(<Notifs />, 'Tes notifications')} />
        <Route path="/sorties" element={need(<MySorties />, 'Retrouve tes sorties ici')} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      {!fullscreen && <TabBar />}
      <Toast />
      <ConfirmSheet />
      <JoinSheet />
      <ReportSheet />
    </div>
  )
}

// HashRouter : l'app marche sur n'importe quel hébergement statique sans config serveur.
export function App() {
  const lang = useLang((s) => s.lang)
  useEffect(() => { startAutoTranslate(lang) }, [lang])
  useEffect(() => { startSafety() }, [])
  usePrefetchScreens()
  // Changer de langue remonte l'app : le texte d'origine revient, puis il est traduit si besoin.
  return <><HashRouter key={lang}><Shell /></HashRouter><Intro /></>
}
