import type { Notif, Post, SpotEvent, Story, User } from './types'

// Données de démonstration, recalculées chaque jour pour que « Ce soir » soit toujours ce soir.

const at = (dayOffset: number, h: number, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const inH = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

/** Nombre de jours jusqu'au prochain samedi (0 si on est samedi). */
const toSat = () => (6 - new Date().getDay() + 7) % 7
/** Événement « en cours » : commencé il y a 30 min, finit dans 3 h. */
const liveStart = () => new Date(Date.now() - 30 * 60_000).toISOString()
const liveEnd = () => new Date(Date.now() + 3 * 3_600_000).toISOString()

export const SEED_USERS: User[] = [
  { id: 'u-halo', name: 'Halo Rooftop', handle: 'halo.rooftop', kind: 'business', verified: true, color: '#FF4F9A', bio: 'Rooftop bar & DJ sets, Belleville. Ouvert du mercredi au dimanche.', city: 'Paris', followers: 12400, following: [], venueAddress: '12 rue de Belleville, 75020' },
  { id: 'u-bocal', name: 'Le Bocal', handle: 'lebocal', kind: 'business', verified: true, color: '#3CF0C8', bio: 'Bar à jazz, scène ouverte tous les soirs.', city: 'Paris', followers: 3900, following: [], venueAddress: '48 rue de Ménilmontant, 75020' },
  { id: 'u-orbite', name: 'Club Orbite', handle: 'club.orbite', kind: 'business', verified: true, color: '#8B7CFF', bio: 'Techno, house, jusqu\'à l\'aube.', city: 'Paris', followers: 28100, following: [], venueAddress: '3 rue de la Roquette, 75011' },
  { id: 'u-voisins', name: 'Bar Les Voisins', handle: 'lesvoisins', kind: 'business', verified: true, color: '#FFB547', bio: 'Karaoké, quiz et bonne humeur.', city: 'Paris', followers: 2100, following: [], venueAddress: '7 place de la République, 75003' },
  { id: 'u-peniche', name: 'La Péniche Lune', handle: 'penichelune', kind: 'business', verified: true, color: '#FFB547', bio: 'Guinguette sur l\'eau.', city: 'Paris', followers: 5600, following: [], venueAddress: 'Quai de la Loire, 75019' },
  { id: 'u-malik', name: 'Malik D.', handle: 'malik.d', kind: 'perso', color: '#8B7CFF', bio: 'J\'organise des soirées appart, playlists 2000 garanties.', city: 'Paris', followers: 412, following: ['u-halo', 'u-orbite'] },
  { id: 'u-ines', name: 'Inès L.', handle: 'ines.sort', kind: 'perso', color: '#FF6B5E', bio: 'Nouvelle à Paris, toujours partante.', city: 'Paris', followers: 158, following: ['u-bocal'] },
  { id: 'u-quai9', name: 'Collectif Quai 9', handle: 'quai9', kind: 'perso', color: '#3CF0C8', bio: 'Apéros et pétanque au canal.', city: 'Paris', followers: 890, following: [] },
]

type EvSeed = Omit<SpotEvent, 'going' | 'requests' | 'accepted' | 'createdAt' | 'views' | 'shares' | 'reports'>
const ev = (e: EvSeed): SpotEvent => ({ ...e, going: [], requests: [], accepted: [], createdAt: ago(600), views: Math.round(e.baseGoing * 7.3), shares: Math.round(e.baseGoing * 0.4), reports: 0 })

export function seedEvents(): SpotEvent[] {
  const sat = toSat()
  return [
    ev({ id: 'seed-bocal', hostId: 'u-bocal', title: 'Jam session au Bocal', vibe: 'Jazz', tags: ['live'], start: liveStart(), end: liveEnd(), venue: 'Le Bocal', area: 'Ménilmontant', address: '48 rue de Ménilmontant, 75020', lat: 48.8676, lng: 2.3889, price: 0, visibility: 'open', baseGoing: 38, desc: 'Scène ouverte jazz et soul. Viens avec ton instrument ou juste tes oreilles. Entrée libre, conso conseillée.', colors: ['#3CF0C8', '#8B7CFF'] }),
    ev({ id: 'seed-halo', hostId: 'u-halo', title: 'Sunset House sur le toit', vibe: 'House', tags: ['danser'], start: at(0, 21), end: at(1, 2), venue: 'Halo Rooftop', area: 'Belleville', address: '12 rue de Belleville, 75020', lat: 48.8722, lng: 2.3770, price: 12, ticketUrl: 'https://example.com/billets/halo', visibility: 'open', baseGoing: 142, desc: 'DJ sets house et disco face au coucher de soleil, puis jusqu\'à 2 h. Terrasse chauffée, cocktails à 9 €.', colors: ['#FF4F9A', '#FFB547'], boosted: true }),
    ev({ id: 'seed-appart', hostId: 'u-malik', title: 'Soirée appart années 2000', vibe: '2000', tags: ['danser'], start: at(0, 22), end: at(1, 3), venue: 'Chez Malik', area: 'Oberkampf', address: '21 rue Oberkampf, 75011 (3e étage)', lat: 48.8649, lng: 2.3746, price: 0, visibility: 'request', capacity: 25, baseGoing: 7, desc: 'Playlist 2000-2010, dress code bling bienvenu. Ramène une boisson. 25 personnes max, je valide les demandes.', colors: ['#8B7CFF', '#FF4F9A'] }),
    ev({ id: 'seed-kara', hostId: 'u-voisins', title: 'Karaoké géant', vibe: 'Karaoké', tags: ['chill'], start: at(0, 21, 30), end: at(1, 1), venue: 'Bar Les Voisins', area: 'République', address: '7 place de la République, 75003', lat: 48.8675, lng: 2.3637, price: 0, visibility: 'open', baseGoing: 64, desc: 'Plus de 8 000 titres, un écran géant, et un public qui chante avec toi. Inscription au bar.', colors: ['#FFB547', '#FF6B5E'] }),
    ev({ id: 'seed-orbite', hostId: 'u-orbite', title: 'Orbite : techno jusqu\'à l\'aube', vibe: 'Techno', tags: ['danser'], start: at(0, 23, 30), end: at(1, 6), venue: 'Club Orbite', area: 'Bastille', address: '3 rue de la Roquette, 75011', lat: 48.8540, lng: 2.3720, price: 15, ticketUrl: 'https://example.com/billets/orbite', visibility: 'limited', capacity: 450, baseGoing: 410, desc: 'Trois DJ résidents, sound system refait à neuf. Billets moins chers avant minuit.', colors: ['#FF4F9A', '#3B2BFF'] }),
    ev({ id: 'seed-canal', hostId: 'u-quai9', title: 'Apéro pétanque au canal', vibe: 'Apéro', tags: ['chill'], start: at(1, 18), end: at(1, 21, 30), venue: 'Quai de Valmy', area: 'Canal Saint-Martin', address: 'Quai de Valmy, face au n°96', lat: 48.8719, lng: 2.3650, price: 0, visibility: 'open', baseGoing: 23, desc: 'Boules fournies, on fait des équipes sur place. Ramène de quoi grignoter.', colors: ['#3CF0C8', '#FFB547'] }),
    ev({ id: 'seed-guinguette', hostId: 'u-peniche', title: 'Bal guinguette', vibe: 'Bal', tags: ['live', 'danser'], start: at(sat + 1, 15), end: at(sat + 1, 20), venue: 'La Péniche Lune', area: 'Bassin de la Villette', address: 'Quai de la Loire, 75019', lat: 48.8862, lng: 2.3730, price: 5, visibility: 'open', baseGoing: 96, desc: 'Accordéon, swing et rock\'n\'roll. Initiation à la danse à 15 h.', colors: ['#FFB547', '#8B7CFF'] }),
    ev({ id: 'seed-silent', hostId: 'u-halo', title: 'Silent disco au parc', vibe: 'Disco', tags: ['danser', 'chill'], start: at(sat + 6, 19), end: at(sat + 6, 23), venue: 'Buttes-Chaumont', area: 'Buttes-Chaumont', address: 'Entrée rue Botzaris, 75019', lat: 48.8800, lng: 2.3830, price: 8, ticketUrl: 'https://example.com/billets/silent', visibility: 'open', baseGoing: 51, desc: 'Trois canaux, trois DJ, un casque pour toi.', colors: ['#8B7CFF', '#3CF0C8'] }),
  ]
}

export function seedStories(): Story[] {
  const s = (id: string, authorId: string, eventId: string | undefined, label: string, colors: [string, string], minAgo: number, caption: string): Story => ({
    id, authorId, eventId, caption, media: { kind: 'demo', colors, label }, createdAt: ago(minAgo), expiresAt: inH(24 - minAgo / 60), seenBy: [],
  })
  return [
    s('st-bocal-1', 'u-bocal', 'seed-bocal', 'Jazz', ['#3CF0C8', '#8B7CFF'], 12, 'Le trio vient de monter sur scène, il reste de la place 🎷'),
    s('st-halo-1', 'u-halo', 'seed-halo', 'House', ['#FF4F9A', '#FFB547'], 45, 'Installation des platines, coucher de soleil dans 1 h'),
    s('st-malik-1', 'u-malik', 'seed-appart', '2000', ['#8B7CFF', '#FF4F9A'], 90, 'La playlist est prête. Plus que 18 places !'),
    s('st-orbite-1', 'u-orbite', 'seed-orbite', 'Techno', ['#FF4F9A', '#3B2BFF'], 180, 'Soundcheck du nouveau système 🔊'),
    s('st-quai9-1', 'u-quai9', 'seed-canal', 'Apéro', ['#3CF0C8', '#FFB547'], 300, 'On a trouvé le spot pour demain'),
  ]
}

export function seedPosts(): Post[] {
  return [
    { id: 'p-1', authorId: 'u-halo', text: 'Ce soir on ouvre la saison d\'hiver : terrasse chauffée, plaids et DJ set de 21 h à 2 h. On vous attend 🔥', eventId: 'seed-halo', colors: ['#FF4F9A', '#FFB547'], createdAt: ago(80), likes: [], baseLikes: 231, comments: [{ id: 'c1', authorId: 'u-ines', text: 'J\'arrive avec 2 amies !', createdAt: ago(50) }] },
    { id: 'p-2', authorId: 'u-malik', text: 'Soirée appart ce soir, thème années 2000. Demande ta place sur l\'event, je valide tout le monde avant 20 h.', eventId: 'seed-appart', createdAt: ago(200), likes: [], baseLikes: 34, comments: [] },
    { id: 'p-3', authorId: 'u-ines', text: 'Première jam au Bocal hier, ambiance incroyable et tout le monde est super accueillant. Je recommande à ceux qui viennent d\'arriver en ville !', colors: ['#3CF0C8', '#8B7CFF'], createdAt: ago(1300), likes: [], baseLikes: 58, comments: [{ id: 'c2', authorId: 'u-bocal', text: 'Merci Inès, à très vite 🎶', createdAt: ago(1200) }] },
  ]
}

export function seedNotifs(): Notif[] {
  return [
    { id: 'n-1', kind: 'nearby', title: 'Ça se passe près de toi ce soir', body: 'Jam session au Bocal a commencé, à 1,2 km. Entrée libre.', link: '/event/seed-bocal', createdAt: ago(5), read: false },
    { id: 'n-2', kind: 'story', title: 'Halo Rooftop a publié une story', body: 'Installation des platines, coucher de soleil dans 1 h.', link: '/', createdAt: ago(45), read: false },
  ]
}
