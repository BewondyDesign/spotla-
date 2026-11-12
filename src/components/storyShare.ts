import { toast } from '../data/store'
import { useLang } from '../data/i18n'

/**
 * « Partager en story » : crée une image verticale 1080 × 1920 (format story Instagram / Facebook)
 * avec la sortie, le lieu, l'heure et le logo SpotLa, puis ouvre le partage du téléphone.
 * Le lien est copié pour l'ajouter avec l'autocollant « Lien » dans la story.
 */
export interface StoryCard {
  title: string
  badge: string // ex. « CE SOIR · 17:00 »
  line: string // ex. « Le Toit Rouge · Quartier latin »
  photo?: string
  /** Vidéo de la carte : si présente, la story est partagée en vidéo (10 s max). */
  video?: string
  colors?: [string, string]
  hash: string
}

const W = 1080, H = 1920
const EN = () => useLang.getState().lang === 'en'

function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => res(null)
    img.src = src.includes('images.unsplash.com') ? src.replace(/([?&])w=\d+/, '$1w=1080').replace(/([?&])h=\d+/, '$1h=1920') : src
    setTimeout(() => res(null), 5000)
  })
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/), lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 4)
}

function pin(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 48, s / 48)
  const g = ctx.createLinearGradient(0, 0, 48, 64); g.addColorStop(0, '#F6DFA9'); g.addColorStop(1, '#C99A4B')
  ctx.fillStyle = g
  ctx.fill(new Path2D('M24 2C12.4 2 3 11.2 3 22.6 3 37.8 24 62 24 62s21-24.2 21-39.4C45 11.2 35.6 2 24 2z'))
  ctx.fillStyle = '#0B0B0D'; ctx.beginPath(); ctx.arc(24, 22.5, 8, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif'

/** Calque transparent : dégradé, logo, badge, titre, lieu, invitation. Posé sur la photo ou sur chaque image de la vidéo. */
function overlay(c: StoryCard) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!
  const shade = ctx.createLinearGradient(0, 0, 0, H)
  shade.addColorStop(0, 'rgba(11,11,13,.55)'); shade.addColorStop(0.3, 'rgba(11,11,13,.1)'); shade.addColorStop(0.55, 'rgba(11,11,13,.35)'); shade.addColorStop(1, 'rgba(11,11,13,.95)')
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H)
  pin(ctx, 90, 120, 56)
  ctx.fillStyle = '#F4F4F5'; ctx.font = `700 64px ${FONT}`; ctx.textBaseline = 'middle'
  ctx.fillText('Spot', 166, 160); const sw = ctx.measureText('Spot').width
  ctx.fillStyle = '#E8C27A'; ctx.fillText('La', 166 + sw, 160)
  let y = H - 640
  ctx.font = `700 40px ${FONT}`
  const bw = ctx.measureText(c.badge).width + 64
  ctx.fillStyle = '#E8C27A'; ctx.beginPath(); ctx.roundRect(90, y - 38, bw, 76, 38); ctx.fill()
  ctx.fillStyle = '#0B0B0D'; ctx.fillText(c.badge, 122, y + 2)
  y += 110
  ctx.fillStyle = '#FFFFFF'; ctx.font = `800 104px ${FONT}`
  for (const l of wrap(ctx, c.title, W - 180)) { ctx.fillText(l, 90, y + 40); y += 118 }
  y += 30
  ctx.fillStyle = 'rgba(244,244,245,.8)'; ctx.font = `500 46px ${FONT}`
  for (const l of wrap(ctx, c.line, W - 180).slice(0, 2)) { ctx.fillText(l, 90, y); y += 60 }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(90, H - 210, W - 180, 2)
  ctx.fillStyle = 'rgba(244,244,245,.85)'; ctx.font = `600 42px ${FONT}`
  ctx.fillText(EN() ? 'Join me on SpotLa' : 'Rejoins-moi sur SpotLa', 90, H - 140)
  ctx.fillStyle = '#E8C27A'; ctx.font = `500 38px ${FONT}`
  ctx.fillText(location.host, 90, H - 85)
  return cv
}

