import { toast } from '../data/store'

/** Partage natif sur mobile, sinon copie du lien. */
export async function share(title: string, hash: string) {
  const url = `${location.origin}${location.pathname}${hash}`
  try {
    if (navigator.share) { await navigator.share({ title, text: `${title} sur SpotLa`, url }); return true }
    await navigator.clipboard.writeText(url)
    toast('Lien copié', 'Colle-le dans tes messages pour inviter du monde.')
    return true
  } catch {
    return false
  }
}
