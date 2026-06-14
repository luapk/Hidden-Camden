'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BeerStein,
  Headphones,
  MapPin,
  Sparkle,
  type Icon,
} from '@phosphor-icons/react'

interface Step {
  n: number
  title: string
  copy: string
  icon: Icon
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Walk',
    copy: 'Follow the route from Camden Town tube. One half-mile, seven rooms, about an hour.',
    icon: MapPin,
  },
  {
    n: 2,
    title: 'Arrive',
    copy: 'Stories unlock when you reach each venue. No tapping, no QR codes. Stand still for a few seconds and the place opens up.',
    icon: Sparkle,
  },
  {
    n: 3,
    title: 'Listen',
    copy: 'Two minutes of the stuff that actually happened there. A witch, a boxer, a lie about jazz.',
    icon: Headphones,
  },
  {
    n: 4,
    title: 'Drink',
    copy: 'Each story banks a free drink. Show your phone, staff tear, you drink. Rewards keep for 7 days.',
    icon: BeerStein,
  },
]

export default function HowItWorksPage() {
  return (
    <main>
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          How it works
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          The Guide
        </h1>
        <p className="mt-2 text-[13px] text-label-2">
          Four steps between you and the best hour in Camden.
        </p>
      </header>

      <ol className="mt-8">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon
          return (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {/* Hairline connector */}
              {i < STEPS.length - 1 && (
                <span
                  className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-white/10"
                  aria-hidden
                />
              )}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-acid bg-night">
                <StepIcon size={24} weight="regular" color="#CCFF00" />
              </span>
              <div className="relative min-w-0 flex-1">
                {/* Oversized ghost numeral */}
                <span
                  className="pointer-events-none absolute -top-3 right-0 font-grotesk text-[72px] font-bold leading-none text-white/5"
                  aria-hidden
                >
                  {String(step.n).padStart(2, '0')}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-grotesk text-sm font-bold text-acid">
                    {String(step.n).padStart(2, '0')}
                  </span>
                  <h2 className="font-jost text-xl font-bold uppercase tracking-tight text-label-1">
                    {step.title}
                  </h2>
                </div>
                <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-label-2">
                  {step.copy}
                </p>
              </div>
            </motion.li>
          )
        })}
      </ol>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        className="mt-8 border border-white/10 bg-night-2 p-4"
      >
        <p className="text-[13px] leading-relaxed text-label-1">
          Wondering about location permissions, expiring codes, or what happens
          offline? The answers are short and unapologetic.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-flex items-center gap-1.5 font-grotesk text-[12px] uppercase tracking-[0.15em] text-acid"
        >
          Read the FAQ
          <ArrowRight size={14} weight="bold" />
        </Link>
      </motion.div>
    </main>
  )
}
