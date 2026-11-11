import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import type { AccountKind, Post, SpotEvent, Story, User } from './types'

// Connexion à Supabase. Sans variables d'environnement, l'app reste en mode démo (données locales).
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_ANON_KEY

export const sb: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } })
  : null
export const isRemote = !!sb

export const must = <T,>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

// ---------- Connexion (comme sur les réseaux sociaux) ----------
const home = () => `${location.origin}${location.pathname}`

/** Traduit les erreurs Supabase en messages clairs. */
function fr(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail. Connecte-toi.'
  if (m.includes('password should be') || m.includes('weak')) return 'Mot de passe trop faible : 8 caractères minimum, avec des lettres et des chiffres.'
  if (m.includes('email not confirmed')) return 'Confirme d\'abord ton e-mail avec le lien qu\'on t\'a envoyé.'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return 'La connexion avec Google n\'est pas encore activée.'
  if (m.includes('email rate limit')) return 'Trop d\'e-mails envoyés pour l\'instant. Le service d\'e-mails gratuit de Supabase est limité à quelques envois par heure.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Trop de tentatives. Réessaie dans une minute.'
  if (m.includes('profiles_handle_key') || m.includes('duplicate key')) return 'Ce nom d\'utilisateur est déjà pris.'
  return msg
}
const check = (error: { message: string } | null) => { if (error) throw new Error(fr(error.message)) }

export const cleanHandle = (h: string) => h.toLowerCase().normalize('NFD').replace(/[^a-z0-9._]/g, '').slice(0, 30)

/** Inscription. Renvoie true si le compte est actif tout de suite, false s'il faut confirmer l'e-mail. */
export async function signUp(p: { email: string; password: string; name: string; handle: string }) {
  const taken = await sb!.from('profiles').select('id').eq('handle', p.handle).maybeSingle()
  if (taken.data) throw new Error('Ce nom d\'utilisateur est déjà pris.')
  const { data, error } = await sb!.auth.signUp({ email: p.email, password: p.password, options: { emailRedirectTo: home(), data: { name: p.name, handle: p.handle } } })
  check(error)
  if (data.user && data.user.identities?.length === 0) throw new Error('Un compte existe déjà avec cet e-mail. Connecte-toi.')
  return !!data.session
}
export async function signIn(email: string, password: string) {
  const { error } = await sb!.auth.signInWithPassword({ email, password })
  check(error)
}
export async function signInWithGoogle() {
  const { error } = await sb!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: home() } })
  check(error)
}
export async function sendPasswordReset(email: string) {
  const { error } = await sb!.auth.resetPasswordForEmail(email, { redirectTo: home() })
  check(error)
}
export async function updatePassword(password: string) {
  const { error } = await sb!.auth.updateUser({ password })
  check(error)
}
/** Infos saisies à l'inscription (ou venant de Google), pour pré-remplir le profil. */
export async function signupInfo() {
  const { data } = await sb!.auth.getUser()
  const m = (data.user?.user_metadata ?? {}) as Record<string, string>
  return { name: m.name || m.full_name || '', handle: m.handle || '', avatar: m.avatar_url || m.picture || '' }
}
export const signOut = () => sb!.auth.signOut()
/** E-mail du compte, et si la connexion passe par Google. */
export async function accountInfo() {
  const { data } = await sb!.auth.getUser()
  return { email: data.user?.email ?? '', google: data.user?.app_metadata?.provider === 'google' }
}
/** Changement d'e-mail : Supabase envoie un lien de confirmation à la nouvelle adresse. */
export async function updateEmail(email: string) {
  const { error } = await sb!.auth.updateUser({ email }, { emailRedirectTo: home() })
  check(error)
}

export async function createProfile(p: { id: string; name: string; handle?: string; city?: string; kind: AccountKind; vibes: string[]; venueAddress?: string; avatarUrl?: string }) {
  const handle = p.handle ? cleanHandle(p.handle) : `${cleanHandle(p.name.replace(/\s+/g, '.')) || 'membre'}.${p.id.slice(0, 4)}`
  const { error } = await sb!.from('profiles').insert({
    id: p.id, name: p.name, handle, city: p.city ?? 'Montréal', kind: p.kind, vibes: p.vibes, venue_address: p.venueAddress ?? null,
    color: p.kind === 'business' ? '#3A3A40' : '#F2557A',
    bio: p.kind === 'business' ? 'Compte business en cours de vérification.' : '',
    ...(p.avatarUrl ? { avatar_url: p.avatarUrl } : {}),
  })
  check(error)
}

// ---------- Lecture ----------
type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

