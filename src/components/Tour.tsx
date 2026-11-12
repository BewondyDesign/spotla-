import { useRef, useState } from 'react'
import { useLang } from '../data/i18n'
import { CLIP } from './Intro'

/**
 * Présentation de l'app à la toute première ouverture, juste après l'animation SpotLa,
 * sur la même vidéo dorée (une seule ambiance de l'intro jusqu'à l'accueil).
 * 2 écrans animés (type Lottie, en SVG/CSS). « Passer » est disponible à tout moment.
 */
const KEY = 'spotla-tour-done'
export const tourDone = () => { try { return localStorage.getItem(KEY) === '1' } catch { return true } }
const markDone = () => { try { localStorage.setItem(KEY, '1') } catch { /* navigation privée */ } }

/** Écran 1 : la carte autour de toi, les spots s'allument. */
function MapScene() {
  const pins = [
    { x: 30, y: 34, d: 300, c: '#E8C27A' }, { x: 70, y: 28, d: 520, c: '#F2557A' }, { x: 62, y: 66, d: 740, c: '#E8C27A' },
    { x: 24, y: 70, d: 960, c: '#FFFFFF' }, { x: 80, y: 50, d: 1180, c: '#E8C27A' },
  ]
  return (
    <div className="tour-scene">
      <svg className="tour-streets" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 30 C 30 36, 60 22, 100 32" /><path d="M0 72 C 40 64, 70 78, 100 68" />
        <path d="M34 0 C 38 40, 26 70, 36 100" /><path d="M72 0 C 64 40, 80 70, 70 100" />
      </svg>
      <span className="tour-radius" />
      <span className="tour-me"><i /></span>
      {pins.map((p, i) => (
        <span key={i} className="tour-pin" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}ms`, '--c': p.c } as React.CSSProperties}>
          <svg viewBox="0 0 24 32" width="22" height="29"><path d="M12 1C5.9 1 1 5.8 1 11.8 1 19.8 12 31 12 31s11-11.2 11-19.2C23 5.8 18.1 1 12 1z" fill="var(--c)" /><circle cx="12" cy="11.6" r="4" fill="#0B0B0D" /></svg>
        </span>
      ))}
      <div className="tour-card" style={{ animationDelay: '1500ms' }}>
        <b>Afterwork sur le toit</b><span>Commence dans 45 min · 600 m</span>
      </div>
    </div>
  )
}

/** Écran 2 : des gens convergent vers le même spot, ça discute, l'ambiance monte. */
function CrewScene() {
  const people = [
    { from: [-90, -70], c: '#E8C27A', d: 200 }, { from: [95, -55], c: '#F2557A', d: 380 },
    { from: [-85, 75], c: '#F4F4F5', d: 560 }, { from: [90, 80], c: '#C99A4B', d: 740 },
  ]
  return (
    <div className="tour-scene">
      <span className="tour-hub" />
      <svg className="tour-hubpin" viewBox="0 0 24 32" width="30" height="40"><path d="M12 1C5.9 1 1 5.8 1 11.8 1 19.8 12 31 12 31s11-11.2 11-19.2C23 5.8 18.1 1 12 1z" fill="#E8C27A" /><circle cx="12" cy="11.6" r="4" fill="#0B0B0D" /></svg>
      {people.map((p, i) => (
        <span key={i} className="tour-person" style={{ '--fx': `${p.from[0]}px`, '--fy': `${p.from[1]}px`, '--c': p.c, animationDelay: `${p.d}ms`, '--a': `${i * 90 + 45}deg` } as React.CSSProperties}><i><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="8.5" r="4.2" fill="#0B0B0D" opacity=".75" /><path d="M4 21c.8-4.4 4-6.6 8-6.6s7.2 2.2 8 6.6" fill="#0B0B0D" opacity=".75" /></svg></i></span>
      ))}
      <span className="tour-bubble b1">On se rejoint à l'entrée ?</span>
      <span className="tour-bubble b2">J'arrive dans 10 min 🙌</span>
      <div className="tour-vibe"><i /><i /><i /><i /><i /></div>
    </div>
  )
}

const SLIDES = [
  { scene: <MapScene />, fr: ['Trouve où sortir, maintenant', 'Bars, clubs, terrasses, sorties de la communauté : tout ce qui se passe près de toi, aujourd\'hui.'],
    en: ['Find where to go, right now', 'Bars, clubs, patios, community outings: everything happening near you, today.'] },
  { scene: <CrewScene />, fr: ['Sors seul·e ou en gang', 'Dis « J\'y vais », rejoins les gens qui viennent seuls et vois l\'ambiance en direct avant de te déplacer.'],
    en: ['Go solo or with your crew', 'Tap "I\'m going", join people going solo and check the live vibe before you head out.'] },
]

export function Tour({ onDone }: { onDone: () => void }) {
  const en = useLang((s) => s.lang) === 'en'
  const [i, setI] = useState(0)
  const [out, setOut] = useState(false)
  const touch = useRef<number | null>(null)
  const finish = () => { markDone(); setOut(true); setTimeout(onDone, 420) }
  const next = () => (i < SLIDES.length - 1 ? setI(i + 1) : finish())
  const s = SLIDES[i]
  const [title, text] = en ? s.en : s.fr

  return (
    <div className={`tour${out ? ' out' : ''}`}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current; touch.current = null
        if (dx < -50) next(); else if (dx > 50 && i > 0) setI(i - 1)
      }}>
      <div className="tour-bg" aria-hidden="true">
        <video src={CLIP.hd} poster={CLIP.poster} muted playsInline autoPlay loop preload="auto" disablePictureInPicture
          ref={(v) => { if (v) { v.muted = true; v.setAttribute('muted', ''); v.play().catch(() => {}) } }} />
        <div className="tour-shade" />
      </div>
      <button className="tour-skip" onClick={finish}>{en ? 'Skip' : 'Passer'}</button>
      <div className="tour-body" key={i}>
        {s.scene}
        <div className="tour-text">
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
      </div>
      <div className="tour-foot">
        <div className="tour-dots" aria-hidden="true">
          <i className="done" />{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}
        </div>
        <button className="btn btn-primary btn-block" onClick={next}>{i < SLIDES.length - 1 ? (en ? 'Next' : 'Suivant') : (en ? 'Enter SpotLa' : 'Entrer dans SpotLa')}</button>
      </div>
    </div>
  )
}
