'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Globe, UsersThree } from '@phosphor-icons/react'
import { LANGUAGES, useLanguage } from '@/lib/tour/language'
import GuideCast from '../GuideCast'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Why does the app need my location?',
    a: 'Stories unlock when you physically arrive at each venue, so the app watches your position while the tour screen is open. We check distance, nothing else, and nothing runs in the background.',
  },
  {
    q: 'How do the free drinks work?',
    a: "Two Wolfie's are on us. The first lands when you hear the third story, the second at the Roundhouse finale. Both wait in your wallet.",
  },
  {
    q: 'What is Wolfie\'s?',
    a: "Rod Stewart's rock 'n' roll blended Scotch. Have it neat, on the rocks, or long with a mixer. Your call.",
  },
  {
    q: 'What if my code expires at the bar?',
    a: 'Nothing is lost. Codes live for 60 seconds, your drink does not. Reopen the voucher and get a fresh code.',
  },
  {
    q: 'How long do the drinks last?',
    a: 'Seven days from the moment you earn them. The tour takes an evening, the drinks stay yours for the week.',
  },
  {
    q: 'What happens if I lose signal?',
    a: 'Stories you have unlocked stay unlocked, and earned drinks stay in your wallet on your phone. Redeeming needs a connection, so step towards a window before you wave the bar over.',
  },
  {
    q: 'Is the tour accessible without audio?',
    a: 'Yes. Every stop has a full transcript, and you can mark a story as listened to move on. The route is step-free apart from the market cobbles.',
  },
]

export default function SettingsPage() {
  const { lang, setLang, hydrated } = useLanguage()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <main>
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Guides
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Meet your guides
        </h1>
      </header>

      {/* ── The cast: one host, guests on the stops tied to them ── */}
      <section id="guides" className="mt-6 scroll-mt-6">
        <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
          <UsersThree size={14} weight="bold" />
          One walk, a cast of Camden voices
        </div>
        <GuideCast />
        <p className="mt-2.5 font-grotesk text-[10.5px] text-label-3">
          Guests narrate in English. Until a guest&apos;s story lands, your host
          tells it.
        </p>
      </section>

      {/* ── Language ── */}
      <section className="mt-8 border border-white/10 bg-night-2 p-4">
        <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
          <Globe size={14} weight="bold" />
          Language
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const active = hydrated && l.code === lang
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  active
                    ? 'border-acid bg-acid text-black'
                    : 'border-white/10 bg-night-3 text-label-1'
                }`}
              >
                {l.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2.5 font-grotesk text-[10.5px] text-label-3">
          Switches the narration for every stop. More languages landing soon.
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

      {/* Map data credit — required by the OSM licence, housed here so the
          map canvas stays clean. */}
      <p className="mt-10 pb-4 text-center font-grotesk text-[9.5px] text-label-3">
        Map data ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OpenStreetMap
        </a>{' '}
        contributors · Tiles by OpenFreeMap
      </p>
    </main>
  )
}
