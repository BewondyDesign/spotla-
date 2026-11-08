import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import type { AccountKind, Post, SpotEvent, Story, User } from './types'

// Connexion à Supabase. Sans variables d'environnement, l'app reste en mode démo (données locales).
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_ANON_KEY

export const sb: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })
  : null
export const isRemote = !!sb

const must = <T,>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

// ---------- Connexion ----------
export async function sendLoginEmail(email: string) {
  const redirect = `${location.origin}${location.pathname}`
  const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } })
  if (error) throw new Error(error.message)
}
export async function verifyCode(email: string, token: string) {
  const { error } = await sb!.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw new Error(error.message)
}
export const signOut = () => sb!.auth.signOut()

export async function createProfile(p: { id: string; name: string; kind: AccountKind; vibes: string[]; venueAddress?: string }) {
  const base = p.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'membre'
  const handle = `${base}.${p.id.slice(0, 4)}`
  must(await sb!.from('profiles').insert({
    id: p.id, name: p.name, handle, kind: p.kind, vibes: p.vibes, venue_address: p.venueAddress ?? null,
    color: p.kind === 'business' ? '#8B7CFF' : '#FF4F9A',
    bio: p.kind === 'business' ? 'Compte business en cours de vérification.' : '',
  }))
}

// ---------- Lecture ----------
type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export async function loadAll(meId: string) {
  const [profiles, follows, events, addresses, att, stories, views, posts, likes, comments] = await Promise.all([
    sb!.from('profiles').select('*'),
    sb!.from('follows').select('follower, followee'),
    sb!.from('events').select('*').gte('ends_at', new Date(Date.now() - 86_400_000).toISOString()).order('starts_at'),
    sb!.from('event_addresses').select('*'),
    sb!.from('attendances').select('event_id, user_id, status'),
    sb!.from('stories').select('*').gt('expires_at', new Date().toISOString()),
    sb!.from('story_views').select('story_id, user_id').eq('user_id', meId),
    sb!.from('posts').select('*').order('created_at', { ascending: false }).limit(200),
    sb!.from('post_likes').select('post_id, user_id'),
    sb!.from('comments').select('*').order('created_at'),
  ]).then((rs) => rs.map((r) => must(r as { data: Row[]; error: { message: string } | null }) ?? []))

  const fol = follows as Row[]
  const users: User[] = (profiles as Row[]).map((p) => ({
    id: p.id, name: p.name, handle: p.handle, kind: p.kind, verified: p.verified, color: p.color, bio: p.bio, city: p.city,
    venueAddress: p.venue_address ?? undefined, vibes: p.vibes,
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
    desc: e.description, colors: (e.colors?.length === 2 ? e.colors : ['#FF4F9A', '#8B7CFF']) as [string, string],
    createdAt: e.created_at, boosted: e.boosted, views: e.views, shares: e.shares, reports: e.hidden ? 3 : 0,
  }))

  const seen = new Set((views as Row[]).map((v) => v.story_id))
  const sts: Story[] = (stories as Row[]).map((s) => ({
    id: s.id, authorId: s.author_id, eventId: s.event_id ?? undefined, caption: s.caption,
    media: { kind: 'video', url: s.video_url, duration: Number(s.duration_s) },
    createdAt: s.created_at, expiresAt: s.expires_at, seenBy: seen.has(s.id) ? [meId] : [],
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
export async function uploadMedia(me: string, file: File, folder: 'stories' | 'posts') {
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