const cover = (ctx: CanvasRenderingContext2D, src: CanvasImageSource, w: number, h: number, cw: number, ch: number) => {
  const r = Math.max(cw / w, ch / h), iw = w * r, ih = h * r
  ctx.drawImage(src, (cw - iw) / 2, (ch - ih) / 2, iw, ih)
}

async function renderImage(c: StoryCard) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, W, H)
  const img = c.photo ? await loadImg(c.photo) : null
  if (img) cover(ctx, img, img.width, img.height, W, H)
  else {
    const [a, b] = c.colors ?? ['#2A2012', '#1A0E16']
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b)
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const r = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 800); r.addColorStop(0, 'rgba(232,194,122,.35)'); r.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H)
  }
  ctx.drawImage(overlay(c), 0, 0)
  return new Promise<Blob | null>((res) => cv.toBlob(res, 'image/png'))
}

/** Les vidéos passent par spotla.vercel.app (même origine) pour pouvoir être redessinées et enregistrées. */
const sameOrigin = (u: string) => u
  .replace('https://assets.mixkit.co/', '/m/mixkit/')
  .replace(/^https:\/\/ksxomkznjwecwxdssdlc\.supabase\.co\/storage\/v1\/object\/public\//, '/m/sb/')

const pickMime = () => ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
  .find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m))

