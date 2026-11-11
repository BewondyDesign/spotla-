import { useEffect, useState } from 'react'
import { useLang } from '../data/i18n'

/**
 * Animation d'ouverture : un plan de ville apparaît, un repère « spot » tombe et rebondit,
 * des ondes partent du point, une petite gerbe de lumières (ambiance soirée), puis le nom SpotLa.
 * Jouée à chaque ouverture de l'app (environ 2,6 s). Toucher l'écran la passe.
 */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + (i % 2 ? 0.17 : 0)
  const d = 70 + ((i * 37) % 60)
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85 - 20, c: ['#E8C27A', '#F2557A', '#FFFFFF', '#F4DDAE'][i % 4], s: 4 + (i % 3) * 2, delay: (i % 5) * 30 }
})

export function Intro() {
  const en = useLang((s) => s.lang) === 'en'
  const [phase, setPhase] = useState<'play' | 'out' | 'done'>('play')
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const a = setTimeout(() => setPhase('out'), reduce ? 700 : 2600)
    const b = setTimeout(() => setPhase('done'), reduce ? 1000 : 3100)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (phase === 'done') return null
  const skip = () => { setPhase('out'); setTimeout(() => setPhase('done'), 450) }

  return (
    <div className={`intro${phase === 'out' ? ' out' : ''}`} onClick={skip} role="presentation" aria-hidden="true">
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
            <i key={i} className="intro-p" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--c': p.c, '--s': `${p.s}px`, animationDelay: `${780 + p.delay}ms` } as React.CSSProperties} />
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
          {'SpotLa'.split('').map((ch, i) => <span key={i} style={{ animationDelay: `${1050 + i * 55}ms` }}>{ch}</span>)}
        </h1>
        <p className="intro-tag">{en ? 'Where are we going today?' : 'On va où aujourd\'hui ?'}</p>
      </div>
    </div>
  )
}
