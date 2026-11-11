// Vidéos d'ambiance libres de droits (licence gratuite Mixkit : usage commercial permis, sans attribution).
// Ce sont des images d'illustration, pas des vidéos des lieux eux-mêmes.
export const MK = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`
export const mkPoster = (url: string) => url.replace(/-720\.mp4$/, '-thumb-720-0.jpg')

const POOL = {
  noel: [29431, 3323, 46591, 46530, 25034],
  techno: [832, 45439, 4187, 33901],
  house: [4187, 303, 14105],
  disco: [1352, 344, 33900],
  club: [14105, 303, 33901],
  karaoke: [4632],
  jazz: [24759, 50319, 43744, 652],
  bal: [344, 303],
  apero: [27685, 42778, 25459],
  cocktail: [4172, 4295, 22441],
  vin: [41257, 27685],
  vinyle: [42920, 47499],
  concert: [14084, 48507, 48509, 14106, 14108],
  feux: [4064, 48290],
  lumiere: [48301, 34053],
  cinema: [28422, 18318],
  theatre: [43400, 21829],
  humour: [21829],
  danse: [51283, 33896],
  fierte: [47143, 33899],
  cuisine: [39535, 13261, 15875],
  fete: [13265, 14088],
} satisfies Record<string, number[]>

export const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const pick = (key: string, pool: number[]) => MK(pool[hashOf(key) % pool.length])

const RULES: [RegExp, keyof typeof POOL][] = [
  [/noël|noel|fêtes de fin|marché d'hiver|hivernal/i, 'noel'],
  [/fierté|pride|lgbt|drag/i, 'fierte'],
  [/karaoké|karaoke/i, 'karaoke'],
  [/techno|électro|electro|rave|igloofest/i, 'techno'],
  [/house/i, 'house'],
  [/disco|2000|années 80|années 90/i, 'disco'],
  [/jazz|blues|swing/i, 'jazz'],
  [/\bbal\b|danse de salon|tango|salsa/i, 'bal'],
  [/vin\b|vins|dégustation/i, 'vin'],
  [/cocktail|speakeasy|tiki/i, 'cocktail'],
  [/apéro|apero|terrasse|rooftop|5 à 7/i, 'apero'],
  [/vinyle|vinyl|bar d'écoute/i, 'vinyle'],
  [/feux d'artifice|fête nationale|saint-jean/i, 'feux'],
  [/lumi|lantern/i, 'lumiere'],
  [/cinéma|cinema|film|projection/i, 'cinema'],
  [/humour|stand-up|comédie/i, 'humour'],
  [/théâtre|theatre/i, 'theatre'],
  [/danse|ballet/i, 'danse'],
  [/cuisine|gourmand|restaurant|resto|chef|table/i, 'cuisine'],
  [/concert|musique|chanson|spectacle/i, 'concert'],
  [/club|boîte|discothèque/i, 'club'],
  [/fête|festival|party|soirée/i, 'fete'],
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
export const eventVideo = (e: { id: string; vibe?: string; title?: string; venue?: string }) => videoIfMatch(e.id, e.title, e.vibe) ?? videoFor(e.id, e.venue)

const CAT_HINT: Record<string, string> = { club: 'club', bar: 'cocktail', soiree: 'soirée', fetes: 'fête', gastro: 'cuisine' }
/** Vidéo du lieu : celle choisie pour lui dans le catalogue, sinon une vidéo qui correspond à sa catégorie. */
export const placeVideo = (p: { id: string; category: string; video?: string; rank?: number }) =>
  p.video ?? videoIfMatch(p.id, CAT_HINT[p.category])
