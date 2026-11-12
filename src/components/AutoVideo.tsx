import { useEffect, useRef, useState } from 'react'
import { mkPoster } from '../data/ambiance'

/**
 * Vidéo muette en boucle : l'image (poster) s'affiche tout de suite, la vidéo ne se télécharge
 * que lorsque la carte approche de l'écran, et ne joue que lorsqu'elle est visible
 * (l'accueil s'ouvre plus vite, économise la batterie et les données).
 */
export function AutoVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(() => !('IntersectionObserver' in window))
  useEffect(() => {
    const v = ref.current
    if (!v || !('IntersectionObserver' in window)) return
    const soon = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setNear(true); soon.disconnect() } }, { rootMargin: '60px' })
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) v.play().catch(() => {}); else v.pause() }, { threshold: 0.35 })
    soon.observe(v)
    io.observe(v)
    return () => { soon.disconnect(); io.disconnect() }
  }, [src])
  // La source arrive : on relance la lecture si la carte est déjà à l'écran.
  useEffect(() => {
    const v = ref.current
    if (!near || !v) return
    const r = v.getBoundingClientRect()
    if (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) v.play().catch(() => {})
  }, [near, src])
  return <video ref={ref} className={className} src={near ? src : undefined} poster={poster ?? mkPoster(src)} muted loop playsInline autoPlay={false} preload={near ? 'metadata' : 'none'} aria-hidden="true" />
}
