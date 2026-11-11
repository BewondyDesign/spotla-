import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, Search } from 'lucide-react'
import { isHidden, useStore } from '../data/store'
import { distanceKm, money, momentOf } from '../data/util'
import { LocationSheet } from '../components/Location'
import { EventCard } from '../components/EventCard'
import { VenueCard } from '../components/VenueCard'
import { searchPlaces, useVenues, type Venue } from '../data/venues'
import { RADII, fmtKm } from '../data/util'

// La recherche en haut et la liste en bas cachent une partie de la carte.
const FIT = { paddingTopLeft: [16, 140] as [number, number], paddingBottomRight: [16, 330] as [number, number] }

export function MapScreen() {
  const events = useStore((s) => s.events)
  const pos = useStore((s) => s.pos)
  const meId = useStore((s) => s.meId)
  const radius = useStore((s) => s.radius)
  const geo = useStore((s) => s.geo)
  const manual = useStore((s) => s.manual)
  const [sheet, setSheet] = useState(false)
  const me = useRef<L.Marker | null>(null)
  const ring = useRef<L.Circle | null>(null)
  const fitAt = useRef<{ pos: { lat: number; lng: number }; radius: number } | null>(null)
  const [q, setQ] = useState('')
  const [onlyTonight, setOnlyTonight] = useState(true)
  const [sel, setSel] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const vlayer = useRef<L.LayerGroup | null>(null)
  const [vsel, setVsel] = useState<string | null>(null)
  const { venues, loading, error, retry } = useVenues(pos, radius)
  const [found, setFound] = useState<Venue[] | null>(null)
  const [searching, setSearching] = useState(false)
  // Recherche libre dans le rayon choisi, à partir de ta position.
  useEffect(() => {
    if (q.trim().length < 2) { setFound(null); return }
    setSearching(true)
    const t = setTimeout(() => searchPlaces(q.trim(), pos, radius).then((r) => { setFound(r); setSearching(false) }), 500)
    return () => clearTimeout(t)
  }, [q, pos.lat, pos.lng, radius]) // eslint-disable-line react-hooks/exhaustive-deps
  const shownVenues = useMemo(() => found ?? (q ? venues.filter((v) => `${v.name} ${v.kind}`.toLowerCase().includes(q.toLowerCase())) : venues), [found, venues, q])

  const visible = useMemo(() => events.filter((e) => !isHidden(e, meId) && distanceKm(pos, e) <= radius && momentOf(e) !== 'past' && (!onlyTonight || momentOf(e) === 'tonight') && (!q || `${e.title} ${e.venue} ${e.area} ${e.vibe}`.toLowerCase().includes(q.toLowerCase()))), [events, q, onlyTonight, meId, pos, radius])

  useEffect(() => {
    if (!box.current || map.current) return
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([pos.lat, pos.lng], 14)
    // Tuiles OpenStreetMap (sans clé), assombries en CSS pour le thème nuit.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19, className: 'tiles-night' }).addTo(m)
    me.current = L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: '', html: '<div class="pulse"></div>', iconSize: [18, 18] }), interactive: false }).addTo(m)
    ring.current = L.circle([pos.lat, pos.lng], { radius: radius * 1000, color: '#F2F2F3', weight: 1, opacity: 0.35, fillOpacity: 0.03, interactive: false }).addTo(m)
    vlayer.current = L.layerGroup().addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('click', () => { setSel(null); setVsel(null) })
    map.current = m
    return () => { m.remove(); map.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Recentre la carte quand la position ou le rayon change.
  useEffect(() => {
    const m = map.current
    if (!m) return
    me.current?.setLatLng([pos.lat, pos.lng])
    ring.current?.setLatLng([pos.lat, pos.lng]).setRadius(radius * 1000)
    // On recadre seulement au premier affichage, quand le rayon change ou après un grand déplacement ;
    // sinon le point suit la position en direct sans faire sauter la carte.
    const jump = !fitAt.current || distanceKm(fitAt.current.pos, pos) > 1 || fitAt.current.radius !== radius
    if (jump) { m.fitBounds(ring.current!.getBounds(), FIT); fitAt.current = { pos, radius } }
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

  // Vrais lieux (OpenStreetMap) : petites pastilles sous les événements.
  useEffect(() => {
    const g = vlayer.current
    if (!g) return
    g.clearLayers()
    for (const v of shownVenues) {
      const club = v.kind === 'Boîte de nuit'
      const icon = L.divIcon({ className: '', html: `<div class="vpin ${club ? 'club' : ''}${vsel === v.id ? ' sel' : ''}"></div>`, iconSize: [14, 14] })
      L.marker([v.lat, v.lng], { icon, title: v.name }).on('click', (ev) => { L.DomEvent.stopPropagation(ev); setSel(null); setVsel(v.id) }).addTo(g)
    }
  }, [shownVenues, vsel])

  const selected = visible.find((e) => e.id === sel)
  const selVenue = shownVenues.find((v) => v.id === vsel)
  return (
    <div className="scr map-scr">
      <div ref={box} className="map" />
      <div className="map-top">
        <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Club, bar, nom d'un lieu…" aria-label="Rechercher un lieu ou un événement" /></label>
        <div className="row gap6 radius-row" role="group" aria-label="Filtres de la carte">
          {RADII.filter((k) => k >= 5).map((k) => <button key={k} className="chip solid" aria-pressed={radius === k} onClick={() => useStore.getState().setRadius(k)}>{k} km</button>)}
          <button className="chip solid" aria-pressed={onlyTonight} onClick={() => setOnlyTonight(!onlyTonight)}>Ce soir</button>
          <button className="chip solid" onClick={() => setSheet(true)} aria-label="Changer de ville">Ville…</button>
        </div>
      </div>
      <button className="iconbtn map-me" aria-label="Me recentrer" onClick={() => { fitAt.current = null; if (!manual) useStore.getState().locate(); map.current?.fitBounds(ring.current!.getBounds(), FIT) }}><Navigation size={18} /></button>
      {sheet && <LocationSheet onClose={() => setSheet(false)} />}
      {selected && <div className="sheet"><div className="grab" /><EventCard e={selected} /></div>}
      {selVenue && !selected && <div className="sheet"><div className="grab" /><VenueCard v={selVenue} /></div>}
      {!selected && !selVenue && (
        <section className="sheet results" aria-label="Autour de toi">
          <div className="grab" />
          <div className="sheet-head">
            <b>{loading || searching ? 'Recherche…' : `${shownVenues.length} lieu${shownVenues.length > 1 ? 'x' : ''} · ${visible.length} soirée${visible.length > 1 ? 's' : ''}`}</b>
            <span className={`live-pill ${geo === 'ok' && !manual ? 'on' : ''}`}>{geo === 'ok' && !manual ? <><i className="live-dot" /> En direct</> : manual ? 'Ville choisie' : geo === 'denied' ? 'Localisation bloquée' : 'Localisation…'}</span>
          </div>
          {error && !found && <p className="hint pad">Lieux indisponibles pour l'instant. <button className="linkbtn" onClick={retry}>Réessayer</button></p>}
          {q && !searching && shownVenues.length === 0 && <p className="hint pad">Rien trouvé pour « {q} » à moins de {radius} km. Agrandis le rayon.</p>}
          {!q && visible.map((e) => (
            <button key={e.id} className="vrow" onClick={() => { setSel(e.id); map.current?.setView([e.lat, e.lng], 16) }}>
              <span className="vrow-km ev">{e.price === 0 ? 'Gratuit' : money(e.price)}</span>
              <span className="grow"><b>{e.title}</b><span>{fmtKm(distanceKm(pos, e))} · {e.venue}</span></span>
            </button>
          ))}
          {shownVenues.slice(0, 30).map((v) => (
            <button key={v.id} className="vrow" onClick={() => { setVsel(v.id); map.current?.setView([v.lat, v.lng], 16) }}>
              <span className={`vrow-km ${v.kind === 'Boîte de nuit' ? 'club' : ''}`}>{fmtKm(distanceKm(pos, v)).replace(',0 ', ' ')}</span>
              <span className="grow"><b>{v.name}</b><span>{v.kind}{v.address ? ` · ${v.address}` : ''}</span></span>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
