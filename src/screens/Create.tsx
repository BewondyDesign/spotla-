import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Clapperboard, ImagePlus, PartyPopper, PenLine } from 'lucide-react'
import { toast, useMe, useStore } from '../data/store'
import { MAX_STORY_SECONDS, putBlob, videoDuration } from '../data/media'
import { isRemote, uploadMedia } from '../data/backend'
import { momentOf, PALETTES, uid, VIBES, VIS_LABEL } from '../data/util'
import type { Visibility } from '../data/types'

type Mode = 'event' | 'story' | 'post'

export function Create() {
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') as Mode) || 'event'
  const setMode = (m: Mode) => setParams({ mode: m }, { replace: true })
  return (
    <div className="scr">
      <div className="pad stack16">
        <h1 className="h2">Publier</h1>
        <div className="seg three" role="group" aria-label="Type de publication">
          <button aria-pressed={mode === 'event'} onClick={() => setMode('event')}><PartyPopper size={16} /> Événement</button>
          <button aria-pressed={mode === 'story'} onClick={() => setMode('story')}><Clapperboard size={16} /> Story</button>
          <button aria-pressed={mode === 'post'} onClick={() => setMode('post')}><PenLine size={16} /> Post</button>
        </div>
        {mode === 'event' && <EventForm />}
        {mode === 'story' && <StoryForm defaultEvent={params.get('event') ?? ''} />}
        {mode === 'post' && <PostForm />}
      </div>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function EventForm() {
  const me = useMe()!
  const pos = useStore((s) => s.pos)
  const createEvent = useStore((s) => s.createEvent)
  const nav = useNavigate()
  const biz = me.kind === 'business'
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('danser')
  const [date, setDate] = useState(localDate(new Date()))
  const [start, setStart] = useState('21:00')
  const [end, setEnd] = useState('02:00')
  const [venue, setVenue] = useState(biz ? me.name : '')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState(me.venueAddress ?? '')
  const [paid, setPaid] = useState(false)
  const [price, setPrice] = useState(10)
  const [ticketUrl, setTicketUrl] = useState('')
  const [vis, setVis] = useState<Visibility>(biz ? 'open' : 'request')
  const [cap, setCap] = useState(25)
  const [desc, setDesc] = useState('')

  const ok = title.trim().length >= 3 && venue.trim() && address.trim()
  const submit = () => {
    const s = new Date(`${date}T${start}`)
    const e = new Date(`${date}T${end}`)
    if (e <= s) e.setDate(e.getDate() + 1) // finit après minuit
    const id = createEvent({
      title: title.trim(), vibe: VIBES.find((v) => v.k === tag)!.l.split(' ')[0], tags: [tag],
      start: s.toISOString(), end: e.toISOString(), venue: venue.trim(), area: area.trim() || 'Paris', address: address.trim(),
      // MVP : position approximative autour de toi. En production : géocodage de l'adresse.
      lat: pos.lat + (Math.random() - 0.5) * 0.02, lng: pos.lng + (Math.random() - 0.5) * 0.03,
      price: paid ? price : 0, ticketUrl: paid && ticketUrl ? ticketUrl : undefined,
      visibility: vis, capacity: vis === 'open' ? undefined : cap, desc: desc.trim(), colors: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    })
    const ev = useStore.getState().events.find((x) => x.id === id)!
    toast('Événement publié 🎉', momentOf(ev) === 'tonight' ? 'Il apparaît dans « Ce soir » pour les gens autour.' : 'Il est visible sur ton mur et sur la carte.')
    nav(`/event/${id}`, { replace: true })
  }

  return (
    <div className="stack16">
      <Field label="Titre"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Soirée karaoké chez moi" maxLength={80} /></Field>
      <Field label="Ambiance">
        <div className="wrap-chips">{VIBES.map((v) => <button key={v.k} className="chip" aria-pressed={tag === v.k} onClick={() => setTag(v.k)}>{v.l}</button>)}</div>
      </Field>
      <div className="grid3">
        <Field label="Date"><input className="input" type="date" value={date} min={localDate(new Date())} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Début"><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Fin"><input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <Field label="Lieu"><input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ex. Chez moi, Le Comptoir…" /></Field>
      <div className="grid2">
        <Field label="Quartier"><input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex. Oberkampf" /></Field>
        <Field label="Adresse exacte"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, étage, code" /></Field>
      </div>

      <Field label="Prix">
        <div className="seg two">
          <button aria-pressed={!paid} onClick={() => setPaid(false)}>Gratuit</button>
          <button aria-pressed={paid} onClick={() => setPaid(true)}>Payant</button>
        </div>
      </Field>
      {paid && (
        <div className="grid2">
          <Field label="Prix (€)"><input className="input" type="number" min={1} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Lien billetterie (option)"><input className="input" type="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="https://…" /></Field>
        </div>
      )}

      <Field label="Qui peut venir ?">
        <div className="vis-pick" role="radiogroup">
          {(['open', 'limited', 'request', 'circle'] as Visibility[]).map((v) => (
            <button key={v} role="radio" aria-checked={vis === v} onClick={() => setVis(v)}>
              <b>{VIS_LABEL[v]}</b>
              <span>{{ open: 'Tout le monde voit l\'adresse et peut venir.', limited: 'Premiers arrivés, premiers servis.', request: 'Tu valides chaque personne. Adresse masquée.', circle: 'Tes abonnés seulement. Adresse masquée aux autres.' }[v]}</span>
            </button>
          ))}
        </div>
      </Field>
      {vis !== 'open' && <Field label={`Nombre de places : ${cap}`}><input type="range" min={2} max={biz ? 1000 : 200} value={cap} onChange={(e) => setCap(Number(e.target.value))} /></Field>}

      <Field label="Description"><textarea className="input area" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ce qui t'attend, quoi ramener, dress code…" rows={4} maxLength={600} /></Field>
      <button className="btn btn-primary btn-block" disabled={!ok} onClick={submit}>Publier l'événement</button>
    </div>
  )
}

function StoryForm({ defaultEvent }: { defaultEvent: string }) {
  const me = useMe()!
  const events = useStore((s) => s.events)
  const createStory = useStore((s) => s.createStory)
  const nav = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dur, setDur] = useState(0)
  const [err, setErr] = useState('')
  const [caption, setCaption] = useState('')
  const [eventId, setEventId] = useState(defaultEvent)
  const [busy, setBusy] = useState(false)

  // Événements auxquels on peut rattacher la story : les miens, ou ceux où je vais.
  const linkable = useMemo(() => events.filter((e) => momentOf(e) !== 'past' && (e.hostId === me.id || e.going.includes(me.id))), [events, me.id])

  const pick = async (f: File | undefined) => {
    setErr('')
    if (!f) return
    if (!f.type.startsWith('video/')) return setErr('Choisis une vidéo.')
    try {
      const d = await videoDuration(f)
      if (d > MAX_STORY_SECONDS + 0.5) { setFile(null); setPreview(null); return setErr(`Ta vidéo dure ${Math.round(d)} s. Une story fait ${MAX_STORY_SECONDS} s maximum : coupe-la avant de l'envoyer.`) }
      setDur(d); setFile(f); setPreview(URL.createObjectURL(f))
    } catch {
      setErr('Impossible de lire cette vidéo.')
    }
  }

  const publish = async () => {
    if (!file) return
    setBusy(true)
    try {
      if (isRemote) {
        const url = await uploadMedia(me.id, file, 'stories')
        createStory({ eventId: eventId || undefined, caption: caption.trim(), media: { kind: 'video', url, duration: dur } })
      } else {
        const key = uid('vid')
        await putBlob(key, file)
        createStory({ eventId: eventId || undefined, caption: caption.trim(), media: { kind: 'video', blobKey: key, duration: dur } })
      }
    } catch (e) {
      setBusy(false)
      return setErr(`L'envoi de la vidéo a échoué : ${(e as Error).message}`)
    }
    toast('Story publiée', 'Visible 24 h. Elle apparaît aussi sur la fiche de l\'événement.')
    nav(`/stories/${me.id}`, { replace: true })
  }

  return (
    <div className="stack16">
      <p className="muted">Une vidéo de {MAX_STORY_SECONDS} secondes maximum pour donner un aperçu de l'ambiance. Filme pendant l'événement : ta story s'affiche « En direct » tant qu'il a lieu.</p>
      {preview ? (
        <div className="story-preview">
          <video src={preview} playsInline autoPlay loop muted />
          <span className="badge b-soon">{Math.round(dur)} s</span>
        </div>
      ) : (
        <label className="dropzone">
          <Camera size={28} />
          <b>Filmer ou choisir une vidéo</b>
          <span>{MAX_STORY_SECONDS} s max · MP4, MOV, WebM</span>
          <input type="file" accept="video/*" capture="environment" onChange={(e) => pick(e.target.files?.[0])} hidden />
        </label>
      )}
      {preview && <label className="textlink">Changer de vidéo<input type="file" accept="video/*" onChange={(e) => pick(e.target.files?.[0])} hidden /></label>}
      {err && <p className="error" role="alert">{err}</p>}
      <Field label="Événement lié">
        <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Aucun</option>
          {linkable.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {linkable.length === 0 && <span className="hint">Clique « J'y vais » sur un événement ou crée le tien pour le lier.</span>}
      </Field>
      <Field label="Légende"><input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ex. Il reste de la place, venez !" maxLength={120} /></Field>
      <button className="btn btn-primary btn-block" disabled={!file || busy} onClick={publish}>{busy ? 'Publication…' : 'Publier la story'}</button>
    </div>
  )
}

function PostForm() {
  const me = useMe()!
  const events = useStore((s) => s.events)
  const createPost = useStore((s) => s.createPost)
  const nav = useNavigate()
  const [text, setText] = useState('')
  const [img, setImg] = useState<File | null>(null)
  const [eventId, setEventId] = useState('')
  const [busy, setBusy] = useState(false)
  const mineOrGoing = events.filter((e) => momentOf(e) !== 'past' && (e.hostId === me.id || e.going.includes(me.id)))

  const publish = async () => {
    let imageKey: string | undefined
    let imageUrl: string | undefined
    setBusy(true)
    try {
      if (img && isRemote) imageUrl = await uploadMedia(me.id, img, 'posts')
      else if (img) { imageKey = uid('img'); await putBlob(imageKey, img) }
    } catch (e) {
      setBusy(false)
      return toast('L\'envoi de la photo a échoué', (e as Error).message)
    }
    createPost({ text: text.trim(), eventId: eventId || undefined, imageKey, imageUrl })
    toast('Publié sur ton mur')
    nav('/u/me', { replace: true })
  }

  return (
    <div className="stack16">
      <Field label="Ton message"><textarea className="input area" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Raconte ta soirée, invite du monde…" maxLength={1000} /></Field>
      <label className="dropzone small">
        <ImagePlus size={22} /><b>{img ? img.name : 'Ajouter une photo'}</b>
        <input type="file" accept="image/*" onChange={(e) => setImg(e.target.files?.[0] ?? null)} hidden />
      </label>
      <Field label="Événement lié (option)">
        <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Aucun</option>
          {mineOrGoing.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </Field>
      <button className="btn btn-primary btn-block" disabled={(!text.trim() && !img) || busy} onClick={publish}>{busy ? 'Publication…' : 'Publier sur mon mur'}</button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><span className="lbl">{label}</span>{children}</div>
}
