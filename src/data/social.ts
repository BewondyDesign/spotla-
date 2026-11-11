// « J'y vais seul·e », la discussion du petit groupe et la jauge « Ça bouge ? ».
// En ligne : tables solo_joins, event_messages, vibe_checks (supabase/audit-v1.sql). En démo : stockage local.
import { useCallback, useEffect, useState } from 'react'
import { isRemote, must, sb } from './backend'

export interface ChatMessage { id: string; eventId: string; userId: string; body: string; createdAt: string }
export type VibeLevel = 1 | 2 | 3
export const VIBE_LABEL: Record<VibeLevel, string> = { 1: 'Calme', 2: 'Ça bouge', 3: 'Plein à craquer' }

/** La discussion reste ouverte jusqu'à 12 h après la fin de la sortie, puis elle se ferme. */
export const CHAT_HOURS_AFTER = 12
export const chatOpen = (endIso: string) => Date.now() < Date.parse(endIso) + CHAT_HOURS_AFTER * 3600_000

const LS = 'spotla-social'
type Local = { solo: Record<string, string[]>; msgs: ChatMessage[]; vibes: Record<string, Record<string, { level: VibeLevel; at: string }>> }
const read = (): Local => { try { return { solo: {}, msgs: [], vibes: {}, ...JSON.parse(localStorage.getItem(LS) || '{}') } } catch { return { solo: {}, msgs: [], vibes: {} } } }
const write = (d: Local) => { try { localStorage.setItem(LS, JSON.stringify(d)) } catch { /* stockage bloqué */ } }

// ---------- Groupe solo ----------
export async function soloMembers(eventId: string): Promise<string[]> {
  if (!isRemote) return read().solo[eventId] ?? []
  const r = await sb!.from('solo_joins').select('user_id').eq('event_id', eventId)
  if (r.error) return []
  return (r.data ?? []).map((x) => x.user_id as string)
}
export async function setSolo(eventId: string, me: string, on: boolean) {
  if (!isRemote) {
    const d = read(); const cur = new Set(d.solo[eventId] ?? [])
    if (on) cur.add(me); else cur.delete(me)
    d.solo[eventId] = [...cur]; write(d); return
  }
  if (on) must(await sb!.from('solo_joins').upsert({ event_id: eventId, user_id: me }))
  else must(await sb!.from('solo_joins').delete().match({ event_id: eventId, user_id: me }))
}

// ---------- Discussion ----------
export async function listMessages(eventId: string): Promise<ChatMessage[]> {
  if (!isRemote) return read().msgs.filter((m) => m.eventId === eventId)
  const r = await sb!.from('event_messages').select('*').eq('event_id', eventId).order('created_at').limit(300)
  if (r.error) throw new Error(r.error.message)
  return (r.data ?? []).map((m) => ({ id: m.id, eventId: m.event_id, userId: m.user_id, body: m.body, createdAt: m.created_at }))
}
export async function sendMessage(eventId: string, me: string, body: string) {
  const m: ChatMessage = { id: crypto.randomUUID(), eventId, userId: me, body, createdAt: new Date().toISOString() }
  if (!isRemote) { const d = read(); d.msgs.push(m); write(d); return m }
  must(await sb!.from('event_messages').insert({ id: m.id, event_id: eventId, user_id: me, body }))
  return m
}
export async function deleteMessage(id: string) {
  if (!isRemote) { const d = read(); d.msgs = d.msgs.filter((m) => m.id !== id); write(d); return }
  must(await sb!.from('event_messages').delete().eq('id', id))
}

/** Messages du groupe, rafraîchis toutes les 4 s tant que l'écran est ouvert. */
export function useChat(eventId: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [err, setErr] = useState('')
  const refresh = useCallback(() => listMessages(eventId).then((m) => { setMsgs(m); setErr('') }).catch((e: Error) => setErr(e.message)), [eventId])
  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t) }, [refresh])
  return { msgs, err, refresh }
}

// ---------- Ça bouge ? ----------
/** Les votes des 90 dernières minutes : on veut l'ambiance de maintenant, pas celle du début de soirée. */
const FRESH_MS = 90 * 60_000
export async function vibeOf(eventId: string, me: string | null): Promise<{ counts: Record<VibeLevel, number>; mine: VibeLevel | null; total: number }> {
  let rows: { user_id: string; level: VibeLevel; created_at: string }[]
  if (!isRemote) rows = Object.entries(read().vibes[eventId] ?? {}).map(([user_id, v]) => ({ user_id, level: v.level, created_at: v.at }))
  else {
    const r = await sb!.from('vibe_checks').select('user_id, level, created_at').eq('event_id', eventId)
    rows = r.error ? [] : (r.data as typeof rows)
  }
  const fresh = rows.filter((r) => Date.now() - Date.parse(r.created_at) < FRESH_MS)
  const counts = { 1: 0, 2: 0, 3: 0 } as Record<VibeLevel, number>
  for (const r of fresh) counts[r.level]++
  return { counts, mine: (fresh.find((r) => r.user_id === me)?.level ?? null) as VibeLevel | null, total: fresh.length }
}
export async function setVibe(eventId: string, me: string, level: VibeLevel) {
  if (!isRemote) { const d = read(); d.vibes[eventId] = { ...(d.vibes[eventId] ?? {}), [me]: { level, at: new Date().toISOString() } }; write(d); return }
  must(await sb!.from('vibe_checks').upsert({ event_id: eventId, user_id: me, level, created_at: new Date().toISOString() }))
}
