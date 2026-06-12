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
  accent: string
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Walk',
    copy: 'Follow the route from Camden Town tube. One half-mile, seven rooms, about an hour.',
    icon: MapPin,
    accent: '#D8432F',
  },
  {
    n: 2,
    title: 'Arrive',
    copy: 'Stories unlock when you reach each venue. No tapping, no QR codes. Stand still for a few seconds and the place opens up.',
    icon: Sparkle,
    accent: '#2563EB',
  },
  {
    n: 3,
    title: 'Listen',
    copy: 'Two minutes of the stuff that actually happened there. A witch, a boxer, a lie about jazz.',
    icon: Headphones,
    accent: '#8B5CF6',
  },
  {
    n: 4,
    title: 'Drink',
    copy: 'Each story banks a free drink. Show your phone, staff tear, you drink. Rewards keep for 7 days.',
    icon: BeerStein,
    accent: '#C9933C',
  },
]

export default function HowItWorksPage() {
  return (
    <main>
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-vividviolet">
          How it works
        </div>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink">
          The Guide
        </h1>
        <p className="mt-1.5 text-[13px] text-smoke">
          Four steps between you and the best hour in Camden.
        </p>
      </header>

      <ol className="mt-7 space-y-4">
        {STEPS.map((step) => {
          const StepIcon = step.icon
          return (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${step.accent}1A` }}
              >
                <StepIcon size={26} weight="fill" color={step.accent} />
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display text-lg"
                    style={{ color: step.accent }}
                  >
                    {String(step.n).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-xl uppercase text-ink">
                    {step.title}
                  </h2>
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink/80">
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
        className="mt-6 rounded-2xl bg-ink p-4"
      >
        <p className="text-[13px] leading-relaxed text-cream">
          Wondering about location permissions, expiring codes, or what happens
          offline? The answers are short and unapologetic.
        </p>
        <Link
          href="/help"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-brass"
        >
          Read the FAQ
          <ArrowRight size={14} weight="bold" />
        </Link>
      </motion.div>
    </main>
  )
}
