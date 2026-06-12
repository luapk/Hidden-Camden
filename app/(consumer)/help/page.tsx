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
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Help
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Sort it out
        </h1>
      </header>

      {/* Settings card */}
      <section className="mt-6 border border-white/10 bg-night-2 p-4">
        <h2 className="font-jost text-lg font-bold uppercase tracking-tight text-label-1">
          Your tour, your way
        </h2>

        <div className="mt-4">
          <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
            <Globe size={14} weight="bold" />
            Language
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {LANGS.map((l) => {
              const active = hydrated && l === lang
              return (
                <button
                  key={l}
                  onClick={() => pickLang(l)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'border-acid bg-acid text-black'
                      : 'border-white/10 bg-night-3 text-label-1'
                  }`}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
            <Waveform size={14} weight="bold" />
            Voice
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {VOICES.map((v) => {
              const active = hydrated && v === voice
              return (
                <button
                  key={v}
                  onClick={() => pickVoice(v)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'border-acid bg-acid text-black'
                      : 'border-white/10 bg-night-3 text-label-1'
                  }`}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-4 font-grotesk text-[10.5px] text-label-3">
          More languages landing soon.
        </p>
      </section>

      {/* FAQ accordion */}
      <section className="mt-7">
        <h2 className="font-grotesk text-[11px] uppercase tracking-[0.3em] text-label-2">
          Questions, answered
        </h2>
        <div className="mt-3 border-t border-white/10">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q} className="border-b border-white/10">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left"
                >
                  <span
                    className={`text-[14px] font-semibold ${
                      isOpen ? 'text-acid' : 'text-label-1'
                    }`}
                  >
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0"
                  >
                    <CaretDown
                      size={16}
                      weight="bold"
                      color={isOpen ? '#CCFF00' : '#5A5A5F'}
                    />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-[13.5px] leading-relaxed text-label-2">
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
