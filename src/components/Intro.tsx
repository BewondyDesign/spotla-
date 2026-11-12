import { useEffect, useRef, useState } from 'react'
import { useLang } from '../data/i18n'
import { Tour, tourDone } from './Tour'
import { dayInfo, PART_WHEN } from '../data/daypart'
import { useStore } from '../data/store'

// Vidéo de fond (Mixkit, licence gratuite) : piste de club sous les lumières dorées, mains en l air, couple qui danse. Adultes seulement.
// Lue directement depuis Mixkit en 720p (nette sur téléphone) ; si elle ne démarre pas vite (réseau lent), on passe à la version 360p, plus légère.
export const CLIP = { hd: 'https://assets.mixkit.co/videos/341/341-720.mp4', sd: 'https://assets.mixkit.co/videos/341/341-360.mp4', poster: 'https://assets.mixkit.co/videos/341/341-thumb-720-0.jpg' }
const LENGTH = 7000 // durée de l'animation, comptée à partir du moment où la vidéo joue
const WAIT = 1800 // si la vidéo tarde (réseau lent, mode économie d'énergie), l'animation part quand même

/**
 * Animation d'ouverture : un plan de ville apparaît, un repère « spot » tombe et rebondit,
 * des ondes partent du point, une petite gerbe de lumières (ambiance soirée), puis le nom SpotLa.
 * Le tout par-dessus une vidéo de soirée au ralenti. Jouée à la toute première ouverture (environ 7 s). Toucher l'écran la passe.
 */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + (i % 2 ? 0.17 : 0)
  const d = 70 + ((i * 37) % 60)
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85 - 20, c: ['#E8C27A', '#F2557A', '#FFFFFF', '#F4DDAE'][i % 4], s: 4 + (i % 3) * 2, delay: (i % 5) * 30 }
})

const SEEN = 'spotla-intro-seen' // cette session a déjà eu son ouverture
const DONE = 'spotla-intro-done' // l'intro complète a déjà été vue une fois sur cet appareil

const get = (st: Storage, k: string) => { try { return st.getItem(k) } catch { return null } }
/** Déjà venu sur cet appareil ? (mémoire locale, cookie de secours, ou une session de connexion enregistrée) */
function introDone() {
  if (get(localStorage, DONE) || document.cookie.includes('spotla_intro=1')) return true
  try { return Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k) || k === 'spotla-feed-cache') } catch { return false }
}
function markIntro() {
  try { sessionStorage.setItem(SEEN, '1') } catch { /* rien */ }
  try { localStorage.setItem(DONE, '1') } catch { /* rien */ }
  document.cookie = 'spotla_intro=1; max-age=31536000; path=/; SameSite=Lax'
}

/**
 * Quand jouer l'ouverture :
 * - toute première ouverture sur l'appareil : l'intro complète (vidéo + épingle + logo), puis l'accueil sur la même vidéo ;
 * - ensuite, à chaque ouverture de l'app : juste le logo pendant une seconde, puis directement l'app (comme Instagram).
 * Un simple rafraîchissement de la page ne rejoue rien.
 */
export function Intro() {
  const [mode] = useState<'full' | 'logo' | null>(() => {
    // Lien spotla.vercel.app/?intro : rejoue l'intro et les pages de présentation (pour les montrer à quelqu'un).
    if (/[?&]intro\b/.test(location.search)) { try { localStorage.removeItem('spotla-tour-done') } catch { /* rien */ } history.replaceState(null, '', location.pathname + location.hash); return 'full' }
    return !introDone() ? 'full' : get(sessionStorage, SEEN) ? null : 'logo'
  })
  const [tour, setTour] = useState(false)
  // La présentation se place sous l'intro pendant que celle-ci s'efface : pas d'écran intermédiaire.
  if (mode === 'full') return <>{tour && <Tour onDone={() => setTour(false)} />}<IntroPlayer onEnd={() => { if (!tourDone()) setTour(true) }} /></>
  if (mode === 'logo') return <LogoSplash />
  return null
}

