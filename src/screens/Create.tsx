import { CUR } from '../data/util'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Camera, Clapperboard, Globe, Hand, ImagePlus, Lock, MapPin, Minus, PartyPopper, PenLine, Plus, Users } from 'lucide-react'
import { toast, useMe, useStore } from '../data/store'
import { MAX_STORY_SECONDS, putBlob, videoDuration } from '../data/media'
import { isRemote, uploadMedia } from '../data/backend'
import { geocode, momentOf, PALETTES, uid, VIBES, VIS_LABEL, type Place } from '../data/util'
import { isForKids, KIDS_REFUSED } from '../data/adult'
import type { Visibility } from '../data/types'

type Mode = 'event' | 'story' | 'post'

export function Create() {
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') as Mode) || 'event'
  const setMode = (m: Mode) => setParams({ mode: m }, { replace: true })
  return (
    <div className="scr">
      <div className="pad stack16">
        <div className="tabs2 create-tabs" role="tablist" aria-label="Type de publication">
          <button role="tab" aria-selected={mode === 'event'} onClick={() => setMode('event')}><PartyPopper size={16} /> Événement</button>
          <button role="tab" aria-selected={mode === 'story'} onClick={() => setMode('story')}><Clapperboard size={16} /> Story</button>
          <button role="tab" aria-selected={mode === 'post'} onClick={() => setMode('post')}><PenLine size={16} /> Post</button>
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

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d) }
const ACCESS: { v: Visibility; icon: typeof Globe; hint: string }[] = [
  { v: 'open', icon: Globe, hint: 'Tout le monde voit l\'adresse et peut venir.' },
  { v: 'limited', icon: Users, hint: 'Premiers arrivés, premiers servis.' },
  { v: 'request', icon: Hand, hint: 'Tu acceptes chaque personne. L\'adresse reste cachée.' },
  { v: 'circle', icon: Lock, hint: 'Seulement tes abonnés. L\'adresse reste cachée aux autres.' },
]

