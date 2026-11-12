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
// Photos vérifiées une à une (description Unsplash) : adultes seulement, aucun enfant.
const TYPE_POOL: Record<string, string[]> = {
  musique: ['1459749411175-04bf5292ceea', '1470229722913-7c0e2dbbafd3', '1533174072545-7a4b6ad7a6c3', '1540039155733-5bb30b53aa14', '1524368535928-5b5e00ddc76b', '1565035010268-a3816f98589a', '1522158637959-30385a09e0da', '1450044804117-534ccd6e6a3a', '1603190287605-e6ade32fa852', '1506157786151-b8491531f063', '1497911270199-1c552ee64aa4',],
  scene: ['1514306191717-452ec28c7814', '1562329265-95a6d7a83440', '1615414047026-802692414b79', '1576724196706-3f23f51ea351', '1579539760267-b2e78d9d735e', '1558970439-add78fc68990', '1630050525402-06c617847d27', '1613210434051-4b00d62d03fb', '1545129139-1beb780cf337', '1585699324551-f6c309eedeca', '1565798846807-2af22c843402', '1615414015111-8d98cb65677e'],
  art: ['1606819717115-9159c900370b', '1569783721854-33a99b4c0bae', '1582555172866-f73bb12a2ab3', '1496889196885-5ddcec5eef4d', '1512540452972-baac55d40ef1', '1653987255814-3b4c05832660', '1580687580441-96dbadf8f3c8', '1563293743-a9761195b52e', '1658232630877-6a279285a107', '1598154948139-a899dadb6269', '1680226312080-c3f9beff02ca', '1603750003385-3342231a1ff1', '1706665714936-3211c96474c8', '1597489420377-e23d4a080346'],
  fete: ['1791107245984-5a884ea3ae3c', '1791107081803-9189fc501688', '1771840953517-8cbdb43b2b1a', '1659273145165-14ef8895c827', '1712503265241-d0c3ade63271', '1786996864213-96c00d20a8fe', '1773294904410-5df5a799cdf1', '1604613544991-068a60a1e2d3', '1787586044775-137de0e3aa93', '1760965824369-1a867927c1e0', '1775804324468-241a4c75055d', '1776653097129-d776d38891e0', '1789708476396-7d0bd64ba759'],
  cuisine: ['1768508950434-fc76c9f3ed9f', '1789758385775-98ab6db59e00', '1767510533362-4d5dbdaaf8c7', '1789758489753-ad8055d141d8', '1789758489734-acb071437efc', '1788660601189-861106e99899', '1682071308594-2aaa701015ef', '1768497262022-2afdf6b1266f', '1774684047298-193cd2f986d9', '1631482514423-36eb9ca07387', '1780926071915-a80b25b7145d', '1558346489-19413928158b'],
  cinema: ['1635400138431-0bbde4d01484', '1668890094751-6986d0ca9dfc', '1593940256067-fb4acd831804', '1650475958723-e8d850c26f67', '1561722798-9a732d141027', '1774619755413-7c31ab3aabc3', '1759103570737-8485420df3a5', '1705822898715-369170f541cf', '1781274326537-0fa818da10bc', '1739433437953-25af9fa13cf8'],
  plein: ['1588286840104-8957b019727f', '1545205597-3d9d02c29597', '1608405059861-b21a68ae76a2', '1683056255281-e52a141924f0', '1661307987465-1db8d7a8796f', '1549576490-b0b4831ef60a', '1687436874774-fa0d4616bec9', '1526718583451-e88ebf774771', '1615657973599-990d6e05fb8a', '1734638901126-bd34c411a029', '1643682661119-28da0685be2c'],
  lecture: ['1693927033657-36449a4aeeab', '1773401863516-ee4bed40f72d', '1698429519708-4e340d7e09be', '1573644075593-f27844eac89b', '1566131807516-e3b3cd1a89d1', '1571193161738-deaba9b6cc26', '1571075002844-e5180c614639', '1719806379331-dd06acf16c4c', '1766793568215-6fd1fc8529b2', '1735178842924-c98b183f9009', '1633354516388-41b56d6fe980', '1695605302783-fd906b98389e'],
}
const TYPE_OF: [RegExp, string][] = [
  [/musique|concert/i, 'musique'], [/théâtre|humour|danse|spectacle|cirque/i, 'scene'], [/exposition|art|patrimoine|musée/i, 'art'],
  [/cuisine|gourmand/i, 'cuisine'], [/cinéma|film/i, 'cinema'], [/sport|plein air|bien-être|nature/i, 'plein'],
  [/société|histoire|lecture|littérature|conférence|atelier/i, 'lecture'], [/fête|marché|festival/i, 'fete'],
]
/** Photos par activité précise, choisies d'après le titre et la description (couture, poterie, yoga…). */
const TOPIC_POOL: Record<string, string[]> = {
  couture: ['1578353022142-09264fd64295', '1560796952-f1c9b838544c', '1626274890657-e28d5b65b04b', '1673201229733-69d19c5c4a87', '1605002619330-080580537d72', '1625479144604-ae69462778b7', '1745847655362-fc86d76584b2'],
  tricot: ['1584992236310-6edddc08acff', '1632649027900-389e810204e6', '1595341595379-cf1cb694ea1f', '1470049384172-927891aad5e9', '1619608155967-7a5058b2a963', '1591051649443-453d2e0a716d'],
  poterie: ['1781389004999-d1a7e41639c5', '1771523350538-29baf74f710c', '1771523350747-638a89667c8f', '1771523350533-a831d1f703a7', '1589051088132-06f36a22012a', '1764507768797-5b7de6eedcb7', '1480355781839-51097c7d4f9f'],
  peinture: ['1541753866388-0b3c701627d3', '1658303135227-fcdfb0dab396', '1597274303632-880ef8660375'],
  photo: ['1495745966610-2a67f2297e5e', '1542038784456-1ea8e935640e', '1516961642265-531546e84af2', '1495707902641-75cac588d2e9', '1502982720700-bfff97f2ecac', '1580707221190-bd94d9087b7f', '1512790182412-b19e6d62bc39'],
  conference: ['1540575467063-178a50c2df87', '1587825140708-dfaf72ae4b04', '1594122230689-45899d9e6f69', '1627931539006-d5c4677e05ea', '1544531586-fde5298cdd40', '1582192730841-2a682d7375f9', '1603478804503-dc909c7f5ce5', '1558008258-3256797b43f3', '1571645163064-77faa9676a46'],
  yoga: ['1544367567-0f2fcb009e0b', '1761035005546-62b8018b212a', '1599901860904-17e6ed7083a0', '1506126613408-eca07ce68773', '1552196563-55cd4e45efb3', '1787647089633-37e49ee2e054', '1579454566790-f9e5697ddf36', '1552196527-bffef41ef674', '1575052814086-f385e2e2ad1b'],
  danse: ['1524594152303-9fd13543fe6e', '1604954055722-7f80571fbfc3', '1550026593-f369f98df0af', '1555489401-79c274997434', '1591162689269-a3fcdab967e3', '1765632814488-52e6d0653ebe', '1682760631807-71067eeea033', '1593105722399-0ee263656fdd'],
  jardin: ['1555955208-94f6fafea771', '1627647563441-c4bdf17486d2', '1643730508670-9e4804f59eb9', '1681675748349-7168e5fe4be8'],
  numerique: ['1603302576837-37561b2e2302', '1539376248633-cf94fa8b7bd8', '1654119895136-6aad918f412c', '1568333261345-0918efdce2d9', '1620365602462-40d8f2cdd84c', '1547731030-cd126f44e9c5'],
}
const TOPIC_OF: [RegExp, string][] = [
  [/couture|coudre|machine à coudre|broderie|textile|sewing/i, 'couture'],
  [/tricot|crochet|laine|knit/i, 'tricot'],
  [/poterie|céramique|argile|modelage|pottery|ceramic/i, 'poterie'],
  [/peinture|aquarelle|dessin|croquis|acrylique|painting|drawing/i, 'peinture'],
  [/photograph|photo\b|appareil photo/i, 'photo'],
  [/yoga|méditation|pleine conscience|tai[- ]chi|qi gong|pilates/i, 'yoga'],
  [/cours de danse|danse (en ligne|sociale|latine|swing)|salsa|tango|bachata|swing|zumba|dance class/i, 'danse'],
  [/jardin|horticult|plantes?\b|semis|potager|garden/i, 'jardin'],
  [/informatique|numérique|ordinateur|internet|tablette|cellulaire|courriel|logiciel|code\b|coding/i, 'numerique'],
  [/conférence|causerie|table ronde|discussion|débat|panel|talk/i, 'conference'],
]
const turn: Record<string, number> = {}
const pick = (k: string, pool: string[]) => { turn[k] = (turn[k] ?? -1) + 1; return U(pool[turn[k] % pool.length]) }
/** Le titre d'abord (le plus fiable), puis un type clair (concert, film…), sinon la description, sinon le type. */
const topic = (text: string) => TOPIC_OF.find(([r]) => r.test(text))?.[1]
const imgFor = (type: string, title = '', description = '') => {
  const k = TYPE_OF.find(([r]) => r.test(type))?.[1] ?? 'fete'
  const t = topic(title) ?? (['musique', 'cinema', 'scene', 'cuisine'].includes(k) ? undefined : topic(description))
  return t ? pick(t, TOPIC_POOL[t]) : pick(k, TYPE_POOL[k])
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
        address: e.address || undefined, area: e.borough, lat: e.lat, lng: e.lng, url: e.url, description: e.description, image: imgFor(e.type, e.title, e.description), source: 'Ville de Montréal',
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
const TOPIC_IDS = Object.values(TOPIC_POOL).flat()
const hasTopic = (e: AgendaItem) => TOPIC_IDS.some((id) => e.image.includes(id))
/** Un atelier précis (couture, yoga…) garde sa photo assortie : pas de vidéo générique du type « Exposition ». */
export const agendaVideo = (e: AgendaItem) => claimVideo(e.id, e.video ?? (FEST_VIDEO[e.id] ? MK(FEST_VIDEO[e.id]) : undefined)) ?? (hasTopic(e) ? undefined : uniqueVideo(e.id, e.title, e.type))
