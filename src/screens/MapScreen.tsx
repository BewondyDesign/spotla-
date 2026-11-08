import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'
import { isHidden, useStore } from '../data/store'
import { momentOf } from '../data/util'
import { EventCard } from '../components/EventCard'

export function MapScreen() {
  const events = useStore((s) => s.events)
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const [q, setQ] = useState('')
  const [onlyTonight, setOnlyTonight] = useState(true)
  const [sel, setSel] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  const visible = useMemo(() => events.filter((e) => !isHidden(e, meId) && momentOf(e) !== 'past' && (!onlyTonight || momentOf(e) === 'tonight') && (!q || `${e.title} ${e.venue} ${e.area} ${e.vibe}`.toLowerCase().includes(q.toLowerCase()))), [events, q, onlyTonight, meId])

  useEffect(() => {
    if (!box.current || map.current) return
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([pos.lat, pos.lng], 14)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(m)
    L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: '', html: '<div class="pulse"></div>', iconSize: [18, 18] }), interactive: false }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('click', () => setSel(null))
    map.current = m
    return () => { m.remove(); map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = layer.current
    if (!g) return
    g.clearLayers()
    for (const e of visible) {
      const label = e.price === 0 ? 'Gratuit' : `${e.price} €`
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
          <span className="chip solid static">{visible.length} spots</span>
        </div>
      </div>
      {selected && <div className="sheet"><div className="grab" /><EventCard e={selected} /></div>}
    </div>
  )
}
