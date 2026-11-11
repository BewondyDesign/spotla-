import { claimVideo, MK, uniqueVideo } from './ambiance'
import { useLang } from './i18n'
import { isForKids } from './adult'
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

// Image d'ambiance selon le type d'événement de la Ville : plusieurs photos par type, données à tour de rôle,
// pour que deux cartes voisines n'aient jamais la même image.
const TYPE_POOL: Record<string, string[]> = {
  musique: ['1565035010268-a3816f98589a', '1729553199933-c897fea4f41f', '1556340346-5e30da977c4d', '1571435763834-4d6fbb550bb7', '1526478806334-5fd488fcaabc', '1593573969589-c416b9c926de', '1619973226698-b77a5b5dd14b', '1778011390422-a4d4bd8936a7', '1629276301581-a04e16fc0c2c', '1694260499070-160dfd1c22e5', '1683368392119-96f38e599cea', '1709090083073-d130ac28cc19', '1669459846550-c60006acdec6', '1568215425379-7a994872739d'],
  scene: ['1503095396549-807759245b35', '1514306191717-452ec28c7814', '1562329265-95a6d7a83440', '1615414047026-802692414b79', '1576724196706-3f23f51ea351', '1579539760267-b2e78d9d735e', '1558970439-add78fc68990', '1630050525402-06c617847d27', '1613210434051-4b00d62d03fb', '1545129139-1beb780cf337', '1585699324551-f6c309eedeca', '1565798846807-2af22c843402', '1583482183620-f692113aafc3'],
  art: ['1606819717115-9159c900370b', '1569783721854-33a99b4c0bae', '1582555172866-f73bb12a2ab3', '1496889196885-5ddcec5eef4d', '1512540452972-baac55d40ef1', '1653987255814-3b4c05832660', '1658232630877-6a279285a107', '1563293743-a9761195b52e', '1598154948139-a899dadb6269', '1680226312080-c3f9beff02ca', '1706665714936-3211c96474c8', '1655205145442-84abe0ae4fab', '1597489420377-e23d4a080346', '1582481426757-274f94eecb72'],
  fete: ['1704908325720-1f8b2abb99b7', '1793788230292-a3f919e4ef6f', '1790324452976-27d6899f7b13', '1793788230300-df4f3d4d176a', '1784802006996-edd67353ac9a', '1771073992672-432501ffa6c4', '1758388544851-fbec1623daa3', '1783945365715-3dfa9c140bd3', '1786488219652-c312ef0215c6', '1784416931977-240fd5e8612d', '1773778580163-85da4ac3f705', '1788025555508-ad64d1cb6072', '1790435601755-5c181ded5b64', '1761992554804-9a107cd4b5bd'],
  cuisine: ['1696330123423-735eb4acc7a0', '1551883738-19ffa3dc4c43', '1545504573-edac76c6a487', '1674669520816-c3c5615dfe51', '1760026759916-16e48b34cee5', '1775499772755-1f7fbbd9a7bb', '1683731509782-22668b4ba48d', '1683731507344-740ea99b6b0f', '1773720261664-4f031d4ed1a6', '1728364283053-b1e2abe71611', '1790006696761-41eb4341b77b', '1762234928750-c3249b202a16'],
  cinema: ['1517604931442-7e0c8ed2963c', '1595769816263-9b910be24d5f', '1485095329183-d0797cdc5676', '1688678004647-945d5aaf91c1', '1677344297888-81f04aa12a60', '1643553517154-24eb7fd86437', '1650475958723-e8d850c26f67', '1627133805103-ce2d34ccdd37', '1527979809431-ea3d5c0c01c9', '1596445836561-991bcd39a86d', '1515168985652-8454bcc8fcaf', '1502033491742-0e11fb057e16'],
  plein: ['1608405059861-b21a68ae76a2', '1687436874774-fa0d4616bec9', '1687875495230-96dfea96d9da', '1758274535230-3641d0632878', '1686243693574-474b750fbacc', '1687436874174-977fdd9e2cb8', '1627254334905-fa93c3d1f220', '1686749143613-0eeacff36894', '1758274525923-c012bbd8bfbe', '1687180949117-7a297e2e5a16', '1627254331253-0e1ecd577f57', '1588271903230-d8a9b310966b', '1617512185318-e2e0448feada'],
  lecture: ['1532294220147-279399e4e00f', '1623031345438-387dd3c45e9f', '1533756102515-155e3863ee1c', '1610500796385-3ffc1ae2f046', '1583468982228-19f19164aee2', '1739482821433-266ffd030ab5', '1680178776508-41a276595b0f', '1583468991267-3f068b607ae1', '1789663281498-a1f2a6853cb7', '1659439267688-71cc201d09db', '1779703354655-71880dce6a17', '1663229052824-bf2a6270c937', '1762475833776-fd57865db4d5', '1575220352017-e7e9536b1d37'],
}
const TYPE_OF: [RegExp, string][] = [
  [/musique|concert/i, 'musique'], [/théâtre|humour|danse|spectacle|cirque/i, 'scene'], [/exposition|art|patrimoine|musée/i, 'art'],
  [/cuisine|gourmand/i, 'cuisine'], [/cinéma|film/i, 'cinema'], [/sport|plein air|bien-être|nature/i, 'plein'],
  [/société|histoire|lecture|littérature|conférence|atelier/i, 'lecture'], [/fête|marché|festival/i, 'fete'],
]
const turn: Record<string, number> = {}
const imgFor = (type: string) => {
  const k = TYPE_OF.find(([r]) => r.test(type))?.[1] ?? 'fete'
  const pool = TYPE_POOL[k]
  turn[k] = (turn[k] ?? -1) + 1
  return U(pool[turn[k] % pool.length])
}

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
  return [...FESTIVALS, ...city].filter((e) => e.end >= t && !isForKids(e.title, e.description, e.type)).sort((a, b) => a.start.localeCompare(b.start))
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

const MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MOIS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MOIS = new Proxy(MOIS_FR, { get: (t, k) => (useLang.getState().lang === 'en' ? MOIS_EN : t)[k as unknown as number] })
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
const FEST_VIDEO: Record<string, number> = {
  'fest:festilumi': 48301,
  'fest:lumino-2027': 34053,
  'fest:mnm-2027': 14756,
  'fest:nuit-blanche-2027': 3323,
  'fest:rvqc-2027': 28422,
  'fest:fta-2027': 51283,
  'fest:fringe-2027': 43400,
  'fest:francos-2027': 48509,
  'fest:fete-nationale-2027': 4064,
  'fest:jazz-2027': 43744,
  'fest:off-jpr-2027': 21829,
  'fest:osheaga-2027': 14088,
  'fest:fierte-2027': 47143,
}
export const agendaVideo = (e: AgendaItem) => claimVideo(e.id, e.video ?? (FEST_VIDEO[e.id] ? MK(FEST_VIDEO[e.id]) : undefined)) ?? uniqueVideo(e.id, e.title, e.type)
