// Stockage local des vidéos et photos (IndexedDB). Avec Supabase, ce module sera
// remplacé par des envois vers Supabase Storage ; l'interface reste la même.

const DB = 'spotla-media'
const STORE = 'blobs'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const cache = new Map<string, string>()

export async function blobUrl(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!
  try {
    const db = await open()
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result as Blob | undefined)
      req.onerror = () => reject(req.error)
    })
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    cache.set(key, url)
    return url
  } catch {
    return null
  }
}

export const MAX_STORY_SECONDS = 30

/** Lit la durée d'une vidéo sans l'envoyer nulle part. */
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      const d = v.duration
      URL.revokeObjectURL(v.src)
      resolve(d)
    }
    v.onerror = () => reject(new Error('Vidéo illisible'))
    v.src = URL.createObjectURL(file)
  })
}