// On charge les événements dans un carré d'environ 110 km autour de la personne.
export async function loadAll(meId: string | null, pos: { lat: number; lng: number }) {
  const dLng = 1 / Math.max(0.2, Math.cos((pos.lat * Math.PI) / 180))
  const [profiles, follows, events, addresses, att, stories, views, posts, likes, comments] = await Promise.all([
    sb!.from('profiles').select('*'),
    sb!.from('follows').select('follower, followee'),
    sb!.from('events').select('*').gte('ends_at', new Date(Date.now() - 86_400_000).toISOString())
      .gte('lat', pos.lat - 1).lte('lat', pos.lat + 1).gte('lng', pos.lng - dLng).lte('lng', pos.lng + dLng).order('starts_at'),
    sb!.from('event_addresses').select('*'),
    sb!.from('attendances').select('event_id, user_id, status'),
    sb!.from('stories').select('*').gt('expires_at', new Date().toISOString()),
    meId ? sb!.from('story_views').select('story_id, user_id').eq('user_id', meId) : Promise.resolve({ data: [], error: null }),
    sb!.from('posts').select('*').order('created_at', { ascending: false }).limit(200),
    sb!.from('post_likes').select('post_id, user_id'),
    sb!.from('comments').select('*').order('created_at'),
  ]).then((rs) => rs.map((r) => must(r as { data: Row[]; error: { message: string } | null }) ?? []))

  const fol = follows as Row[]
  const users: User[] = (profiles as Row[]).map((p) => ({
    id: p.id, name: p.name, handle: p.handle, kind: p.kind, verified: p.verified, color: p.color, bio: p.bio, city: p.city,
    venueAddress: p.venue_address ?? undefined, vibes: p.vibes,
    avatarUrl: p.avatar_url ?? undefined, coverUrl: p.cover_url ?? undefined, coverKind: p.cover_kind ?? undefined,
    followers: fol.filter((f) => f.followee === p.id).length,
    following: fol.filter((f) => f.follower === p.id).map((f) => f.followee),
  }))

  const addr = new Map((addresses as Row[]).map((a) => [a.event_id, a.address]))
  const byEvent = (id: string, ...st: string[]) => (att as Row[]).filter((a) => a.event_id === id && st.includes(a.status)).map((a) => a.user_id)
  const evs: SpotEvent[] = (events as Row[]).map((e) => ({
    id: e.id, hostId: e.host_id, title: e.title, vibe: e.vibe, tags: e.tags, start: e.starts_at, end: e.ends_at,
    venue: e.venue, area: e.area, address: addr.get(e.id) ?? '', lat: e.lat, lng: e.lng, price: Number(e.price),
    ticketUrl: e.ticket_url ?? undefined, visibility: e.visibility, capacity: e.capacity ?? undefined, baseGoing: 0,
    going: byEvent(e.id, 'going', 'accepted'), requests: byEvent(e.id, 'requested'), accepted: byEvent(e.id, 'accepted'),
    desc: e.description, colors: (e.colors?.length === 2 ? e.colors : ['#3A2A31', '#18181B']) as [string, string],
    createdAt: e.created_at, boosted: e.boosted, views: e.views, shares: e.shares, reports: e.hidden ? 3 : 0,
  }))

  const seen = new Set((views as Row[]).map((v) => v.story_id))
  const sts: Story[] = (stories as Row[]).map((s) => ({
    id: s.id, authorId: s.author_id, eventId: s.event_id ?? undefined, caption: s.caption,
    media: { kind: 'video', url: s.video_url, duration: Number(s.duration_s) },
    createdAt: s.created_at, expiresAt: s.expires_at, seenBy: meId && seen.has(s.id) ? [meId] : [],
  }))

  const ps: Post[] = (posts as Row[]).map((p) => ({
    id: p.id, authorId: p.author_id, text: p.body, eventId: p.event_id ?? undefined, imageUrl: p.image_url ?? undefined,
    createdAt: p.created_at, baseLikes: 0,
    likes: (likes as Row[]).filter((l) => l.post_id === p.id).map((l) => l.user_id),
    comments: (comments as Row[]).filter((c) => c.post_id === p.id).map((c) => ({ id: c.id, authorId: c.author_id, text: c.body, createdAt: c.created_at })),
  }))

  return { users, events: evs, stories: sts, posts: ps }
}

