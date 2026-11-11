// Vidéos d'ambiance libres de droits (licence gratuite Mixkit : usage commercial permis, sans attribution).
// Ce sont des images d'illustration, pas des vidéos des lieux eux-mêmes.
export const MK = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`
export const mkPoster = (url: string) => url.replace(/-720\.mp4$/, '-thumb-720-0.jpg')

const POOL = {
  club: [14105, 4187, 9586, 50499, 341, 832],
  techno: [50499, 4187, 14105, 9586],
  dj: [4026, 4187, 14088],
  concert: [14084, 48507, 13265, 17631, 14108, 4185, 11942],
  live: [14106, 14756, 4632, 11942],
  jazz: [14756, 4632, 4043],
  bar: [4043, 4295, 22441],
  fete: [14088, 13265, 4139, 46591],
  feux: [4064, 48290],
  lumiere: [100516, 31437, 50499],
  scene: [51283, 11942, 14756],
  marche: [46591, 29479, 32558],
} satisfies Record<string, number[]>

export const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const pick = (key: string, pool: number[]) => MK(pool[hashOf(key) % pool.length])

const RULES: [RegExp, keyof typeof POOL][] = [
  [/techno|house|électro|electro|rave/i, 'techno'],
  [/club|disco|2000|danse/i, 'club'],
  [/dj/i, 'dj'],
  [/jazz|blues|karaoké|karaoke/i, 'jazz'],
  [/apéro|apero|bar|cocktail|terrasse|rooftop/i, 'bar'],
  [/concert|musique|osheaga|francos|chanson/i, 'concert'],
  [/feux|fête nationale|nuit blanche/i, 'feux'],
  [/lumi|lantern/i, 'lumiere'],
  [/théâtre|theatre|danse|humour|cinéma|spectacle|performance/i, 'scene'],
  [/marché|cuisine|gourmand|food/i, 'marche'],
  [/fête|festival|bal|défilé|fierté|party/i, 'fete'],
]

/** Une vidéo d'ambiance stable pour un texte (titre, type, ambiance) : la même à chaque affichage. */
export function videoFor(key: string, ...hints: (string | undefined)[]) {
  return videoIfMatch(key, ...hints) ?? pick(key, POOL.fete)
}
/** Pareil, mais rien si le texte ne correspond à aucune ambiance (une expo ou une lecture gardent leur photo). */
export function videoIfMatch(key: string, ...hints: (string | undefined)[]) {
  const text = hints.filter(Boolean).join(' ')
  const rule = RULES.find(([r]) => r.test(text))
  return rule ? pick(key, POOL[rule[1]]) : undefined
}

/** Vidéo d'ambiance d'une soirée, choisie d'après son ambiance et son titre. */
export const eventVideo = (e: { id: string; vibe?: string; title?: string; venue?: string }) => videoFor(e.id, e.vibe, e.title, e.venue)

const CAT_HINT: Record<string, string> = { club: 'club', bar: 'bar', soiree: 'fête', fetes: 'festival', gastro: 'marché' }
/** Une carte de lieu sur deux s'anime avec une vidéo d'ambiance de sa catégorie ; l'autre garde sa photo. */
export const placeVideo = (p: { id: string; category: string; video?: string; rank?: number }) =>
  p.video ?? (((p.rank ?? 0) % 2 === 1 || (p.rank == null && hashOf(p.id) % 2 === 0)) ? videoFor(p.id, CAT_HINT[p.category]) : undefined)