function EventForm() {
  const me = useMe()!
  const pos = useStore((s) => s.pos)
  const createEvent = useStore((s) => s.createEvent)
  const nav = useNavigate()
  const biz = me.kind === 'business'
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('danser')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(localDate(new Date()))
  const [start, setStart] = useState('21:00')
  const [end, setEnd] = useState('02:00')
  const [venue, setVenue] = useState(biz ? me.name : '')
  const [address, setAddress] = useState(me.venueAddress ?? '')
  const [spot, setSpot] = useState<Place | null>(null)
  const [sugg, setSugg] = useState<Place[]>([])
  const [paid, setPaid] = useState(false)
  const [price, setPrice] = useState(10)
  const [ticketUrl, setTicketUrl] = useState('')
  const [vis, setVis] = useState<Visibility>(biz ? 'open' : 'request')
  const [cap, setCap] = useState(25)
  const [busy, setBusy] = useState(false)

  // Suggestions d'adresse pendant la saisie, autour de toi.
  useEffect(() => {
    if (spot || address.trim().length < 4) { setSugg([]); return }
    const t = setTimeout(() => geocode(address.trim(), pos).then(setSugg), 450)
    return () => clearTimeout(t)
  }, [address, spot]) // eslint-disable-line react-hooks/exhaustive-deps

  const okStep = [title.trim().length >= 3, !!venue.trim() && !!address.trim(), true][step]
  const dayChoice = date === addDays(0) ? 0 : date === addDays(1) ? 1 : 2

  const submit = async () => {
    if (isForKids(title, desc)) { toast('Publication refusée', KIDS_REFUSED); return }
    setBusy(true)
    const found = spot ?? (await geocode(address.trim(), pos))[0]
    if (!found) toast('Adresse non trouvée sur la carte', 'L\'événement est placé près de ta position. Vérifie l\'adresse si besoin.')
    const at = found ?? { lat: pos.lat + (Math.random() - 0.5) * 0.01, lng: pos.lng + (Math.random() - 0.5) * 0.01 }
    const s = new Date(`${date}T${start}`)
    const e = new Date(`${date}T${end}`)
    if (e <= s) e.setDate(e.getDate() + 1) // finit après minuit
    const id = createEvent({
      title: title.trim(), vibe: VIBES.find((v) => v.k === tag)!.l.split(' ')[0], tags: [tag],
      start: s.toISOString(), end: e.toISOString(), venue: venue.trim(), area: found?.area || useStore.getState().city, address: address.trim(),
      lat: at.lat, lng: at.lng,
      price: paid ? price : 0, ticketUrl: paid && ticketUrl ? ticketUrl : undefined,
      visibility: vis, capacity: vis === 'open' ? undefined : cap, desc: desc.trim(), colors: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    })
    const ev = useStore.getState().events.find((x) => x.id === id)!
    toast('Événement publié', momentOf(ev) === 'tonight' ? 'Il apparaît dans « Ce soir » pour les gens autour.' : 'Il est visible sur ton mur et sur la carte.')
    nav(`/event/${id}`, { replace: true })
  }

  return (
    <div className="wizard">
      <div className="wiz-steps" aria-label={`Étape ${step + 1} sur 3`}>{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <div className="stack18">
          <h2 className="wiz-q">C'est quoi, ta soirée ?</h2>
          <input className="input big" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Donne-lui un nom" maxLength={80} autoFocus aria-label="Nom de l'événement" />
          <div className="field"><span className="lbl">Ambiance</span>
            <div className="wrap-chips">{VIBES.map((v) => <button key={v.k} className="chip" aria-pressed={tag === v.k} onClick={() => setTag(v.k)}>{v.l}</button>)}</div>
          </div>
          <div className="field"><span className="lbl">Quelques mots (facultatif)</span>
            <textarea className="input area" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ce qui t'attend, quoi apporter…" rows={3} maxLength={600} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="stack18">
          <h2 className="wiz-q">Quand et où ?</h2>
          <div className="field"><span className="lbl">Jour</span>
            <div className="wrap-chips">
              <button className="chip" aria-pressed={dayChoice === 0} onClick={() => setDate(addDays(0))}>Ce soir</button>
              <button className="chip" aria-pressed={dayChoice === 1} onClick={() => setDate(addDays(1))}>Demain</button>
              <label className={`chip date-chip ${dayChoice === 2 ? 'on' : ''}`}><CalendarDays size={15} /> {dayChoice === 2 ? new Date(`${date}T12:00`).toLocaleDateString(document.documentElement.lang === 'en' ? 'en-CA' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Autre date'}
                <input type="date" value={date} min={addDays(0)} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </label>
            </div>
          </div>
          <div className="grid2">
            <div className="field"><span className="lbl">Début</span><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="field"><span className="lbl">Fin</span><input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="field"><span className="lbl">Nom du lieu</span><input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Chez moi, Le Comptoir…" /></div>
          <div className="field addr"><span className="lbl">Adresse</span>
            <input className="input" value={address} onChange={(e) => { setAddress(e.target.value); setSpot(null) }} placeholder="Numéro et rue" autoComplete="street-address" />
            {spot && <span className="hint"><MapPin size={12} /> Trouvée sur la carte{spot.area ? ` · ${spot.area}` : ''}</span>}
            {sugg.length > 0 && (
              <div className="sugg">{sugg.slice(0, 4).map((p) => (
                <button key={p.name} onClick={() => { setSpot(p); setAddress(p.short || p.name); setSugg([]) }}><MapPin size={14} /><span>{p.short || p.name}{p.area ? <small> · {p.area}</small> : null}</span></button>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack18">
          <h2 className="wiz-q">Qui peut venir ?</h2>
          <div className="access" role="radiogroup" aria-label="Accès">
            {ACCESS.map(({ v, icon: Icon }) => (
              <button key={v} role="radio" aria-checked={vis === v} onClick={() => setVis(v)}><Icon size={20} /><span>{VIS_LABEL[v]}</span></button>
            ))}
          </div>
          <p className="hint access-hint">{ACCESS.find((x) => x.v === vis)!.hint}</p>
          {vis !== 'open' && (
            <div className="row between stepper-row"><span>Nombre de places</span>
              <div className="stepper"><button aria-label="Moins" onClick={() => setCap(Math.max(2, cap - 5))}><Minus size={16} /></button><b>{cap}</b><button aria-label="Plus" onClick={() => setCap(Math.min(biz ? 1000 : 300, cap + 5))}><Plus size={16} /></button></div>
            </div>
          )}
          <div className="field"><span className="lbl">Entrée</span>
            <div className="wrap-chips">
              <button className="chip" aria-pressed={!paid} onClick={() => setPaid(false)}>Gratuit</button>
              <button className="chip" aria-pressed={paid} onClick={() => setPaid(true)}>Payant</button>
            </div>
          </div>
          {paid && (
            <div className="grid2">
              <div className="field"><span className="lbl">Prix ({CUR})</span><input className="input" type="number" inputMode="decimal" min={1} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} /></div>
              <div className="field"><span className="lbl">Billetterie (lien)</span><input className="input" type="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="Facultatif" /></div>
            </div>
          )}
        </div>
      )}

      <div className="wiz-foot">
        {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Retour</button> : <span />}
        {step < 2
          ? <button className="btn btn-primary" disabled={!okStep} onClick={() => setStep(step + 1)}>Suivant</button>
          : <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Publication…' : 'Publier'}</button>}
      </div>
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
  // Une story montre l'ambiance d'une sortie : elle est toujours rattachée à un événement.
  const [busy, setBusy] = useState(false)

  // Événements auxquels on peut rattacher la story : les miens, ou ceux où je vais.
  const linkable = useMemo(() => events.filter((e) => momentOf(e) !== 'past' && (e.hostId === me.id || e.going.includes(me.id))), [events, me.id])
  useEffect(() => { if (!eventId && linkable.length === 1) setEventId(linkable[0].id) }, [linkable, eventId])

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
        createStory({ eventId, caption: caption.trim(), media: { kind: 'video', url, duration: dur } })
      } else {
        const key = uid('vid')
        await putBlob(key, file)
        createStory({ eventId, caption: caption.trim(), media: { kind: 'video', blobKey: key, duration: dur } })
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
      <p className="muted">{`Une vidéo de ${MAX_STORY_SECONDS} secondes maximum pour donner un aperçu de l'ambiance. Filme pendant l'événement : ta story s'affiche « En direct » tant qu'il a lieu.`}</p>
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
          <option value="" disabled>Choisis ta sortie</option>
          {linkable.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {linkable.length === 0 && <span className="hint">Une story montre l'ambiance d'une sortie. Touche « J'y vais » sur un événement, ou <a href="#/create?mode=event">crée le tien</a>{', puis reviens ici.'}</span>}
      </Field>
      <Field label="Légende"><input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ex. Il reste de la place, venez !" maxLength={120} /></Field>
      <button className="btn btn-primary btn-block" disabled={!file || !eventId || busy} onClick={publish}>{busy ? 'Publication…' : 'Publier la story'}</button>
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
    if (isForKids(text)) { toast('Publication refusée', KIDS_REFUSED); return }
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
