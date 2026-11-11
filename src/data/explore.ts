// « Explorer par catégorie » : chaque catégorie regroupe nos lieux, les lieux du quartier (carte),
// les sorties publiées par les membres et les activités pour adultes de l'agenda.
import { BookOpen, Clapperboard, Drama, Flower2, Gamepad2, Gift, KeyRound, Martini, MicVocal, Mountain, Music, Palette, Sun, UtensilsCrossed, Wine, Guitar } from 'lucide-react'
import type { CatalogItem } from './catalog'
import type { AgendaItem } from './agenda'
import type { SpotEvent } from './types'
import type { Venue } from './venues'

export interface ExploreCat {
  k: string; l: string; en: string; icon: typeof Music
  place?: (p: CatalogItem) => boolean
  venue?: (v: Venue) => boolean
  event?: RegExp
  agenda?: RegExp
}

const txt = (p: CatalogItem) => `${p.kind} ${p.name} ${p.blurb ?? ''}`

export const EXPLORE: ExploreCat[] = [
  { k: 'bars', l: 'Bars', en: 'Bars', icon: Martini, place: (p) => p.category === 'bar', venue: (v) => v.kind === 'Bar' || v.kind === 'Pub', event: /\bbar\b|apéro|5 à 7/i },
  { k: 'speakeasy', l: 'Speakeasy et cocktails', en: 'Speakeasies and cocktails', icon: Wine, place: (p) => /speakeasy|cocktail|tiki|écoute/i.test(txt(p)), event: /cocktail|speakeasy/i },
  { k: 'terrasses', l: 'Terrasses et rooftops', en: 'Patios and rooftops', icon: Sun, place: (p) => /terrasse|rooftop|toit/i.test(txt(p)), venue: (v) => v.kind === 'Terrasse', event: /terrasse|rooftop|toit/i },
  { k: 'clubs', l: 'Clubs', en: 'Clubs', icon: Music, place: (p) => p.category === 'club', venue: (v) => v.kind === 'Boîte de nuit', event: /club|techno|house|disco|dj/i },
  { k: 'live', l: 'Jazz et concerts', en: 'Jazz and concerts', icon: Guitar, place: (p) => /jazz|concert|musique live/i.test(txt(p)), venue: (v) => v.kind === 'Salle de concert', event: /jazz|concert|live|jam/i, agenda: /musique|concert|jazz/i },
  { k: 'karaoke', l: 'Karaoké', en: 'Karaoke', icon: MicVocal, place: (p) => /karaok/i.test(txt(p)), venue: (v) => /karaok/i.test(`${v.kind} ${v.name}`), event: /karaok/i },
  { k: 'jeux', l: 'Jeux et arcades', en: 'Games and arcades', icon: Gamepad2, place: (p) => /arcade|flipper|jeux de société|ludique|réalité virtuelle|quilles/i.test(txt(p)), agenda: /\bjeux\b/i },
  { k: 'escape', l: 'Escape games et défis', en: 'Escape games and challenges', icon: KeyRound, place: (p) => /escape|évasion|défis|hache|tir à l'arc/i.test(txt(p)) },
  { k: 'escalade', l: 'Escalade', en: 'Climbing', icon: Mountain, place: (p) => /escalade|bloc/i.test(p.kind) },
  { k: 'gourmand', l: 'Restos et gourmand', en: 'Food and restaurants', icon: UtensilsCrossed, place: (p) => p.category === 'gastro', event: /resto|souper|dégustation|brunch/i, agenda: /cuisine/i },
  { k: 'marches', l: 'Marchés et fêtes', en: 'Markets and festivals', icon: Gift, place: (p) => p.category === 'fetes', agenda: /fête|marché|festival/i },
  { k: 'lecture', l: 'Clubs de lecture', en: 'Book clubs', icon: BookOpen, agenda: /lecture|littérature|parole|philo/i, event: /lecture|livre|book club/i },
  { k: 'spectacles', l: 'Théâtre et humour', en: 'Theatre and comedy', icon: Drama, agenda: /théâtre|humour|danse|spectacle/i, event: /théâtre|humour|stand-up|impro/i },
  { k: 'expos', l: 'Expos et art', en: 'Exhibitions and art', icon: Palette, agenda: /exposition|art|artisanat/i, event: /expo|vernissage|galerie/i },
  { k: 'cinema', l: 'Cinéma', en: 'Film', icon: Clapperboard, agenda: /cinéma|film/i, event: /cinéma|film|projection/i },
  { k: 'bienetre', l: 'Bien-être et sport', en: 'Wellness and sports', icon: Flower2, agenda: /bien-être|sport|plein air/i, event: /yoga|course|sport|vélo/i },
]

export const matchEvent = (c: ExploreCat, e: SpotEvent) => !!c.event && c.event.test(`${e.title} ${e.vibe} ${e.tags.join(' ')} ${e.venue}`)
export const matchAgenda = (c: ExploreCat, a: AgendaItem) => !!c.agenda && c.agenda.test(`${a.type} ${a.title}`)
