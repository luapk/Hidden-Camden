'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Globe, PersonSimpleWalk } from '@phosphor-icons/react'
import { LANGUAGES, useLanguage } from '@/lib/tour/language'
import WalkPicker from '../GuidePicker'

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

export default function SettingsPage() {
  const { lang, setLang, hydrated } = useLanguage()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <main>
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Settings
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Your tour, your way
        </h1>
      </header>

      {/* ── One list, one decision: the walk and the voice ── */}
      <section id="guide" className="mt-6 scroll-mt-6">
        <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
          <PersonSimpleWalk size={14} weight="bold" />
          Choose your walk
        </div>
        <WalkPicker />
        <p className="mt-2.5 font-grotesk text-[10.5px] text-label-3">
          Guides narrate in English. One walk at a time: routes lock while a
          tour is in progress, voices can change whenever.
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
