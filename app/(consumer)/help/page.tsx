'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Globe, Waveform } from '@phosphor-icons/react'

const LANGS = ['English', 'Français', 'Deutsch', 'Español', 'Italiano']
const VOICES = ['North London', 'RP', 'Cockney legend']

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Why does the app need my location?',
    a: 'Stories unlock when you physically arrive at each venue, so the app watches your position while the tour screen is open. We check distance, nothing else, and nothing runs in the background.',
  },
  {
    q: 'What if my code expires at the bar?',
    a: 'Nothing is lost. Codes live for 60 seconds, your drink does not. Reopen the voucher and get a fresh code. Codes are cheap, vouchers are precious.',
  },
  {
    q: 'How long do banked drinks last?',
    a: 'Seven days from the moment you bank them. The tour stays an hour, the pints stay yours for the week.',
  },
  {
    q: 'What happens if I lose signal?',
    a: 'Stories you have unlocked stay unlocked, and banked drinks stay banked on your phone. Redeeming needs a connection, so step towards a window before you wave the bar over.',
  },
  {
    q: 'Is the tour accessible without audio?',
    a: 'Yes. Every stop has a full transcript, and you can mark a story as listened to bank the drink. The route is step-free apart from the market cobbles.',
  },
  {
    q: 'Can I get a refund?',
    a: 'If the tour did not work for you, write to support within 14 days of purchase and we will sort it. Tell us what went wrong so we can fix it for the next walker.',
  },
]

export default function HelpPage() {
  const [lang, setLang] = useState(LANGS[0])
  const [voice, setVoice] = useState(VOICES[0])
  const [hydrated, setHydrated] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('cc-lang')
      const storedVoice = localStorage.getItem('cc-voice')
      if (storedLang && LANGS.includes(storedLang)) setLang(storedLang)
      if (storedVoice && VOICES.includes(storedVoice)) setVoice(storedVoice)
    } catch {
      /* fine, defaults stand */
    }
    setHydrated(true)
  }, [])

  const pickLang = (value: string) => {
    setLang(value)
    try {
      localStorage.setItem('cc-lang', value)
    } catch {
      /* ignore */
    }
  }

  const pickVoice = (value: string) => {
    setVoice(value)
    try {
      localStorage.setItem('cc-voice', value)
    } catch {
      /* ignore */
    }
  }

  return (
    <main>
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-hotpink">
          Help
        </div>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink">
          Sort it out
        </h1>
      </header>

      {/* Settings card */}
      <section className="mt-5 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg uppercase text-ink">
          Your tour, your way
        </h2>

        <div className="mt-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">
            <Globe size={14} weight="bold" />
            Language
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGS.map((l) => {
              const active = hydrated && l === lang
              return (
                <button
                  key={l}
                  onClick={() => pickLang(l)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'border-electric bg-electric text-white'
                      : 'border-ink/15 bg-white text-ink'
                  }`}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">
            <Waveform size={14} weight="bold" />
            Voice
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOICES.map((v) => {
              const active = hydrated && v === voice
              return (
                <button
                  key={v}
                  onClick={() => pickVoice(v)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'border-camden bg-camden text-white'
                      : 'border-ink/15 bg-white text-ink'
                  }`}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-3 font-mono text-[10.5px] text-smoke">
          More languages landing soon.
        </p>
      </section>

      {/* FAQ accordion */}
      <section className="mt-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-smoke">
          Questions, answered
        </h2>
        <div className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white shadow-sm">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-[14px] font-semibold text-ink">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <CaretDown size={16} weight="bold" color="#8A8077" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-ink/75">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
