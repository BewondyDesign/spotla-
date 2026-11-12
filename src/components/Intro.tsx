import { useEffect, useRef, useState } from 'react'
import { useLang } from '../data/i18n'
import { Tour, tourDone } from './Tour'
import { dayInfo, PART_WHEN } from '../data/daypart'
import { useStore } from '../data/store'

// Vidéos de fond (Mixkit, licence gratuite) : foule qui danse en club, mains levées, couple sur la piste. Adultes seulement.
// Passent par le proxy du site (/m/mixkit) pour se charger sur iPhone.
const CLIPS = [48510, 341, 344].map((id) => ({ src: `/m/mixkit/videos/${id}/${id}-720.mp4`, poster: `/m/mixkit/videos/${id}/${id}-thumb-720-0.jpg` }))
const CUT = [0, 2400, 4600] // début de chaque plan (ms), fondu enchaîné d'une seconde
const LENGTH = 6600 // durée totale avant le fondu de sortie

/**
 * Animation d'ouverture : un plan de ville apparaît, un repère « spot » tombe et rebondit,
 * des ondes partent du point, une petite gerbe de lumières (ambiance soirée), puis le nom SpotLa.
 * Le tout par-dessus une vidéo de soirée au ralenti. Jouée à chaque ouverture de l'app (environ 7 s). Toucher l'écran la passe.
 */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + (i % 2 ? 0.17 : 0)
  const d = 70 + ((i * 37) % 60)
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85 - 20, c: ['#E8C27A', '#F2557A', '#FFFFFF', '#F4DDAE'][i % 4], s: 4 + (i % 3) * 2, delay: (i % 5) * 30 }
})

export function Intro() {
  const en = useLang((s) => s.lang) === 'en'
  const [phase, setPhase] = useState<'play' | 'out' | 'tour' | 'done'>('play')
  // Première ouverture : après l'animation, 2 écrans de présentation.
  const [firstTime] = useState(() => !tourDone())
  const [when] = useState(() => PART_WHEN[dayInfo(new Date(), useStore.getState().pos).part])
  const [clip, setClip] = useState(0)
  const vids = useRef<(HTMLVideoElement | null)[]>([])
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const a = setTimeout(() => setPhase(firstTime ? 'tour' : 'out'), reduce ? 900 : LENGTH)
    const b = firstTime ? 0 : setTimeout(() => setPhase('done'), reduce ? 1300 : LENGTH + 800)
    // Plans suivants : on ne coupe que si la vidéo est prête, sinon le plan en cours continue.
    const cuts = reduce ? [] : CUT.slice(1).map((t, i) => setTimeout(() => {
      const v = vids.current[i + 1]
      if (v && v.readyState >= 3) { v.currentTime = 0; v.play().catch(() => {}); setClip(i + 1) }
    }, t))
    return () => { clearTimeout(a); clearTimeout(b); cuts.forEach(clearTimeout) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === 'done') return null
  if (phase === 'tour') return <Tour onDone={() => setPhase('done')} />
  const skip = () => { if (firstTime) { setPhase('tour'); return } setPhase('out'); setTimeout(() => setPhase('done'), 800) }

  return (
    <div className={`intro${phase === 'out' ? ' out' : ''}`} onClick={skip} role="presentation" aria-hidden="true">
      <div className="intro-vids">
        {CLIPS.map((c, i) => (
          <video key={c.src} ref={(el) => { vids.current[i] = el; if (el) el.playbackRate = 0.8 }} className={i === clip ? 'on' : ''}
            src={c.src} poster={i === 0 ? c.poster : undefined} muted playsInline autoPlay={i === 0} loop preload="auto"
            onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.8 }} />
        ))}
      </div>
      <div className="intro-shade" />
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
    </div>
  )
}
