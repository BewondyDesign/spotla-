import { useEffect, useRef } from 'react'
import { mkPoster } from '../data/ambiance'

/** Vidéo muette en boucle qui ne joue que lorsqu'elle est à l'écran (économise la batterie et les données). */
export function AutoVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) v.play().catch(() => {}); else v.pause() }, { threshold: 0.35 })
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return <video ref={ref} className={className} src={src} poster={poster ?? mkPoster(src)} muted loop playsInline preload="metadata" aria-hidden="true" />
}
