// Modèle de données de SpotLa. Il reflète les tables de supabase/schema.sql
// pour que le passage du stockage local au vrai backend soit direct.

export type AccountKind = 'perso' | 'business'

/** Qui peut venir : ouvert à tous, places limitées, sur demande, ou cercle restreint (abonnés). */
export type Visibility = 'open' | 'limited' | 'request' | 'circle'

export type Moment = 'tonight' | 'today' | 'weekend' | 'later' | 'past'

export interface User {
  id: string
  name: string
  handle: string
  kind: AccountKind
  verified?: boolean
  color: string
  bio: string
  city: string
  followers: number
  /** ids des comptes suivis */
  following: string[]
  vibes?: string[]
  /** Business : adresse du lieu */
  venueAddress?: string
  /** Photo de profil et couverture (image ou courte vidéo) */
  avatarUrl?: string
  coverUrl?: string
  coverKind?: 'image' | 'video'
}

export interface SpotEvent {
  id: string
  hostId: string
  title: string
  vibe: string
  tags: string[]
  start: string // ISO
  end: string // ISO
  venue: string
  area: string
  address: string
  lat: number
  lng: number
  price: number // 0 = gratuit
  ticketUrl?: string
  visibility: Visibility
  capacity?: number
  /** participants « de base » (données de démo) en plus des ids réels */
  baseGoing: number
  going: string[]
  requests: string[]
  accepted: string[]
  desc: string
  colors: [string, string]
  createdAt: string
  boosted?: boolean
  views: number
  shares: number
  reports: number
}

export type StoryMedia =
  | { kind: 'video'; blobKey?: string; url?: string; duration: number }
  | { kind: 'demo'; colors: [string, string]; label: string }

export interface Story {
  id: string
  authorId: string
  eventId?: string
  caption: string
  media: StoryMedia
  createdAt: string
  expiresAt: string
  seenBy: string[]
}

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  text: string
  eventId?: string
  imageKey?: string
  imageUrl?: string
  colors?: [string, string]
  createdAt: string
  likes: string[]
  baseLikes: number
  comments: Comment[]
}

export interface Notif {
  id: string
  kind: 'nearby' | 'request' | 'accepted' | 'like' | 'comment' | 'follow' | 'story'
  title: string
  body: string
  link?: string
  createdAt: string
  read: boolean
}
