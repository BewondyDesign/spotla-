import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccountKind, Notif, Post, SpotEvent, Story, StoryMedia, User } from './types'
import { SEED_USERS, seedEvents, seedNotifs, seedPosts, seedStories } from './seed'
import { distanceKm, MONTREAL, PARIS, RADII, reverseCity, uid as localUid } from './util'
import { isForKids } from './adult'
import { isRemote, loadAll, remote, signOut } from './backend'

// En mode Supabase, les ids sont des UUID partagés avec la base.
const uid = (p: string) => (isRemote ? crypto.randomUUID() : localUid(p))
/** Lance l'écriture distante sans bloquer l'interface ; en cas d'échec, on prévient et on recharge. */
const sync = (fn: () => Promise<unknown>) => {
  if (!isRemote) return
  fn().catch((e: Error) => { toast('Ça n\'a pas marché', e.message); useStore.getState().reload() })
}

// État de l'app. Pour le MVP tout est stocké sur l'appareil (localStorage + IndexedDB).
// Chaque action correspond à un appel d'API futur (voir supabase/schema.sql).

const today = () => new Date().toDateString()
let watchId: number | null = null

interface State {
  meId: string | null
  /** Visite sans compte : on parcourt tout, le compte est demandé au premier « J'y vais ». */
  guest: boolean
  /** A confirmé avoir 18 ans ou plus (inscription ou écran d'âge). */
  adultOk: boolean
  /** Raison affichée dans la feuille « Crée ton compte » (null = fermée). */
  joinAsk: string | null
  setGuest: (on: boolean) => void
  users: User[]
  events: SpotEvent[]
  stories: Story[]
  posts: Post[]
  notifs: Notif[]
  vibes: string[]
  pos: { lat: number; lng: number }
  /** Ville affichée (trouvée depuis la position) */
  city: string
  /** Rayon de recherche en km */
  radius: number
  geo: 'idle' | 'locating' | 'ok' | 'denied'
  /** true si la ville a été choisie à la main */
  manual: boolean
  locate: () => void
  setPlace: (p: { lat: number; lng: number; city: string }) => void
  setRadius: (km: number) => void
  seedDay: string
  loading: boolean
  /** Retour d'un lien « mot de passe oublié » : on demande le nouveau mot de passe. */
  recovery: boolean

  reload: () => Promise<void>
  setSession: (id: string | null) => Promise<void>

  onboard: (p: { name: string; kind: AccountKind; vibes: string[]; venueAddress?: string }) => void
  logout: () => void
  setPos: (p: { lat: number; lng: number }) => void
  toggleGoing: (eventId: string) => void
  requestJoin: (eventId: string) => void
  answerRequest: (eventId: string, userId: string, ok: boolean) => void
  createEvent: (e: Omit<SpotEvent, 'id' | 'hostId' | 'going' | 'requests' | 'accepted' | 'createdAt' | 'baseGoing' | 'views' | 'shares' | 'reports'>) => string
  createStory: (s: { eventId?: string; caption: string; media: StoryMedia }) => void
  seeStory: (id: string) => void
  createPost: (p: { text: string; eventId?: string; imageKey?: string; imageUrl?: string }) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, text: string) => void
  deletePost: (postId: string) => void
  deleteComment: (postId: string, commentId: string) => void
  deleteStory: (storyId: string) => void
  deleteEvent: (eventId: string) => void
  toggleFollow: (userId: string) => void
  updateProfile: (patch: { name?: string; handle?: string; city?: string; bio?: string; avatarUrl?: string; coverUrl?: string; coverKind?: 'image' | 'video'; vibes?: string[] }) => Promise<void>
  report: (eventId: string) => void
  boost: (eventId: string) => void
  bump: (eventId: string, field: 'views' | 'shares') => void
  readNotifs: () => void
  pushNotif: (n: Omit<Notif, 'id' | 'createdAt' | 'read'>) => void
}

function freshSeed() {
  return { users: SEED_USERS, events: seedEvents(), stories: seedStories(), posts: seedPosts(), notifs: seedNotifs(), seedDay: today() }
}

