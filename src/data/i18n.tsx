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
