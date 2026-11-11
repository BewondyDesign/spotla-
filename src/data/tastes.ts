// Goûts de sortie choisis à l'inscription (et modifiables dans les réglages).
// L'accueil met d'abord ce que la personne aime, puis tout le reste en dessous : rien n'est caché.
import type { Category } from './catalog'
import type { SpotEvent } from './types'

export interface Taste { k: string; l: string; en: string; cats: Category[]; tags: string[]; words: RegExp }

export const TASTES: Taste[] = [
  { k: 'danser', l: 'Clubs et danse', en: 'Clubs and dancing', cats: ['club'], tags: ['danser'], words: /danse|danser|club|dj|techno|house|électro|disco/i },
  { k: 'live', l: 'Concerts et musique live', en: 'Concerts and live music', cats: ['soiree'], tags: ['live'], words: /concert|musique|jazz|live|chanson|orchestre/i },
  { k: 'apero', l: 'Bars et apéros', en: 'Bars and drinks', cats: ['bar'], tags: ['apero'], words: /bar|apéro|cocktail|vin|bière|5 à 7/i },
  { k: 'jeux', l: 'Activités et jeux', en: 'Activities and games', cats: ['jeux'], tags: [], words: /jeu|arcade|escalade|escape|quilles|karaoké|réalité virtuelle/i },
  { k: 'gourmand', l: 'Restos et gourmand', en: 'Food and restaurants', cats: ['gastro'], tags: [], words: /cuisine|gourmand|resto|restaurant|marché|dégustation|chef/i },
  { k: 'culture', l: 'Culture et spectacles', en: 'Culture and shows', cats: [], tags: ['culture'], words: /théâtre|exposition|expo|art|cinéma|film|humour|danse|musée|spectacle|lecture/i },
  { k: 'fetes', l: 'Festivals et marchés', en: 'Festivals and markets', cats: ['fetes'], tags: [], words: /festival|fête|marché|noël|lumi/i },
  { k: 'chill', l: 'Chill', en: 'Chill', cats: [], tags: ['chill'], words: /chill|calme|café|lounge/i },
  { k: 'sport', l: 'Sport et plein air', en: 'Sports and outdoors', cats: [], tags: ['sport'], words: /sport|plein air|vélo|course|yoga|patin|randonnée|bien-être/i },
]

const pick = (keys: string[] | undefined) => TASTES.filter((t) => keys?.includes(t.k))

/** 1 si ça correspond à au moins un goût, sinon 0. */
export const likesPlace = (keys: string[] | undefined, p: { category: string; kind?: string; name?: string }) =>
  pick(keys).some((t) => t.cats.includes(p.category as Category) || t.words.test(`${p.kind ?? ''} ${p.name ?? ''}`)) ? 1 : 0
export const likesEvent = (keys: string[] | undefined, e: SpotEvent) =>
  pick(keys).some((t) => e.tags.some((g) => t.tags.includes(g)) || t.words.test(`${e.vibe} ${e.title}`)) ? 1 : 0
export const likesAgenda = (keys: string[] | undefined, a: { title: string; type: string }) =>
  pick(keys).some((t) => t.words.test(`${a.type} ${a.title}`)) ? 1 : 0

/** Tri stable : ce qui correspond aux goûts d'abord, l'ordre d'origine ensuite. */
export function lovedFirst<T>(list: T[], score: (x: T) => number): T[] {
  return list.map((x, i) => ({ x, i, s: score(x) })).sort((a, b) => b.s - a.s || a.i - b.i).map((o) => o.x)
}
