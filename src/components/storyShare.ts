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

async function render(c: StoryCard) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif'
  // Fond : photo du lieu si possible, sinon les couleurs de la sortie.
  ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, W, H)
  const img = c.photo ? await loadImg(c.photo) : null
  if (img) {
    const r = Math.max(W / img.width, H / img.height), iw = img.width * r, ih = img.height * r
    ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih)
  } else {
    const [a, b] = c.colors ?? ['#2A2012', '#1A0E16']
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b)
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const r = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 800); r.addColorStop(0, 'rgba(232,194,122,.35)'); r.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H)
  }
  const shade = ctx.createLinearGradient(0, 0, 0, H)
  shade.addColorStop(0, 'rgba(11,11,13,.55)'); shade.addColorStop(0.3, 'rgba(11,11,13,.1)'); shade.addColorStop(0.55, 'rgba(11,11,13,.35)'); shade.addColorStop(1, 'rgba(11,11,13,.95)')
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H)

  // Logo en haut
  pin(ctx, 90, 120, 56)
  ctx.fillStyle = '#F4F4F5'; ctx.font = `700 64px ${font}`; ctx.textBaseline = 'middle'
  ctx.fillText('Spot', 166, 160); const sw = ctx.measureText('Spot').width
  ctx.fillStyle = '#E8C27A'; ctx.fillText('La', 166 + sw, 160)

  // Bloc bas : badge, titre, lieu
  let y = H - 640
  ctx.font = `700 40px ${font}`
  const bw = ctx.measureText(c.badge).width + 64
  ctx.fillStyle = '#E8C27A'; ctx.beginPath(); ctx.roundRect(90, y - 38, bw, 76, 38); ctx.fill()
  ctx.fillStyle = '#0B0B0D'; ctx.fillText(c.badge, 122, y + 2)
  y += 110
  ctx.fillStyle = '#FFFFFF'; ctx.font = `800 104px ${font}`
  for (const l of wrap(ctx, c.title, W - 180)) { ctx.fillText(l, 90, y + 40); y += 118 }
  y += 30
  ctx.fillStyle = 'rgba(244,244,245,.8)'; ctx.font = `500 46px ${font}`
  for (const l of wrap(ctx, c.line, W - 180).slice(0, 2)) { ctx.fillText(l, 90, y); y += 60 }

  // Pied : invitation
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(90, H - 210, W - 180, 2)
  ctx.fillStyle = 'rgba(244,244,245,.85)'; ctx.font = `600 42px ${font}`
  ctx.fillText(EN() ? 'Join me on SpotLa' : 'Rejoins-moi sur SpotLa', 90, H - 140)
  ctx.fillStyle = '#E8C27A'; ctx.font = `500 38px ${font}`
  ctx.fillText(location.host, 90, H - 85)

  return new Promise<Blob | null>((res) => cv.toBlob(res, 'image/png'))
}

export async function shareStory(c: StoryCard) {
  const url = `${location.origin}${location.pathname}${c.hash}`
  const en = EN()
  try { await navigator.clipboard?.writeText(url) } catch { /* pas grave */ }
  const blob = await render(c)
  if (!blob) { toast(en ? 'Couldn\'t create the image' : 'Image impossible à créer', ''); return false }
  const file = new File([blob], 'spotla-story.png', { type: 'image/png' })
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      toast(en ? 'Link copied' : 'Lien copié', en ? 'In your story, add it with the "Link" sticker.' : 'Dans ta story, ajoute-le avec l\'autocollant « Lien ».')
      return true
    }
  } catch (e) { if ((e as Error).name === 'AbortError') return false }
  // Ordinateur ou navigateur sans partage de fichiers : on télécharge l'image.
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spotla-story.png'; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  toast(en ? 'Image saved' : 'Image enregistrée', en ? 'Post it as a story on Instagram or Facebook. The link is copied.' : 'Publie-la en story sur Instagram ou Facebook. Le lien est copié.')
  return true
}