/** Vidéo verticale 720 × 1280 : la vidéo de la carte, avec le calque SpotLa par-dessus (10 s max). */
let why = ''
async function renderVideo(c: StoryCard, onProgress: (p: number) => void): Promise<File | null> {
  const mime = pickMime()
  if (!mime) { why = 'MediaRecorder'; return null }
  if (!c.video) { why = 'pas de vidéo'; return null }
  if (!HTMLCanvasElement.prototype.captureStream) { why = 'captureStream'; return null }
  const VW = 720, VH = 1280
  // Sur iPhone, une vidéo ne se charge que si elle est dans la page et lancée : on la pose, invisible, et on la lit.
  const v = document.createElement('video')
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto'
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '')
  v.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;opacity:.01;pointer-events:none;z-index:-1'
  v.src = sameOrigin(c.video)
  document.body.appendChild(v)
  const cleanup = () => { v.pause(); v.removeAttribute('src'); v.load(); v.remove() }
  v.load(); v.play().catch(() => {})
  const ok = await new Promise<boolean>((res) => {
    const check = () => { if (v.readyState >= 2 && v.videoWidth > 0) res(true) }
    v.addEventListener('loadeddata', check); v.addEventListener('playing', check); v.addEventListener('canplay', check)
    v.onerror = () => { why = `chargement (${v.error?.code ?? '?'})`; res(false) }
    setTimeout(() => { why = why || 'délai dépassé'; res(false) }, 15000)
  })
  if (!ok) { cleanup(); return null }
  const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH
  const ctx = cv.getContext('2d')!
  const top = overlay(c)
  const draw = () => { ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, VW, VH); cover(ctx, v, v.videoWidth, v.videoHeight, VW, VH); ctx.drawImage(top, 0, 0, VW, VH) }
  draw()
  let stream: MediaStream, rec: MediaRecorder
  try {
    stream = cv.captureStream(30)
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  } catch (e) { why = `enregistreur (${(e as Error).name})`; cleanup(); return null }
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const done = new Promise<void>((res) => { rec.onstop = () => res() })
  const len = Math.min(isFinite(v.duration) && v.duration > 1 ? v.duration : 8, 10)
  if (v.paused) { try { await v.play() } catch (e) { why = `lecture (${(e as Error).name})`; cleanup(); return null } }
  v.currentTime = 0
  rec.start(250)
  const t0 = performance.now()
  await new Promise<void>((res) => {
    const tick = () => {
      draw()
      const t = (performance.now() - t0) / 1000
      onProgress(Math.min(t / len, 1))
      if (t >= len) { res(); return }
      if (v.ended) { v.currentTime = 0; v.play().catch(() => {}) }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  rec.stop(); await done
  stream.getTracks().forEach((t) => t.stop())
  cleanup()
  const type = mime.split(';')[0]
  const blob = new Blob(chunks, { type })
  if (blob.size <= 10_000) why = 'vidéo vide'
  return blob.size > 10_000 ? new File([blob], `spotla-story.${type === 'video/mp4' ? 'mp4' : 'webm'}`, { type }) : null
}

/** Petite fenêtre : préparation de la vidéo, puis bouton pour l'envoyer (le partage doit suivre un toucher). */
function sheet(en: boolean) {
  const el = document.createElement('div')
  el.className = 'story-sheet'
  el.innerHTML = `<div class="story-sheet-card" role="dialog" aria-modal="true">
    <b>${en ? 'Preparing your video…' : 'Préparation de ta vidéo…'}</b>
    <div class="story-sheet-bar"><i></i></div>
    <button class="btn btn-primary btn-block" disabled>${en ? 'Share as a story' : 'Partager en story'}</button>
    <button class="textlink" data-x>${en ? 'Cancel' : 'Annuler'}</button></div>`
  document.body.appendChild(el)
  const bar = el.querySelector<HTMLElement>('.story-sheet-bar i')!
  const btn = el.querySelector<HTMLButtonElement>('.btn')!
  const title = el.querySelector('b')!
  let cancelled = false
  const close = () => el.remove()
  el.querySelector('[data-x]')!.addEventListener('click', () => { cancelled = true; close() })
  return {
    progress: (p: number) => { bar.style.width = `${Math.round(p * 100)}%` },
    ready: (onShare: () => void) => { title.textContent = en ? 'Your video is ready' : 'Ta vidéo est prête'; bar.style.width = '100%'; btn.disabled = false; btn.onclick = () => { close(); onShare() } },
    get cancelled() { return cancelled },
    close,
  }
}

const tip = (en: boolean) => toast(en ? 'Link copied' : 'Lien copié', en ? 'In your story, add it with the "Link" sticker.' : 'Dans ta story, ajoute-le avec l\'autocollant « Lien ».')

async function send(file: File, en: boolean) {
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); tip(en); return true }
  } catch (e) { if ((e as Error).name === 'AbortError') return false }
  // Ordinateur ou navigateur sans partage de fichiers : on télécharge le fichier.
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  toast(en ? 'Saved' : 'Enregistré', en ? 'Post it as a story on Instagram or Facebook. The link is copied.' : 'Publie-la en story sur Instagram ou Facebook. Le lien est copié.')
  return true
}

export async function shareStory(c: StoryCard) {
  const url = `${location.origin}${location.pathname}${c.hash}`
  const en = EN()
  try { await navigator.clipboard?.writeText(url) } catch { /* pas grave */ }
  // Carte avec vidéo : on partage une vraie vidéo.
  if (c.video) {
    const s = sheet(en)
    why = ''
    const file = await renderVideo(c, s.progress).catch((e) => { why = String((e as Error)?.message ?? e); return null })
    if (s.cancelled) return false
    if (file) return new Promise<boolean>((res) => s.ready(() => { send(file, en).then(res) }))
    s.close() // vidéo impossible sur ce navigateur : on retombe sur l'image
    toast(en ? 'Video unavailable, sharing an image' : 'Vidéo indisponible, partage en image', why)
  }
  const blob = await renderImage(c)
  if (!blob) { toast(en ? 'Couldn\'t create the image' : 'Image impossible à créer', ''); return false }
  return send(new File([blob], 'spotla-story.png', { type: 'image/png' }), en)
}
