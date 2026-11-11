import { videoIfMatch } from './ambiance'
import { useEffect, useState } from 'react'

// Agenda culturel de Montréal : sorties officielles, gratuites ou payantes.
// 1) Calendrier de la Ville de Montréal (données ouvertes, CC BY 4.0), chargé chaque jour par /api/city-events.
// 2) Grands festivals, dates officielles relevées sur Bonjour Québec (Gouvernement du Québec) et les sites des festivals.

export interface AgendaItem {
  id: string
  title: string
  type: string
  start: string // AAAA-MM-JJ
  end: string
  free: boolean
  cost?: string
  venue?: string
  address?: string
  area?: string
  lat: number
  lng: number
  url?: string
  description: string
  image: string
  video?: string
  source: 'Ville de Montréal' | 'Bonjour Québec'
  tbc?: boolean // dates à confirmer par l'organisateur
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=1100&q=70&auto=format&fit=crop`
const QDS = { lat: 45.5088, lng: -73.566, area: 'Quartier des spectacles' }

export const FESTIVALS: AgendaItem[] = [
  { id: 'fest:festilumi', title: 'Festilumi', type: 'Expérience lumineuse', start: '2026-09-17', end: '2027-01-03', free: false, venue: 'Marché Central', address: 'Rue du Marché Central', area: 'Ahuntsic', lat: 45.5397, lng: -73.6545, url: 'https://www.bonjourquebec.com/fr-ca/repertoire/evenements/festilumi/3za2', description: 'Parcours multimédia et immersif de lanternes et de lumières.', image: U('1764422474375-97b032a5190d'), source: 'Bonjour Québec' },
  { id: 'fest:lumino-2027', title: 'LUMINO', type: 'Art lumineux', start: '2027-01-21', end: '2027-03-07', free: true, venue: 'Quartier des spectacles', ...QDS, url: 'https://www.luminomtl.com', description: 'Installations lumineuses et interactives en plein air, au cœur du Quartier des spectacles. Entrée libre.', image: U('1766348248661-f4888351ad94'), source: 'Bonjour Québec' },
  { id: 'fest:mnm-2027', title: 'Festival Montréal / Nouvelles Musiques', type: 'Musique', start: '2027-02-13', end: '2027-02-28', free: false, venue: 'Plusieurs salles', ...QDS, url: 'https://festivalmnm.ca/', description: 'Seize jours et plus de vingt concerts de musiques nouvelles.', image: U('1630395822970-acd6a691d97e'), source: 'Bonjour Québec' },
  { id: 'fest:nuit-blanche-2027', title: 'Nuit blanche à Montréal', type: 'Nuit festive', start: '2027-02-27', end: '2027-02-27', free: true, venue: 'Partout en ville', ...QDS, url: 'https://nuitblanchemtl.com/', description: 'Une nuit entière d\'activités gratuites : expos, concerts, glissades et parcours lumineux dans toute la ville.', image: U('1672148361690-65782276ebec'), source: 'Bonjour Québec' },
  { id: 'fest:rvqc-2027', title: 'Les Rendez-vous Québec Cinéma', type: 'Cinéma', start: '2027-03-25', end: '2027-04-03', free: false, venue: 'Plusieurs salles', ...QDS, url: 'https://www.bonjourquebec.com/en/listing/events/les-rendez-vous-quebec-cinema/0ohm', description: 'Le grand rendez-vous du cinéma québécois : projections, rencontres et soirées.', image: U('1761959167085-65a8375d47a4'), source: 'Bonjour Québec' },
  { id: 'fest:fta-2027', title: 'Festival TransAmériques', type: 'Théâtre et danse', start: '2027-05-26', end: '2027-06-10', free: false, venue: 'Plusieurs salles', ...QDS, url: 'https://www.bonjourquebec.com/en-us/listing/events/festival-transameriques/0pbi', description: 'Le plus grand festival de création contemporaine en Amérique du Nord : théâtre, danse et performance.', image: U('1663668566971-afaa3f07903d'), source: 'Bonjour Québec' },
  { id: 'fest:fringe-2027', title: 'Festival St-Ambroise Fringe', type: 'Théâtre et humour', start: '2027-05-31', end: '2027-06-20', free: false, venue: 'Plateau-Mont-Royal', area: 'Plateau', lat: 45.5175, lng: -73.5815, url: 'https://www.montrealfringe.ca/', description: 'Trois semaines de spectacles indépendants, d\'humour et de théâtre à petit prix.', image: U('1603910234616-3b5f4a6be2b4'), source: 'Bonjour Québec' },
  { id: 'fest:mural-2027', title: 'Festival MURAL', type: 'Art urbain', start: '2027-06-03', end: '2027-06-13', free: true, venue: 'Boulevard Saint-Laurent', area: 'Plateau', lat: 45.517, lng: -73.588, url: 'https://www.bonjourquebec.com/en-us/listing/events/festival-mural/0sdg', description: 'Murales géantes réalisées en direct, concerts et fêtes de rue sur la Main. Entrée libre.', image: U('1749015375406-d60a989d64c4'), source: 'Bonjour Québec', tbc: true },
  { id: 'fest:francos-2027', title: 'Francos de Montréal', type: 'Musique', start: '2027-06-11', end: '2027-06-19', free: true, venue: 'Quartier des spectacles', ...QDS, url: 'https://francosmontreal.com/', description: 'Le grand festival de la chanson francophone, avec de nombreux concerts extérieurs gratuits.', image: U('1687511844598-165c1fc387cc'), source: 'Bonjour Québec' },
  { id: 'fest:fete-nationale-2027', title: 'Fête nationale du Québec', type: 'Fête populaire', start: '2027-06-24', end: '2027-06-24', free: true, venue: 'Partout en ville', ...QDS, url: 'https://fetenationale.quebec/', description: 'Spectacles, feux et fêtes de quartier partout à Montréal pour la Saint-Jean-Baptiste.', image: U('1656283384093-1e227e621fad'), source: 'Bonjour Québec' },
  { id: 'fest:jazz-2027', title: 'Festival International de Jazz de Montréal', type: 'Musique', start: '2027-06-25', end: '2027-07-04', free: true, cost: 'Concerts extérieurs gratuits, salles payantes', venue: 'Quartier des spectacles', ...QDS, url: 'https://montrealjazzfest.com/', description: 'Le plus grand festival de jazz au monde (Guinness World Records) : des centaines de concerts, dont la majorité gratuits en plein air.', image: U('1774544809959-1991aa21c904'), source: 'Bonjour Québec' },
  { id: 'fest:off-jpr-2027', title: 'Festival OFF Juste pour rire', type: 'Humour', start: '2027-07-14', end: '2027-07-25', free: true, venue: 'Quartier des spectacles', ...QDS, url: 'https://www.bonjourquebec.com/en/listing/events/festival-off-juste-pour-rire-montreal/0t3c', description: 'Humour et arts de la rue en plein air, avec de nombreux spectacles gratuits.', image: U('1509824227185-9c5a01ceba0d'), source: 'Bonjour Québec', tbc: true },
  { id: 'fest:osheaga-2027', title: 'Osheaga, Festival Musique et Arts', type: 'Musique', start: '2027-07-30', end: '2027-08-01', free: false, venue: 'Parc Jean-Drapeau', area: 'Parc Jean-Drapeau', lat: 45.5088, lng: -73.5297, url: 'https://www.bonjourquebec.com/en/listing/events/osheaga-festival-musique-et-arts/0oq4', description: 'Trois jours de concerts internationaux sur l\'île Sainte-Hélène.', image: U('1622743941533-cde694bff56a'), source: 'Bonjour Québec' },
  { id: 'fest:fierte-2027', title: 'Festival Fierté Montréal', type: 'Fête et défilé', start: '2027-07-30', end: '2027-08-08', free: true, venue: 'Village et parc Olympique', area: 'Village', lat: 45.519, lng: -73.556, url: 'https://fiertemontreal.com/', description: 'Le plus grand festival LGBTQ+ de la francophonie : spectacles, fêtes et grand défilé.', image: U('1603910234616-3b5f4a6be2b4'), source: 'Bonjour Québec' },
  { id: 'fest:fipa-2027', title: 'Festival international Présence autochtone', type: 'Culture', start: '2027-08-03', end: '2027-08-12', free: true, venue: 'Quartier des spectacles', ...QDS, url: 'https://www.bonjourquebec.com/en/listing/events/festival-international-presence-autochtone-fipa/0pxm', description: 'Cinéma, musique et arts des Premières Nations et des peuples autochtones.', image: U('1758998426930-4b8926bde26e'), source: 'Bonjour Québec' },
]

// Image d'ambiance selon le type d'événement de la Ville.
const TYPE_IMG: [RegExp, string][] = [
  [/musique/i, '1630395822970-acd6a691d97e'], [/théâtre|humour/i, '1663668566971-afaa3f07903d'], [/exposition|art/i, '1701943513658-b66020f2d6ef'],
  [/fête|marché/i, '1765044203136-fa42c59771ff'], [/cuisine/i, '1703692331013-84894ff8cdab'], [/cinéma|film/i, '1761959167085-65a8375d47a4'],
  [/sport|plein air|bien-être/i, '1764422474375-97b032a5190d'], [/société|histoire|lecture|littérature/i, '1640902106532-47dd3a2e833e'],
]
const imgFor = (type: string) => U(TYPE_IMG.find(([r]) => r.test(type))?.[1] ?? '1766348248661-f4888351ad94')

type CityRow = { id: string; title: string; url: string; description: string; start: string; end: string; type: string; free: boolean; cost: string; borough: string; venue: string; address: string; lat: number; lng: number }

let cache: AgendaItem[] | null = null
let inflight: Promise<AgendaItem[]> | null = null
const today = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10)

async function loadAgenda(): Promise<AgendaItem[]> {
  const t = today()
  let city: AgendaItem[] = []
  try {
    const r = await fetch('/api/city-events')
    if (r.ok) {
      const j = (await r.json()) as { events: CityRow[] }
      city = j.events.map((e) => ({
        id: e.id, title: e.title, type: e.type, start: e.start, end: e.end, free: e.free, cost: e.cost, venue: e.venue || undefined,
        address: e.address || undefined, area: e.borough, lat: e.lat, lng: e.lng, url: e.url, description: e.description, image: imgFor(e.type), source: 'Ville de Montréal',
      }))
    }
  } catch { /* hors ligne ou démo locale : on garde les festivals */ }
  return [...FESTIVALS, ...city].filter((e) => e.end >= t).sort((a, b) => a.start.localeCompare(b.start))
}

export function useAgenda() {
  const [items, setItems] = useState<AgendaItem[]>(cache ?? FESTIVALS.filter((e) => e.end >= today()))
  useEffect(() => {
    if (cache) return
    inflight ??= loadAgenda()
    inflight.then((x) => { cache = x; setItems(x) })
  }, [])
  return items
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const d = (s: string) => { const [y, m, j] = s.split('-').map(Number); return { y, m, j } }
/** « 13 – 28 févr. 2027 », « 27 févr. 2027 », « 17 sept. 2026 – 3 janv. 2027 » */
export function fmtRange(a: string, b: string) {
  const x = d(a), y = d(b)
  if (a === b) return `${x.j} ${MOIS[x.m - 1]} ${x.y}`
  if (x.y === y.y && x.m === y.m) return `${x.j} – ${y.j} ${MOIS[y.m - 1]} ${y.y}`
  if (x.y === y.y) return `${x.j} ${MOIS[x.m - 1]} – ${y.j} ${MOIS[y.m - 1]} ${y.y}`
  return `${x.j} ${MOIS[x.m - 1]} ${x.y} – ${y.j} ${MOIS[y.m - 1]} ${y.y}`
}
export const isOnNow = (e: AgendaItem) => e.start <= today() && e.end >= today()
export const inNextDays = (e: AgendaItem, n: number) => e.start <= new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

/** Vidéo d'ambiance d'une sortie (illustration libre de droits), seulement quand le type s'y prête. */
export const agendaVideo = (e: AgendaItem) => e.video ?? videoIfMatch(e.id, e.type, e.title)