const mapEv = (s: State, id: string, f: (e: SpotEvent) => SpotEvent) => s.events.map((e) => (e.id === id ? f(e) : e))
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      meId: null,
      guest: false,
      adultOk: false,
      joinAsk: null,
      setGuest: (on) => { set({ guest: on, joinAsk: null }); if (on) get().reload() },
      vibes: [],
      // Ville de lancement : Montréal (le mode démo garde ses données de Paris).
      pos: isRemote ? MONTREAL : PARIS,
      city: isRemote ? 'Montréal' : 'Paris',
      radius: 10,
      geo: 'idle',
      manual: false,

      // Position GPS du téléphone, puis nom de la ville. Les événements sont recalculés autour.
      // Suivi GPS en continu tant que l'app est ouverte : où que tu sois, la position se met à jour seule.
      locate: () => {
        if (!navigator.geolocation) { set({ geo: 'denied' }); return }
        if (watchId != null) navigator.geolocation.clearWatch(watchId)
        set({ geo: 'locating', manual: false })
        let lastCity: { lat: number; lng: number } | null = null
        let lastLoad: { lat: number; lng: number } | null = null
        watchId = navigator.geolocation.watchPosition(
          async (p) => {
            const pos = { lat: p.coords.latitude, lng: p.coords.longitude }
            const prev = get().pos
            // On ignore les micro-variations du GPS (moins de 50 m).
            if (get().geo !== 'ok' || distanceKm(prev, pos) > 0.05) set({ pos, geo: 'ok' })
            if (!lastLoad || distanceKm(lastLoad, pos) > 2) { lastLoad = pos; get().reload() }
            if (!lastCity || distanceKm(lastCity, pos) > 2) {
              lastCity = pos
              const city = await reverseCity(pos.lat, pos.lng)
              if (city) set({ city })
            }
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) { set({ geo: 'denied' }); return }
            // GPS lent (intérieur) : on prend tout de suite une position approximative (Wi-Fi / antennes).
            navigator.geolocation.getCurrentPosition(
              (p) => { if (get().geo !== 'ok') { set({ pos: { lat: p.coords.latitude, lng: p.coords.longitude }, geo: 'ok' }); get().reload(); reverseCity(p.coords.latitude, p.coords.longitude).then((city) => city && set({ city })) } },
              () => { if (get().geo !== 'ok') set({ geo: 'denied' }) },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 300_000 },
            )
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10_000 },
        )
      },
      // Ville choisie à la main : on arrête de suivre le GPS jusqu'à « Utiliser ma position ».
      setPlace: ({ lat, lng, city }) => {
        if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null }
        set({ pos: { lat, lng }, city, geo: 'ok', manual: true })
        get().reload()
      },
      setRadius: (km) => set({ radius: RADII.includes(km) ? km : 10 }),
      ...(isRemote ? { users: [], events: [], stories: [], posts: [], notifs: [], seedDay: today() } : freshSeed()),
      loading: isRemote,
      recovery: false,

      reload: async () => {
        const me = get().meId
        if (!isRemote || (!me && !get().guest)) return
        try {
          const data = await loadAll(me, get().pos)
          set({ ...data, loading: false })
        } catch (e) {
          set({ loading: false })
          toast('Connexion impossible', (e as Error).message)
        }
      },
      setSession: async (id) => {
        set({ meId: id, loading: !!id || get().guest })
        if (id || get().guest) await get().reload()
      },

      onboard: ({ name, kind, vibes, venueAddress }) => {
        const id = 'me'
        const me: User = {
          id, name, kind, venueAddress, vibes,
          handle: name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'moi',
          verified: false, color: kind === 'business' ? '#3A3A40' : '#F2557A',
          bio: kind === 'business' ? 'Compte business en cours de vérification.' : '', city: 'Paris', followers: 0, following: [],
        }
        set((s) => ({ meId: id, vibes, users: [...s.users.filter((u) => u.id !== id), me] }))
        if (kind === 'business') {
          // Simulation de la vérification (en vrai : contrôle du NEQ + modération humaine).
          setTimeout(() => {
            set((s) => ({ users: s.users.map((u) => (u.id === 'me' ? { ...u, verified: true, bio: 'Lieu vérifié par SpotLa.' } : u)) }))
            get().pushNotif({ kind: 'accepted', title: 'Compte business vérifié', body: 'Ton badge vérifié est actif. Tes événements sont mis en avant.', link: '/business' })
          }, 8000)
        }
      },
      logout: () => {
        if (isRemote) { signOut(); set({ meId: null, users: [], events: [], stories: [], posts: [], notifs: [] }); return }
        set({ meId: null, ...freshSeed() })
      },
      setPos: (pos) => set({ pos }),

      toggleGoing: (eventId) => {
        if (!requireAccount('dire que tu y vas')) return
        const me = get().meId!
        const was = get().events.find((e) => e.id === eventId)?.going.includes(me)
        set((s) => ({ events: mapEv(s, eventId, (e) => ({ ...e, going: toggle(e.going, me) })) }))
        sync(() => remote.setAttendance(eventId, me, was ? null : 'going'))
      },

      requestJoin: (eventId) => {
        if (!requireAccount('demander ta place')) return
        set((s) => ({ events: mapEv(s, eventId, (e) => ({ ...e, requests: toggle(e.requests, s.meId!) })) }))
        const e = get().events.find((x) => x.id === eventId)
        if (isRemote) { sync(() => remote.setAttendance(eventId, get().meId!, e?.requests.includes(get().meId!) ? 'requested' : null)); return }
        if (!e || e.hostId === get().meId || !e.requests.includes(get().meId!)) return
        // Démo : l'organisateur accepte au bout de quelques secondes.
        setTimeout(() => {
          const cur = get().events.find((x) => x.id === eventId)
          if (!cur || !cur.requests.includes('me')) return
          get().answerRequest(eventId, 'me', true)
          get().pushNotif({ kind: 'accepted', title: 'Demande acceptée 🎉', body: `Tu es sur la liste pour « ${cur.title} ». L'adresse est maintenant visible.`, link: `/event/${eventId}` })
        }, 6000)
      },

      answerRequest: (eventId, userId, ok) => {
        sync(() => remote.setAttendance(eventId, userId, ok ? 'accepted' : 'declined'))
        set((s) => ({
          events: mapEv(s, eventId, (e) => ({
            ...e,
            requests: e.requests.filter((x) => x !== userId),
            accepted: ok ? [...new Set([...e.accepted, userId])] : e.accepted,
            going: ok ? [...new Set([...e.going, userId])] : e.going,
          })),
        }))
      },

      createEvent: (data) => {
        const id = uid('ev')
        const e: SpotEvent = { ...data, id, hostId: get().meId!, going: [get().meId!], requests: [], accepted: [], createdAt: new Date().toISOString(), baseGoing: 0, views: 0, shares: 0, reports: 0 }
        set((s) => ({ events: [e, ...s.events] }))
        sync(() => remote.createEvent(e))
        if (!isRemote && e.visibility === 'request' || e.visibility === 'circle') {
          // Démo : deux personnes demandent à venir peu après la publication.
          setTimeout(() => {
            set((s) => ({ events: mapEv(s, id, (x) => ({ ...x, requests: [...new Set([...x.requests, 'u-ines', 'u-quai9'])] })) }))
            get().pushNotif({ kind: 'request', title: '2 demandes pour ta soirée', body: `Inès L. et Collectif Quai 9 veulent venir à « ${e.title} ».`, link: `/event/${id}` })
          }, 7000)
        }
        return id
      },

      createStory: ({ eventId, caption, media }) => {
        const now = Date.now()
        const st: Story = { id: uid('st'), authorId: get().meId!, eventId, caption, media, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 24 * 3_600_000).toISOString(), seenBy: [] }
        set((s) => ({ stories: [st, ...s.stories] }))
        sync(() => remote.createStory(st))
      },
      seeStory: (id) => {
        if (!get().meId) return
        if (get().stories.find((x) => x.id === id)?.seenBy.includes(get().meId!)) return
        sync(() => remote.seeStory(id, get().meId!))
        set((s) => ({ stories: s.stories.map((st) => (st.id === id && !st.seenBy.includes(s.meId!) ? { ...st, seenBy: [...st.seenBy, s.meId!] } : st)) }))
      },

      createPost: ({ text, eventId, imageKey, imageUrl }) => {
        const p: Post = { id: uid('p'), authorId: get().meId!, text, eventId, imageKey, imageUrl, createdAt: new Date().toISOString(), likes: [], baseLikes: 0, comments: [] }
        set((s) => ({ posts: [p, ...s.posts] }))
        sync(() => remote.createPost(p))
      },
      toggleLike: (postId) => {
        if (!requireAccount('aimer une publication')) return
        const me = get().meId!
        sync(() => remote.like(postId, me, !get().posts.find((p) => p.id === postId)?.likes.includes(me)))
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, likes: toggle(p.likes, s.meId!) } : p)) }))
      },
      addComment: (postId, text) => {
        if (!requireAccount('commenter')) return
        const id = uid('c')
        sync(() => remote.comment(id, postId, get().meId!, text))
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { id, authorId: s.meId!, text, createdAt: new Date().toISOString() }] } : p)) }))
      },

      // Chacun peut supprimer ce qu'il a publié, quand il veut (la base refuse le reste).
      deletePost: (postId) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }))
        sync(() => remote.remove('posts', postId))
      },
      deleteComment: (postId, commentId) => {
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)) }))
        sync(() => remote.remove('comments', commentId))
      },
      deleteStory: (storyId) => {
        set((s) => ({ stories: s.stories.filter((st) => st.id !== storyId) }))
        sync(() => remote.remove('stories', storyId))
      },
      deleteEvent: (eventId) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== eventId), posts: s.posts.map((p) => (p.eventId === eventId ? { ...p, eventId: undefined } : p)) }))
        sync(() => remote.remove('events', eventId))
      },

      updateProfile: async (patch) => {
        const me = get().meId!
        if (isRemote) await remote.updateProfile(me, patch)
        set((s) => ({ users: s.users.map((u) => (u.id === me ? { ...u, ...patch } : u)), ...(patch.vibes ? { vibes: patch.vibes } : {}) }))
      },
      toggleFollow: (userId) => {
        if (!requireAccount("suivre quelqu'un")) return
        const me = get().meId!
        sync(() => remote.follow(me, userId, !get().users.find((u) => u.id === me)?.following.includes(userId)))
        set((s) => ({
          users: s.users.map((u) => {
            if (u.id === s.meId) return { ...u, following: toggle(u.following, userId) }
            if (u.id === userId) {
              const me = s.users.find((x) => x.id === s.meId)
              const was = me?.following.includes(userId)
              return { ...u, followers: u.followers + (was ? -1 : 1) }
            }
            return u
          }),
        }))
      },

      // Au-delà de 3 signalements, l'événement est masqué en attendant la modération.
      report: (eventId) => {
        if (isRemote) { sync(() => remote.report(eventId, get().meId!)); return }
        set((s) => ({ events: mapEv(s, eventId, (e) => ({ ...e, reports: e.reports + 1 })) }))
      },
      boost: (eventId) => {
        sync(() => remote.boost(eventId))
        set((s) => ({ events: mapEv(s, eventId, (e) => ({ ...e, boosted: true })) }))
      },
      bump: (eventId, field) => {
        sync(() => remote.bump(eventId, field))
        set((s) => ({ events: mapEv(s, eventId, (e) => ({ ...e, [field]: e[field] + 1 })) }))
      },

      readNotifs: () => set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })),
      pushNotif: (n) => {
        set((s) => ({ notifs: [{ ...n, id: uid('n'), createdAt: new Date().toISOString(), read: false }, ...s.notifs] }))
        useToast.getState().show(n.title, n.body)
      },
    }),
    {
      name: isRemote ? 'spotla-live' : 'spotla-v1',
      // En mode Supabase, seules les préférences restent sur l'appareil ; les données viennent de la base.
      partialize: (s) => (isRemote ? { pos: s.pos, city: s.city, radius: s.radius, vibes: s.vibes, guest: s.guest, adultOk: s.adultOk } : { ...s, recovery: false, geo: 'idle', manual: false }) as State,
      // Chaque jour, on régénère les données de démo pour garder des horaires réalistes,
      // sans toucher à ce que l'utilisateur a créé.
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined
        if (!p) return current
        if (isRemote) return { ...current, pos: p.pos ?? current.pos, city: p.city ?? current.city, radius: p.radius ?? current.radius, vibes: p.vibes ?? current.vibes, guest: !!p.guest, adultOk: !!p.adultOk }
        if (p.seedDay === today()) return { ...current, ...p, geo: 'idle' }
        const seed = freshSeed()
        const mine = <T extends { id: string }>(arr: T[] | undefined, seedArr: T[]) => (arr ?? []).filter((x) => !seedArr.some((y) => y.id === x.id))
        return {
          ...current,
          ...p,
          ...seed,
          users: [...seed.users, ...mine(p.users, seed.users)],
          events: [...mine(p.events, seed.events), ...seed.events],
          stories: [...mine(p.stories, seed.stories), ...seed.stories],
          posts: [...mine(p.posts, seed.posts), ...seed.posts],
          notifs: [...seed.notifs, ...mine(p.notifs, seed.notifs)],
        }
      },
    },
  ),
)

