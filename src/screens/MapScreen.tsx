import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'
import { isHidden, useStore } from '../data/store'
import { distanceKm, money, momentOf } from '../data/util'
import { LocationSheet } from '../components/Location'
import { EventCard } from '../components/EventCard'

export function MapScreen() {
  const events = useStore((s) => s.events)
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const radius = useStore((s) => s.radius)
  const [sheet, setSheet] = useState(false)
  const me = useRef<L.Marker | null>(null)
  const ring = useRef<L.Circle | null>(null)
  const [q, setQ] = useState('')
  const [onlyTonight, setOnlyTonight] = useState(true)
  const [sel, setSel] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  const visible = useMemo(() => events.filter((e) => !isHidden(e, meId) && distanceKm(pos, e) <= radius && momentOf(e) !== 'past' && (!onlyTonight || momentOf(e) === 'tonight') && (!q || `${e.title} ${e.venue} ${e.area} ${e.vibe}`.toLowerCase().includes(q.toLowerCase()))), [events, q, onlyTonight, meId, pos, radius])

  useEffect(() => {
    if (!box.current || map.current) return
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([pos.lat, pos.lng], 14)
    // Tuiles OpenStreetMap (sans clé), assombries en CSS pour le thème nuit.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19, className: 'tiles-night' }).addTo(m)
    me.current = L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: '', html: '<div class="pulse"></div>', iconSize: [18, 18] }), interactive: false }).addTo(m)
    ring.current = L.circle([pos.lat, pos.lng], { radius: radius * 1000, color: '#FF4F9A', weight: 1, fillOpacity: 0.04, interactive: false }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('click', () => setSel(null))
    map.current = m
    return () => { m.remove(); map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Recentre la carte quand la position ou le rayon change.
  useEffect(() => {
    const m = map.current
    if (!m) return
    me.current?.setLatLng([pos.lat, pos.lng])
    ring.current?.setLatLng([pos.lat, pos.lng]).setRadius(radius * 1000)
    m.fitBounds(ring.current!.getBounds(), { padding: [20, 20] })
  }, [pos, radius])

  useEffect(() => {
    const g = layer.current
    if (!g) return
    g.clearLayers()
    for (const e of visible) {
      const label = e.price === 0 ? 'Gratuit' : money(e.price)
      const icon = L.divIcon({ className: '', html: `<div class="pin ${e.price === 0 ? 'free' : 'paid'}${sel === e.id ? ' sel' : ''}"><span>${label}</span></div>`, iconSize: [0, 0] })
      L.marker([e.lat, e.lng], { icon, title: e.title, keyboard: true }).on('click', (ev) => { L.DomEvent.stopPropagation(ev); setSel(e.id) }).addTo(g)
    }
  }, [visible, sel])

  const selected = visible.find((e) => e.id === sel)
  return (
    <div className="scr map-scr">
      <div ref={box} className="map" />
      <div className="map-top">
        <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lieu, quartier, ambiance…" aria-label="Rechercher" /></label>
        <div className="row gap8">
          <button className="chip solid" aria-pressed={onlyTonight} onClick={() => setOnlyTonight(true)}>Ce soir</button>
          <button className="chip solid" aria-pressed={!onlyTonight} onClick={() => setOnlyTonight(false)}>Tout à venir</button>
          <button className="chip solid" onClick={() => setSheet(true)}>{radius} km · {visible.length} spot{visible.length > 1 ? 's' : ''}</button>
        </div>
      </div>
      {sheet && <LocationSheet onClose={() => setSheet(false)} />}
      {selected && <div className="sheet"><div className="grab" /><EventCard e={selected} /></div>}
    </div>
  )
}
