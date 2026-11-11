import { useEffect, useRef, useState } from 'react'
import { isVideo, posterOf } from '../data/catalog'

/** Galerie plein cadre à faire glisser : photos et vidéos (lecture auto, sans son, de la diapo visible). */
export function Gallery({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const slides = [...el.children] as HTMLElement[]
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const v = en.target.querySelector('video')
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          setI(slides.indexOf(en.target as HTMLElement))
          v?.play().catch(() => {})
        } else v?.pause()
      }
    }, { root: el, threshold: [0, 0.6, 1] })
    slides.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [items])

  const go = (n: number) => ref.current?.scrollTo({ left: n * ref.current.clientWidth, behavior: 'smooth' })

  return (
    <div className="gal">
      <div className="gal-track" ref={ref}>
        {items.map((src, n) => (
          <div className="gal-slide" key={src + n}>
            {isVideo(src)
              ? <video src={src} poster={posterOf(src)} muted loop playsInline preload={n === 0 ? 'auto' : 'metadata'} autoPlay={n === 0} />
              : <img src={src} alt="" loading={n === 0 ? 'eager' : 'lazy'} />}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <span className="gal-count">{i + 1} / {items.length}</span>
          <div className="gal-dots" role="tablist" aria-label="Photos et vidéos">
            {items.map((src, n) => <button key={n} role="tab" aria-selected={n === i} aria-label={`${isVideo(src) ? 'Vidéo' : 'Photo'} ${n + 1}`} onClick={() => go(n)} />)}
          </div>
        </>
      )}
    </div>
  )
}
