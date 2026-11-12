import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { sb } from '../data/backend'
import { askConfirm, toast, useMe } from '../data/store'

// Espace admin (équipe SpotLa) : chiffres clés de l'avis de lancement, file des signalements, bugs.
// Tout passe par les règles de la base (supabase/launch-v1.sql) : un compte non admin ne lit rien ici.

type Stats = {
  devices: number; opens: number; signups: number; members: number; going_devices: number; goings: number; shares: number
  errors: number; open_reports: number; events_tonight: number
  ret7: { back: number; total: number }; ret30: { back: number; total: number }
  daily: { day: string; devices: number }[]; top: { name: string; n: number }[]
}
type Report = { id: string; reporter: string | null; kind: string; target_id: string | null; reason: string; created_at: string; handled: boolean }
type Bug = { id: number; at: string; message: string; path: string | null; agent: string | null; version: string | null }
type Target = { text: string; author?: string; authorName?: string; link?: string; gone?: boolean }

const KIND_FR: Record<string, string> = { user: 'Membre', post: 'Publication', comment: 'Commentaire', story: 'Story', message: 'Message de groupe', event: 'Sortie', support: 'Message au support' }
const TABLE: Record<string, { t: string; text: string; author: string }> = {
  post: { t: 'posts', text: 'body', author: 'author_id' },
  comment: { t: 'comments', text: 'body', author: 'author_id' },
  story: { t: 'stories', text: 'caption', author: 'author_id' },
  message: { t: 'event_messages', text: 'body', author: 'user_id' },
  event: { t: 'events', text: 'title', author: 'host_id' },
}
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—')
const when = (iso: string) => new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const EVENT_FR: Record<string, string> = { open: 'Ouvertures', screen: 'Écrans vus', going: '« J\'y vais »', not_going: 'Annulations', guest: 'Visites sans compte', signup: 'Inscriptions', share_story: 'Partages en story' }

