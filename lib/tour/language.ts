'use client'

import { useCallback, useEffect, useState } from 'react'

export type Lang = 'en' | 'es'

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

const KEY = 'cc-lang'
const EVENT = 'cc-lang-change'

function read(): Lang {
  if (typeof window === 'undefined') return 'en'
  try {
    return localStorage.getItem(KEY) === 'es' ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

/**
 * Reads and writes the tour language preference, kept in localStorage and
 * synced across components in the same tab via a custom event (and across
 * tabs via the native storage event).
 */
export function useLanguage(): {
  lang: Lang
  setLang: (l: Lang) => void
  hydrated: boolean
} {
  const [lang, setLangState] = useState<Lang>('en')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLangState(read())
    setHydrated(true)
    const onChange = () => setLangState(read())
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* ignore */
    }
    setLangState(l)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { lang, setLang, hydrated }
}

/**
 * Maps an English audio URL onto its localized counterpart. English files
 * live at /audio/<file>; other languages at /audio/<lang>/<file>.
 */
export function localizeAudioUrl(url: string | null, lang: Lang): string | null {
  if (!url || lang === 'en') return url
  return url.replace('/audio/', `/audio/${lang}/`)
}
