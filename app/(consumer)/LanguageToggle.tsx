'use client'

import { useLanguage } from '@/lib/tour/language'

/**
 * Compact EN/ES language switch with flags, for wherever the narration
 * language should be changeable at a glance (voice picker, tour header).
 * Inline SVG flags render consistently across platforms (unlike emoji flags,
 * which don't show on Windows).
 */

function FlagUK() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 V30 M0,15 H60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

function FlagES() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <rect width="60" height="30" fill="#AA151B" />
      <rect y="7.5" width="60" height="15" fill="#F1BF00" />
    </svg>
  )
}

const ITEMS = [
  { code: 'en' as const, label: 'EN', name: 'English', Flag: FlagUK },
  { code: 'es' as const, label: 'ES', name: 'Español', Flag: FlagES },
]

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, hydrated } = useLanguage()

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-night-2 p-1 ${className}`}
    >
      {ITEMS.map(({ code, label, name, Flag }) => {
        const active = hydrated && lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-label={name}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors ${
              active ? 'bg-acid' : 'bg-transparent'
            }`}
          >
            <span className="h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/40">
              <Flag />
            </span>
            <span
              className={`font-grotesk text-[10px] font-bold tracking-[0.1em] ${
                active ? 'text-black' : 'text-label-2'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
