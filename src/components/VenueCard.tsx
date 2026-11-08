import { Navigation, Globe } from 'lucide-react'
import type { Venue } from '../data/venues'
import { directions } from '../data/venues'
import { useStore } from '../data/store'
import { distanceKm, fmtKm } from '../data/util'

export function VenueCard({ v }: { v: Venue }) {
  const pos = useStore((s) => s.pos)
  const site = v.website && (v.website.startsWith('http') ? v.website : `https://instagram.com/${v.website.replace(/^@/, '')}`)
  return (
    <div className="venue">
      <span className={`venue-dot k-${v.kind === 'Boîte de nuit' ? 'club' : 'bar'}`} />
      <div className="grow">
        <b>{v.name}</b>
        <span>{v.kind} · {fmtKm(distanceKm(pos, v))}{v.address ? ` · ${v.address}` : ''}</span>
      </div>
      {site && <a className="iconbtn" href={site} target="_blank" rel="noreferrer" aria-label={`Site de ${v.name}`}><Globe size={18} /></a>}
      <a className="iconbtn" href={directions(v)} target="_blank" rel="noreferrer" aria-label={`Itinéraire vers ${v.name}`}><Navigation size={18} /></a>
    </div>
  )
}
