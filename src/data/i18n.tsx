import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'fr' | 'en'
const guess = (): Lang => (typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'fr')

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist((set) => ({ lang: guess(), setLang: (lang) => { set({ lang }); document.documentElement.lang = lang } }), { name: 'spotla-lang' }),
)

/** Traduction légère : t('Maintenant', 'Now'). Le français reste la langue de référence. */
export function useT() {
  const lang = useLang((s) => s.lang)
  return (fr: string, en: string) => (lang === 'en' ? en : fr)
}

export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Langue / Language">
      <button className={lang === 'fr' ? 'on' : ''} onClick={() => setLang('fr')}>FR</button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  )
}

// ---------- Traduction automatique de l'écran ----------
// Tout le texte affiché passe par le dictionnaire (en.ts) quand l'app est en anglais, y compris les messages,
// boutons, champs et infobulles. Changer de langue relance l'affichage, donc le français revient tel quel.
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt']
let dict: { EN: Record<string, string>; PATTERNS: [RegExp, string | ((...m: string[]) => string)][] } | null = null
const norm = (s: string) => s.replace(/[\s  ]+/g, ' ').trim()

function tr(raw: string): string | null {
  if (!dict) return null
  const k = norm(raw)
  if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return null
  const hit = dict.EN[k]
  if (hit !== undefined) return hit
  for (const [re, rep] of dict.PATTERNS) {
    if (re.test(k)) return typeof rep === 'string' ? k.replace(re, rep) : k.replace(re, rep as (...m: string[]) => string)
  }
  return null
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const v = root.nodeValue ?? ''
    const out = tr(v)
    if (out !== null && out !== norm(v)) {
      const lead = v.match(/^\s*/)?.[0] ?? '', tail = v.match(/\s*$/)?.[0] ?? ''
      root.nodeValue = lead + out + tail
    }
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return
  const el = root as Element
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return
  for (const a of ATTRS) {
    const v = el.getAttribute(a)
    if (v) { const out = tr(v); if (out !== null && out !== v) el.setAttribute(a, out) }
  }
  if (el.tagName === 'TEXTAREA') return
  for (const c of Array.from(el.childNodes)) walk(c)
}

let observer: MutationObserver | null = null
export async function startAutoTranslate(lang: Lang) {
  observer?.disconnect(); observer = null
  if (lang !== 'en') return
  if (!dict) dict = await import('./en')
  walk(document.body)
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') walk(m.target)
      else if (m.type === 'attributes') walk(m.target)
      else m.addedNodes.forEach(walk)
    }
  })
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS })
}
