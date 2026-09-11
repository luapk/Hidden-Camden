'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BeerStein,
  Headphones,
  MapTrifold,
  PersonSimpleWalk,
} from '@phosphor-icons/react'

/**
 * First-run splash: four steps explaining how the tour works, on acid, over
 * rolling Camden photos. Shown once per browser (localStorage flag), then it
 * gets out of the way. The images are the promo music-legend shots as
 * placeholders; swap for real Camden street photography when cleared.
 */

const STORAGE_KEY = 'cc-onboarded'

const PHOTOS = [
  '/promo/assets/hero/pete.png',
  '/promo/assets/hero/zeppelin.png',
  '/promo/assets/hero/prince.png',
  '/promo/assets/hero/roses.png',
]

const STEPS = [
  {
    Icon: PersonSimpleWalk,
    eyebrow: 'Step 1',
    head: 'Walk the route',
    body: 'Start at Camden Town tube and follow the dotted line through the most musical half-mile on Earth.',
  },
  {
    Icon: Headphones,
    eyebrow: 'Step 2',
    head: 'Stories unlock on arrival',
    body: 'Each stop stays locked until you are standing outside it. Get close, wait a beat, and the story plays in your ears.',
  },
  {
    Icon: BeerStein,
    eyebrow: 'Step 3',
    head: 'Bank your reward',
    body: 'Every stop drops a real reward onto your phone. It keeps for seven days, so claim it whenever suits.',
  },
  {
    Icon: MapTrifold,
    eyebrow: 'Step 4',
    head: 'Pick a guide and go',
    body: 'Choose who walks you round, press start, and keep your eyes up. The good stuff is above street level.',
  },
]

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(0)
  const ready = useRef(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== 'ok') setShow(true)
    } catch {
      setShow(true)
    }
    ready.current = true
  }, [])

  // Cross-fade the Camden photos while the splash is open.
  useEffect(() => {
    if (!show) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(
      () => setPhoto((p) => (p + 1) % PHOTOS.length),
      3200,
    )
    return () => window.clearInterval(id)
  }, [show])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'ok')
    } catch {
      /* ignore — still close for this session */
    }
    setShow(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  if (!show) return null

  const active = STEPS[step]
  const Icon = active.Icon
  const last = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-acid text-black">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pb-8 pt-[max(env(safe-area-inset-top),20px)]">
        {/* Top row: wordmark + skip */}
        <div className="flex items-center justify-between">
          <span className="font-grotesk text-[11px] font-bold uppercase tracking-[0.25em] text-black/80">
            Hidden Camden
          </span>
          {!last && (
            <button
              onClick={dismiss}
              className="font-grotesk text-[11px] font-bold uppercase tracking-[0.2em] text-black/55"
            >
              Skip
            </button>
          )}
        </div>

        {/* Rolling Camden photo window */}
        <div className="relative mt-5 aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-black/80 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          {PHOTOS.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 transition-opacity duration-[1200ms]"
              style={{ opacity: i === photo ? 1 : 0 }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(204,255,0,0.28), transparent 45%)',
            }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2">
              <Icon size={20} weight="bold" />
              <span className="font-grotesk text-[11px] font-bold uppercase tracking-[0.3em] text-black/70">
                {active.eyebrow}
              </span>
            </div>
            <h2 className="mt-2 font-jost text-[30px] font-bold uppercase leading-[0.98] tracking-tight">
              {active.head}
            </h2>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-black/80">
              {active.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress + advance */}
        <div className="mt-auto pt-6">
          <div className="mb-4 flex items-center gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 22 : 8,
                  background: i === step ? '#000' : 'rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 bg-black py-4 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-acid"
          >
            {last ? 'Get started' : 'Next'}
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