export const useMe = () => useStore((s) => s.users.find((u) => u.id === s.meId) ?? null)

/** Les événements signalés 3 fois ou plus sont masqués (sauf pour leur organisateur). */
// Masqué : signalé 3 fois, ou visant des enfants / familles (SpotLa est réservé aux 18 ans et plus).
export const isHidden = (e: SpotEvent, meId: string | null) => (e.reports >= 3 && e.hostId !== meId) || isForKids(e.title, e.desc, e.vibe)

/** Les invités d'une soirée privée voient l'adresse exacte à partir de 2 h avant le début. */
export const ADDRESS_HOURS_BEFORE = 2
export const addressWindowOpen = (e: SpotEvent) => Date.now() >= Date.parse(e.start) - ADDRESS_HOURS_BEFORE * 3600_000

/** Adresse exacte visible ? Lieux publics : toujours. Soirées privées : invités acceptés, à partir de 2 h avant. */
export function canSeeAddress(e: SpotEvent, me: User | null) {
  if (e.visibility === 'open' || e.visibility === 'limited') return true
  if (!me) return false
  if (e.hostId === me.id) return true
  const invited = e.accepted.includes(me.id) || (e.visibility === 'circle' && me.following.includes(e.hostId))
  return invited && addressWindowOpen(e)
}

export const goingCount = (e: SpotEvent) => e.baseGoing + e.going.length

// ---------- Toasts (non persistés) ----------
interface ToastState { t: { title: string; body?: string } | null; show: (title: string, body?: string) => void }
let timer: ReturnType<typeof setTimeout> | undefined
export const useToast = create<ToastState>((set) => ({
  t: null,
  show: (title, body) => {
    set({ t: { title, body } })
    clearTimeout(timer)
    timer = setTimeout(() => set({ t: null }), 3500)
  },
}))
export const toast = (title: string, body?: string) => useToast.getState().show(title, body)

// ---------- Fenêtre de confirmation dans l'app (remplace window.confirm) ----------
interface ConfirmState { q: { text: string; ok: string; resolve: (v: boolean) => void } | null }
export const useConfirm = create<ConfirmState>(() => ({ q: null }))
export const askConfirm = (text: string, ok = 'Confirmer') =>
  new Promise<boolean>((resolve) => useConfirm.setState({ q: { text, ok, resolve } }))

/** À appeler avant une action qui demande un compte. Sans compte, ouvre la feuille d'inscription et renvoie false. */
export function requireAccount(reason: string) {
  if (useStore.getState().meId) return true
  useStore.setState({ joinAsk: reason })
  return false
}