/** Ouverture courte des habitués : le logo apparaît puis s'efface (environ 1 s). */
function LogoSplash() {
  const [out, setOut] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    try { sessionStorage.setItem(SEEN, '1') } catch { /* rien */ }
    const a = setTimeout(() => setOut(true), 700)
    const b = setTimeout(() => setDone(true), 1100)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (done) return null
  return (
    <div className={`logo-splash${out ? ' out' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 64" width="34" height="45"><path d="M24 2C12.4 2 3 11.2 3 22.6 3 37.8 24 62 24 62s21-24.2 21-39.4C45 11.2 35.6 2 24 2z" fill="#E8C27A" /><circle cx="24" cy="22.5" r="8" fill="#0B0B0D" /></svg>
      <span>SpotLa</span>
    </div>
  )
}

function IntroPlayer({ onEnd }: { onEnd: () => void }) {
  const en = useLang((s) => s.lang) === 'en'
  const [phase, setPhase] = useState<'play' | 'out' | 'done'>('play')
  // Première ouverture : après l'animation, 2 écrans de présentation.
  const [when] = useState(() => PART_WHEN[dayInfo(new Date(), useStore.getState().pos).part])
  const [started, setStarted] = useState(false)
  const [src, setSrc] = useState(CLIP.hd)
  const playing = useRef(false)
  const vid = useRef<HTMLVideoElement | null>(null)
  // Lecture : on force « muet » (attribut HTML, exigé par iPhone) puis play() ; l'animation démarre quand la vidéo joue.
  useEffect(() => {
    const v = vid.current
    if (v) { v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.play().catch(() => {}) }
    const slow = setTimeout(() => { if (!playing.current && (vid.current?.readyState ?? 0) < 2) setSrc(CLIP.sd) }, 1400)
    const t = setTimeout(() => setStarted(true), WAIT)
    return () => { clearTimeout(t); clearTimeout(slow) }
  }, [])
  useEffect(() => {
    if (!started) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const a = setTimeout(() => setPhase('out'), reduce ? 900 : LENGTH)
    const b = setTimeout(() => setPhase('done'), reduce ? 1300 : LENGTH + 800)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [started]) // eslint-disable-line react-hooks/exhaustive-deps
  // L'ouverture n'est notée « vue » qu'une fois finie ou passée : si la page est rechargée en plein milieu, elle rejoue.
  // Notée « vue » dès qu'elle démarre : un rafraîchissement ne la rejoue jamais.
  useEffect(() => { markIntro() }, [])
  useEffect(() => { if (phase === 'out') onEnd() }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === 'done') return null
  const skip = () => { setPhase('out'); setTimeout(() => setPhase('done'), 800) }

  return (
    <div className={`intro${phase === 'out' ? ' out' : ''}`} onClick={skip} role="presentation">
      <div className={`intro-vids${started ? ' on' : ''}`}>
        <video ref={vid} src={src} poster={CLIP.poster} muted playsInline autoPlay loop preload="auto" disablePictureInPicture
          onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.85 }}
          onCanPlay={(e) => { e.currentTarget.play().catch(() => {}) }}
          onPlaying={() => { playing.current = true; setStarted(true) }} />
      </div>
      <div className="intro-shade" />
      <button className="intro-skip" onClick={(e) => { e.stopPropagation(); skip() }} aria-label={en ? 'Skip' : 'Passer'}>{en ? 'Skip' : 'Passer'}</button>
      {started && <>
      <div className="intro-glow" />
      <svg className="intro-map" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M-20 210 C 90 230, 170 180, 420 250" />
          <path d="M-20 520 C 120 480, 260 560, 420 500" />
          <path d="M120 -20 C 140 200, 90 520, 150 820" />
          <path d="M300 -20 C 260 260, 330 560, 280 820" />
          <path d="M-20 380 L 420 340" className="thin" />
          <path d="M40 -20 L 230 820" className="thin" />
          <path d="M-20 660 C 160 640, 240 700, 420 650" className="thin" />
          <path d="M360 -20 C 380 160, 250 300, 200 400" className="thin" />
        </g>
      </svg>

      <div className="intro-stage">
        <div className="intro-spot">
          <span className="intro-ring r1" /><span className="intro-ring r2" /><span className="intro-ring r3" />
          <span className="intro-shadow" />
          {PARTICLES.map((p, i) => (
            <i key={i} className="intro-p" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--c': p.c, '--s': `${p.s}px`, animationDelay: `${2500 + p.delay * 1.5}ms` } as React.CSSProperties} />
          ))}
          <svg className="intro-pin" viewBox="0 0 48 64" width="56" height="75">
            <defs>
              <linearGradient id="pinG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F6DFA9" /><stop offset="1" stopColor="#C99A4B" />
              </linearGradient>
            </defs>
            <path d="M24 2C12.4 2 3 11.2 3 22.6 3 37.8 24 62 24 62s21-24.2 21-39.4C45 11.2 35.6 2 24 2z" fill="url(#pinG)" />
            <circle cx="24" cy="22.5" r="8" fill="#0B0B0D" />
            <circle cx="24" cy="22.5" r="3.4" fill="#E8C27A" className="intro-pin-dot" />
          </svg>
        </div>

        <h1 className="intro-word">
          {'SpotLa'.split('').map((ch, i) => <span key={i} style={{ animationDelay: `${2900 + i * 110}ms` }}>{ch}</span>)}
        </h1>
        <p className="intro-tag">{en ? `Where are we going ${when[1]}?` : `On va où ${when[0]} ?`}</p>
      </div>
      </>}
    </div>
  )
}
