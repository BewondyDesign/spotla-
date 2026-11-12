// Sécurité et modération (exigences App Store 1.2 et Google Play « contenu généré par les utilisateurs ») :
// bloquer un membre, signaler n'importe quel contenu, filtrer les textes inappropriés, supprimer son compte.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isRemote, sb } from './backend'
import { toast, useStore } from './store'
import { isForKids, KIDS_REFUSED } from './adult'

export type ReportKind = 'user' | 'post' | 'comment' | 'story' | 'message' | 'event' | 'support'

export const REPORT_REASONS: { k: string; fr: string; en: string }[] = [
  { k: 'inapproprie', fr: 'Contenu sexuel ou choquant', en: 'Sexual or shocking content' },
  { k: 'harcelement', fr: 'Harcèlement ou propos haineux', en: 'Harassment or hate speech' },
  { k: 'danger', fr: 'Violence ou mise en danger', en: 'Violence or danger' },
  { k: 'mineur', fr: 'Personne mineure ou contenu pour enfants', en: 'Minor or content for children' },
  { k: 'arnaque', fr: 'Arnaque, faux profil ou spam', en: 'Scam, fake profile or spam' },
  { k: 'autre', fr: 'Autre chose', en: 'Something else' },
]

interface Safety {
  blocked: string[]
  setBlocked: (ids: string[]) => void
}
export const useSafety = create<Safety>()(persist((set) => ({ blocked: [], setBlocked: (blocked) => set({ blocked }) }), { name: 'spotla-blocks' }))
export const isBlocked = (userId?: string | null) => !!userId && useSafety.getState().blocked.includes(userId)

/** Retire du fil tout ce qui vient d'un membre bloqué (publications, commentaires, stories, sorties). */
function purge() {
  const b = useSafety.getState().blocked
  if (!b.length) return
  const s = useStore.getState()
  const bad = s.posts.some((p) => b.includes(p.authorId) || p.comments.some((c) => b.includes(c.authorId)))
    || s.stories.some((x) => b.includes(x.authorId)) || s.events.some((e) => b.includes(e.hostId))
  if (!bad) return
  useStore.setState({
    posts: s.posts.filter((p) => !b.includes(p.authorId)).map((p) => (p.comments.some((c) => b.includes(c.authorId)) ? { ...p, comments: p.comments.filter((c) => !b.includes(c.authorId)) } : p)),
    stories: s.stories.filter((x) => !b.includes(x.authorId)),
    events: s.events.filter((e) => !b.includes(e.hostId)),
  })
}
let started = false
/** À lancer une fois : applique les blocages à chaque chargement de données et récupère la liste du compte. */
export function startSafety() {
  if (started) return
  started = true
  useStore.subscribe(purge)
  useSafety.subscribe(purge)
  let lastMe: string | null = null
  const sync = async () => {
    const me = useStore.getState().meId
    if (!isRemote || !me || me === lastMe) return
    lastMe = me
    const { data } = await sb!.from('blocks').select('blocked').eq('blocker', me)
    if (data) useSafety.getState().setBlocked([...new Set([...useSafety.getState().blocked, ...data.map((r: { blocked: string }) => r.blocked)])])
  }
  useStore.subscribe(sync)
  sync()
}

export async function blockUser(userId: string) {
  const s = useStore.getState()
  if (!s.meId || userId === s.meId) return
  useSafety.getState().setBlocked([...new Set([...useSafety.getState().blocked, userId])])
  // On arrête aussi de le suivre.
  if (s.users.find((u) => u.id === s.meId)?.following.includes(userId)) s.toggleFollow(userId)
  if (isRemote) await sb!.from('blocks').upsert({ blocker: s.meId, blocked: userId })
}
export async function unblockUser(userId: string) {
  const s = useStore.getState()
  useSafety.getState().setBlocked(useSafety.getState().blocked.filter((x) => x !== userId))
  if (isRemote && s.meId) await sb!.from('blocks').delete().match({ blocker: s.meId, blocked: userId })
  if (isRemote) s.reload()
}

export async function reportContent(kind: ReportKind, targetId: string | null, reason: string) {
  const me = useStore.getState().meId
  if (isRemote) {
    if (!me) throw new Error('Connecte-toi pour envoyer un signalement.')
    const { error } = await sb!.from('content_reports').insert({ reporter: me, kind, target_id: targetId, reason: reason.slice(0, 1000) })
    if (error) throw new Error(/content_reports|schema cache/i.test(error.message) ? 'Le signalement n\'est pas encore activé (supabase/store-compliance.sql).' : error.message)
  }
}

// ---------- Filtre de texte ----------
// Insultes, propos haineux, contenu sexuel explicite et drogues dures (FR + EN). Les mots sont comparés sans accents.
const BAD = [
  'connard', 'connasse', 'salope', 'pute', 'putain de', 'encule', 'enculé', 'nique ta', 'ntm', 'fils de pute', 'batard', 'tapette', 'gouine', 'negro', 'negre', 'bougnoule', 'youpin', 'chinetoque', 'sale arabe', 'sale noir', 'sale juif',
  'fuck you', 'motherfucker', 'bitch', 'whore', 'slut', 'cunt', 'faggot', 'fag', 'nigger', 'nigga', 'kike', 'spic', 'chink',
  'porn', 'porno', 'nude', 'nudes', 'escort', 'sexe tarife', 'onlyfans', 'plan cul',
  'cocaine', 'cocaïne', 'coke a vendre', 'mdma a vendre', 'ecstasy a vendre', 'ghb', 'fentanyl', 'crack a vendre',
  'je vais te tuer', 'kill yourself', 'kys', 'suicide toi',
]
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ')
const BAD_RE = new RegExp(`(^| )(${[...new Set(BAD.map(norm))].map((w) => w.trim().replace(/ /g, ' ')).join('|')})( |$)`)
export const CONTENT_REFUSED = 'Ce texte contient des mots interdits par les règles de SpotLa (insultes, haine, contenu sexuel ou drogues). Modifie-le pour publier.'

/** Renvoie le message d'erreur si le texte est refusé, sinon null. */
export function checkText(...texts: (string | undefined | null)[]) {
  const joined = texts.filter(Boolean).join(' ')
  if (!joined.trim()) return null
  if (isForKids(joined)) return KIDS_REFUSED
  if (BAD_RE.test(` ${norm(joined)} `)) return CONTENT_REFUSED
  return null
}
/** Vérifie et prévient la personne. true = on peut publier. */
export function textOk(...texts: (string | undefined | null)[]) {
  const err = checkText(...texts)
  if (err) toast('Publication refusée', err)
  return !err
}

// ---------- Suppression du compte ----------
export async function deleteMyAccount() {
  const s = useStore.getState()
  const me = s.meId
  if (isRemote && me) {
    // 1. Photos et vidéos du compte (dossier media/<id>/…)
    for (const folder of ['stories', 'posts', 'profile']) {
      const { data } = await sb!.storage.from('media').list(`${me}/${folder}`, { limit: 1000 })
      if (data?.length) await sb!.storage.from('media').remove(data.map((f) => `${me}/${folder}/${f.name}`))
    }
    // 2. Le compte et tout ce qui lui est lié
    const { error } = await sb!.rpc('delete_my_account')
    if (error) throw new Error(/delete_my_account|schema cache|function/i.test(error.message) ? 'La suppression n\'est pas encore activée (supabase/store-compliance.sql).' : error.message)
  }
  useSafety.getState().setBlocked([])
  try { localStorage.removeItem('spotla-tour-done') } catch { /* rien */ }
  s.logout()
}