// ---------- Écriture ----------
export const remote = {
  async createEvent(e: SpotEvent) {
    must(await sb!.from('events').insert({
      id: e.id, host_id: e.hostId, title: e.title, vibe: e.vibe, tags: e.tags, starts_at: e.start, ends_at: e.end,
      venue: e.venue, area: e.area, lat: e.lat, lng: e.lng, price: e.price, ticket_url: e.ticketUrl ?? null,
      visibility: e.visibility, capacity: e.capacity ?? null, description: e.desc, colors: e.colors,
    }))
    must(await sb!.from('event_addresses').insert({ event_id: e.id, address: e.address }))
    await sb!.from('attendances').insert({ event_id: e.id, user_id: e.hostId, status: 'going' })
  },
  async setAttendance(eventId: string, userId: string, status: 'going' | 'requested' | 'accepted' | 'declined' | null) {
    if (status === null) { must(await sb!.from('attendances').delete().match({ event_id: eventId, user_id: userId })); return }
    must(await sb!.from('attendances').upsert({ event_id: eventId, user_id: userId, status }))
  },
  async updateProfile(me: string, patch: { name?: string; handle?: string; city?: string; bio?: string; avatarUrl?: string | null; coverUrl?: string | null; coverKind?: 'image' | 'video' | null; vibes?: string[] }) {
    const row: Record<string, unknown> = {}
    if (patch.vibes !== undefined) row.vibes = patch.vibes
    if (patch.bio !== undefined) row.bio = patch.bio
    if (patch.name !== undefined) row.name = patch.name
    if (patch.handle !== undefined) row.handle = patch.handle
    if (patch.city !== undefined) row.city = patch.city
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl
    if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl
    if (patch.coverKind !== undefined) row.cover_kind = patch.coverKind
    const r = await sb!.from('profiles').update(row).eq('id', me)
    if (r.error && /avatar_url|cover_url|cover_kind|schema cache|column/i.test(r.error.message)) throw new Error('Il manque une petite mise à jour de la base : exécute supabase/profile-media.sql dans Supabase.')
    if (r.error && /profiles_handle_key|duplicate key/i.test(r.error.message)) throw new Error('Ce nom d\'utilisateur est déjà pris.')
    must(r)
  },
  async follow(me: string, other: string, on: boolean) {
    if (on) must(await sb!.from('follows').insert({ follower: me, followee: other }))
    else must(await sb!.from('follows').delete().match({ follower: me, followee: other }))
  },
  async like(postId: string, me: string, on: boolean) {
    if (on) must(await sb!.from('post_likes').insert({ post_id: postId, user_id: me }))
    else must(await sb!.from('post_likes').delete().match({ post_id: postId, user_id: me }))
  },
  async comment(id: string, postId: string, me: string, body: string) {
    must(await sb!.from('comments').insert({ id, post_id: postId, author_id: me, body }))
  },
  async remove(table: 'posts' | 'comments' | 'stories' | 'events', id: string) {
    must(await sb!.from(table).delete().eq('id', id))
  },
  async createPost(p: Post) {
    must(await sb!.from('posts').insert({ id: p.id, author_id: p.authorId, event_id: p.eventId ?? null, body: p.text, image_url: p.imageUrl ?? null }))
  },
  async createStory(s: Story) {
    if (s.media.kind !== 'video') return
    must(await sb!.from('stories').insert({ id: s.id, author_id: s.authorId, event_id: s.eventId ?? null, caption: s.caption, video_url: s.media.url, duration_s: Math.round(s.media.duration * 10) / 10 }))
  },
  async seeStory(storyId: string, me: string) {
    await sb!.from('story_views').upsert({ story_id: storyId, user_id: me })
  },
  async report(eventId: string, me: string) {
    must(await sb!.from('reports').upsert({ event_id: eventId, reporter: me }))
  },
  async boost(eventId: string) {
    must(await sb!.from('events').update({ boosted: true }).eq('id', eventId))
  },
  async bump(eventId: string, field: 'views' | 'shares') {
    await sb!.rpc('bump_event', { p_event: eventId, p_field: field })
  },
}

/** Envoie une vidéo ou une photo dans le bucket « media » et renvoie son URL publique. */
export async function uploadMedia(me: string, file: File, folder: 'stories' | 'posts' | 'profile') {
  const ext = (file.name.split('.').pop() || (file.type.startsWith('video') ? 'mp4' : 'jpg')).toLowerCase()
  const path = `${me}/${folder}/${crypto.randomUUID()}.${ext}`
  must(await sb!.storage.from('media').upload(path, file, { contentType: file.type, upsert: false }))
  return sb!.storage.from('media').getPublicUrl(path).data.publicUrl
}

/** Recharge les données quand quelque chose change dans la base (temps réel). */
export function subscribe(onChange: () => void) {
  let t: ReturnType<typeof setTimeout> | undefined
  const kick = () => { clearTimeout(t); t = setTimeout(onChange, 400) }
  const ch = sb!.channel('spotla-live')
  for (const table of ['events', 'attendances', 'stories', 'posts', 'post_likes', 'comments', 'follows', 'profiles']) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, kick)
  }
  ch.subscribe()
  return () => { sb!.removeChannel(ch) }
}
