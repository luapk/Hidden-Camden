'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CaretDown,
  Check,
  FlagCheckered,
  Globe,
  LockSimple,
  Waveform,
} from '@phosphor-icons/react'
import { LANGUAGES, useLanguage } from '@/lib/tour/language'
import { TOURS, getTour, useActiveTour, type TourId } from '@/lib/tour/tours'
import { useTourProgress } from '@/lib/tour/useTourProgress'
import GuidePicker from '../GuidePicker'

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
  const {
    tourId: activeTourId,
    tour: activeTour,
    setTour,
    hydrated: tourHydrated,
  } = useActiveTour()
  const crawlProgress = useTourProgress('crawl')
  const cultureProgress = useTourProgress('culture')
  const [tabOverride, setTabOverride] = useState<TourId | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  const progressFor = (id: TourId) =>
    id === 'crawl' ? crawlProgress : cultureProgress

  // Switching routes mid-walk would be chaos: the streets are sequenced,
  // the wallet is not. You change tours before you start, or after you
  // finish, never in between.
  const activeProgress = progressFor(activeTourId)
  const activeTotal = activeTour.stops.length
  const activeComplete = activeProgress.bankedStops.length >= activeTotal
  const lockedIn =
    tourHydrated && activeProgress.tourStarted && !activeComplete

  const viewId: TourId = tabOverride ?? activeTourId
  const viewTour = getTour(viewId)
  const viewProgress = progressFor(viewId)
  const viewTotal = viewTour.stops.length
  const viewBanked = viewProgress.bankedStops.length

  const viewStatus = !viewProgress.hydrated
    ? ''
    : viewBanked >= viewTotal
      ? 'Complete'
      : viewProgress.tourStarted
        ? `In progress · ${String(viewBanked).padStart(2, '0')}/${String(viewTotal).padStart(2, '0')}`
        : 'Not started'

  const isViewingActive = viewId === activeTourId

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

      {/* ── The tour: two routes, one at a time ── */}
      <section className="mt-6">
        {/* Route tabs, set like ticket stubs */}
        <div
          className="flex gap-1 border border-white/10 bg-night-2 p-1"
          role="tablist"
          aria-label="Routes"
        >
          {TOURS.map((t) => {
            const selected = t.id === viewId
            const isActiveTour = t.id === activeTourId
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setTabOverride(t.id)}
                className={`relative flex-1 py-2.5 font-grotesk text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  selected ? 'bg-acid text-black' : 'text-label-2'
                }`}
              >
                {t.id === 'crawl' ? 'Music venues' : 'Culture'}
                {isActiveTour && !selected && (
                  <span
                    className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-acid"
                    aria-hidden
                  />
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Tour card */}
            <div
              className={`relative mt-3 overflow-hidden border bg-night-2 p-4 ${
                isViewingActive ? 'border-acid/50' : 'border-white/10'
              }`}
            >
              {isViewingActive && (
                <span
                  className="absolute inset-y-0 left-0 w-[3px] bg-acid shadow-[0_0_12px_rgba(204,255,0,0.5)]"
                  aria-hidden
                />
              )}
              {/* Ghost stop count */}
              <span
                className="pointer-events-none absolute -top-2 right-3 font-grotesk text-[64px] font-bold leading-none text-white/[0.05]"
                aria-hidden
              >
                {String(viewTotal).padStart(2, '0')}
              </span>

              <div className="flex items-center gap-2">
                <span className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-label-3">
                  {viewStatus}
                </span>
              </div>
              <h2 className="mt-1 font-jost text-[22px] font-bold uppercase leading-tight tracking-tight text-label-1">
                {viewTour.name}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-label-2">
                {viewTour.tagline}
              </p>
              <div className="mt-3 flex items-center gap-2 font-grotesk text-[10px] uppercase tracking-[0.12em] text-label-3">
                <FlagCheckered size={12} weight="fill" color="#CCFF00" />
                {viewTotal} stops · first two free · starts at Camden Town tube
              </div>

              {/* The decision surface */}
              {isViewingActive ? (
                <div className="mt-4 flex items-center gap-2 border border-acid/40 bg-acid/10 px-3 py-2.5">
                  <Check size={14} weight="bold" color="#CCFF00" />
                  <span className="font-grotesk text-[11px] font-bold uppercase tracking-[0.15em] text-acid">
                    You are walking this one
                  </span>
                </div>
              ) : lockedIn ? (
                <div className="mt-4 border border-white/10 bg-night-3/70 px-3 py-3">
                  <div className="flex items-center gap-2 font-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-label-2">
                    <LockSimple size={12} weight="bold" />
                    One walk at a time
                  </div>
                  <p className="mt-1.5 font-grotesk text-[11px] leading-relaxed text-label-3">
                    You are {activeProgress.bankedStops.length} of {activeTotal}{' '}
                    stops into {activeTour.name}. Finish it to change routes.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setTour(viewId)}
                  className="mt-4 w-full bg-acid px-4 py-3 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
                >
                  Walk this one
                </button>
              )}
            </div>

            {/* The voice for this route */}
            <div id="guide" className="mt-6 scroll-mt-6">
              <div className="flex items-center gap-1.5 font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-2">
                <Waveform size={14} weight="bold" />
                Your guide
              </div>
              <GuidePicker tourId={viewId} />
              <p className="mt-2.5 font-grotesk text-[10.5px] text-label-3">
                {viewId === 'culture'
                  ? 'The house voice leads the Culture Cut. Star guides are a venues thing, for now.'
                  : 'Same route, same stops, a different voice in your ears. Guides narrate in English.'}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
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