export function Admin() {
  const nav = useNavigate()
  const me = useMe()
  const [tab, setTab] = useState<'stats' | 'reports' | 'bugs'>('stats')
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [targets, setTargets] = useState<Record<string, Target>>({})
  const [bugs, setBugs] = useState<Bug[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!sb) { setErr('L\'espace admin fonctionne seulement avec la base en ligne.'); return }
    setBusy(true); setErr('')
    const [s, r, b] = await Promise.all([
      sb.rpc('admin_stats', { days }),
      sb.from('content_reports').select('*').eq('handled', false).order('created_at', { ascending: false }).limit(100),
      sb.from('client_errors').select('id, at, message, path, agent, version').order('at', { ascending: false }).limit(100),
    ])
    if (s.error) setErr(/admin_stats|schema cache|function/i.test(s.error.message) ? 'Lance d\'abord supabase/launch-v1.sql dans Supabase.' : s.error.message)
    else setStats(s.data as Stats)
    const reps = (r.data ?? []) as Report[]
    setReports(reps)
    setBugs((b.data ?? []) as Bug[])
    // Ce qui a été signalé : le texte et son auteur.
    const found: Record<string, Target> = {}
    await Promise.all(reps.map(async (x) => {
      if (!x.target_id) return
      if (x.kind === 'user') {
        const { data } = await sb!.from('profiles').select('id, name, handle, banned').eq('id', x.target_id).maybeSingle()
        found[x.id] = data ? { text: `${data.name} (@${data.handle})${data.banned ? ' · banni' : ''}`, author: data.id, authorName: data.name, link: `/u/${data.id}` } : { text: 'Compte supprimé', gone: true }
        return
      }
      const m = TABLE[x.kind]
      if (!m) return
      const { data } = await sb!.from(m.t).select(`id, ${m.text}, ${m.author}`).eq('id', x.target_id).maybeSingle()
      const row = data as Record<string, string> | null
      if (!row) { found[x.id] = { text: 'Déjà retiré', gone: true }; return }
      const { data: au } = await sb!.from('profiles').select('name').eq('id', row[m.author]).maybeSingle()
      found[x.id] = { text: row[m.text] || '(sans texte)', author: row[m.author], authorName: au?.name, link: x.kind === 'event' ? `/event/${row.id}` : undefined }
    }))
    setTargets(found)
    setBusy(false)
  }, [days])
  useEffect(() => { if (me?.isAdmin) void load() }, [load, me?.isAdmin])

  if (!me?.isAdmin) {
    return (
      <div className="scr settings">
        <header className="pad set-head"><button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button><h1>Admin</h1><span /></header>
        <div className="pad"><p className="muted">Cet espace est réservé à l'équipe SpotLa.</p></div>
      </div>
    )
  }

  const done = async (r: Report) => {
    const { error } = await sb!.from('content_reports').update({ handled: true }).eq('id', r.id)
    if (error) { toast('Ça n\'a pas marché', error.message); return }
    setReports((xs) => xs.filter((x) => x.id !== r.id))
  }
  const remove = async (r: Report) => {
    const m = TABLE[r.kind]
    if (!m || !r.target_id) return
    if (!await askConfirm(`Retirer ce contenu (${KIND_FR[r.kind].toLowerCase()}) pour tout le monde ?`)) return
    const q = r.kind === 'event' ? sb!.from('events').update({ hidden: true }).eq('id', r.target_id) : sb!.from(m.t).delete().eq('id', r.target_id)
    const { error } = await q
    if (error) { toast('Ça n\'a pas marché', error.message); return }
    toast('Contenu retiré')
    await done(r)
  }
  const ban = async (r: Report) => {
    const t = targets[r.id]
    if (!t?.author) return
    if (!await askConfirm(`Bannir ${t.authorName ?? 'ce membre'} ? Il ne pourra plus rien publier.`)) return
    const { error } = await sb!.from('profiles').update({ banned: true }).eq('id', t.author)
    if (error) { toast('Ça n\'a pas marché', error.message); return }
    toast('Membre banni')
    await done(r)
  }

  return (
    <div className="scr settings admin">
      <header className="pad set-head">
        <button className="iconbtn soft" onClick={() => nav(-1)} aria-label="Retour"><ArrowLeft size={20} /></button>
        <h1>Admin</h1>
        <button className="iconbtn soft" onClick={() => void load()} aria-label="Actualiser" disabled={busy}><RefreshCw size={18} /></button>
      </header>
      <div className="pad stack16">
        <div className="adm-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'stats'} className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>Chiffres</button>
          <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'on' : ''} onClick={() => setTab('reports')}>Signalements{reports.length ? ` (${reports.length})` : ''}</button>
          <button role="tab" aria-selected={tab === 'bugs'} className={tab === 'bugs' ? 'on' : ''} onClick={() => setTab('bugs')}>Bugs{bugs.length ? ` (${bugs.length})` : ''}</button>
        </div>
        {err && <p className="adm-err">{err}</p>}

        {tab === 'stats' && stats && (
          <>
            <div className="adm-days">
              {[1, 7, 30].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d === 1 ? '24 h' : `${d} jours`}</button>)}
            </div>
            <div className="adm-grid">
              <Kpi label="Appareils actifs" value={stats.devices} />
              <Kpi label="Ouvertures" value={stats.opens} />
              <Kpi label="Nouveaux membres" value={stats.signups} sub={`${stats.members} au total`} />
              <Kpi label="Ont dit « J'y vais »" value={pct(stats.going_devices, stats.devices)} sub={`${stats.goings} fois · cible 30 %`} />
              <Kpi label="Retour à 7 jours" value={pct(stats.ret7.back, stats.ret7.total)} sub={`${stats.ret7.back}/${stats.ret7.total} appareils · cible 25 %`} />
              <Kpi label="Retour à 30 jours" value={pct(stats.ret30.back, stats.ret30.total)} sub={`${stats.ret30.back}/${stats.ret30.total} · cible 12 %`} />
              <Kpi label="Sorties ce soir" value={stats.events_tonight} sub="publiées par les membres et les lieux" />
              <Kpi label="Partages en story" value={stats.shares} />
              <Kpi label="Signalements à traiter" value={stats.open_reports} warn={stats.open_reports > 0} />
              <Kpi label="Bugs" value={stats.errors} warn={stats.errors > 0} />
            </div>
            {stats.daily.length > 0 && (
              <section className="set-group">
                <h2>Appareils par jour</h2>
                <div className="adm-bars" aria-label="Appareils actifs par jour">
                  {stats.daily.map((d) => {
                    const max = Math.max(...stats.daily.map((x) => x.devices))
                    return <div key={d.day} className="adm-bar" title={`${d.day} : ${d.devices}`}><i style={{ height: `${Math.max(4, (d.devices / max) * 100)}%` }} /><span>{d.day.slice(8)}</span></div>
                  })}
                </div>
              </section>
            )}
            <section className="set-group">
              <h2>Actions</h2>
              {stats.top.map((t) => <div key={t.name} className="set-row"><span>{EVENT_FR[t.name] ?? t.name}</span><b>{t.n}</b></div>)}
            </section>
          </>
        )}

        {tab === 'reports' && (
          reports.length === 0
            ? <p className="muted">Aucun signalement à traiter. Apple et Google demandent de traiter chaque signalement en moins de 24 h.</p>
            : reports.map((r) => {
              const t = targets[r.id]
              return (
                <article key={r.id} className="adm-card">
                  <div className="row between"><b>{KIND_FR[r.kind] ?? r.kind}</b><span className="muted">{when(r.created_at)}</span></div>
                  <p className="adm-reason">Motif : {r.reason}</p>
                  {t && <p className={`adm-target${t.gone ? ' gone' : ''}`}>{t.link ? <Link to={t.link}>{t.text}</Link> : t.text}{t.authorName && r.kind !== 'user' ? <span className="muted"> — {t.authorName}</span> : null}</p>}
                  <div className="row gap8 adm-actions">
                    {TABLE[r.kind] && t && !t.gone && <button className="btn-mini adm-danger" onClick={() => void remove(r)}>Retirer</button>}
                    {t?.author && <button className="btn-mini" onClick={() => void ban(r)}>Bannir l'auteur</button>}
                    <button className="btn-mini" onClick={() => void done(r)}>Classer</button>
                  </div>
                </article>
              )
            })
        )}

        {tab === 'bugs' && (
          bugs.length === 0
            ? <p className="muted">Aucun bug enregistré. Bonne nouvelle.</p>
            : bugs.map((b) => (
              <article key={b.id} className="adm-card">
                <div className="row between"><b className="adm-msg">{b.message}</b><span className="muted">{when(b.at)}</span></div>
                <p className="muted small">{b.path ?? '/'} · {/iPhone|iPad/.test(b.agent ?? '') ? 'iPhone' : /Android/.test(b.agent ?? '') ? 'Android' : 'Ordinateur'} · v{b.version ?? '?'}</p>
              </article>
            ))
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return <div className={`adm-kpi${warn ? ' warn' : ''}`}><span>{label}</span><b>{value}</b>{sub && <small>{sub}</small>}</div>
}
