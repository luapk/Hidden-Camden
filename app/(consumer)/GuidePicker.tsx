'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, LockSimple } from '@phosphor-icons/react'
import { GUIDES, useGuide, type TourGuide } from '@/lib/tour/guides'

/**
 * Guide chooser: same route, same stops, a different voice in your ears.
 * Lives in Settings; the tour screen only shows the current guide's face.
 * Poster-style cards: full-bleed portrait panel, name set like a bill
 * headline, bio underneath. Live guides are tappable; the rest tease.
 */
export default function GuidePicker() {
  const { guideId, setGuide, hydrated } = useGuide()

  return (
    <div className="mt-3 space-y-2.5">
      {GUIDES.map((g, i) => (
        <GuideCard
          key={g.id}
          guide={g}
          index={i}
          active={hydrated && g.id === guideId}
          onPick={() => setGuide(g.id)}
        />
      ))}
    </div>
  )
}

function GuideCard({
  guide,
  index,
  active,
  onPick,
}: {
  guide: TourGuide
  index: number
  active: boolean
  onPick: () => void
}) {
  const comingSoon = guide.status === 'coming-soon'

  return (
    <motion.button
      onClick={comingSoon ? undefined : onPick}
      whileTap={comingSoon ? undefined : { scale: 0.985 }}
      aria-pressed={active}
      aria-disabled={comingSoon}
      aria-label={
        comingSoon ? `${guide.name}, coming soon` : `Tour guide: ${guide.name}`
      }
      className={`relative flex w-full items-stretch overflow-hidden border text-left transition-colors duration-300 ${
        active
          ? 'border-acid/70 bg-night-2 shadow-[0_0_28px_rgba(204,255,0,0.12)]'
          : 'border-white/10 bg-night-2'
      } ${comingSoon ? 'cursor-default' : ''}`}
    >
      {/* Portrait panel — full bleed, fades into the card */}
      <div className="relative w-[104px] shrink-0 self-stretch">
        <Image
          src={guide.image}
          alt={guide.name}
          fill
          sizes="104px"
          className="object-cover"
          style={{
            filter: comingSoon
              ? 'grayscale(100%) contrast(1.1) brightness(0.5)'
              : 'grayscale(20%) contrast(1.08)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, transparent 40%, rgba(17,17,19,0.55) 78%, #111113 100%)',
          }}
        />
        {comingSoon && (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1 font-grotesk text-[8px] uppercase tracking-[0.3em] text-label-2 backdrop-blur-sm">
            <LockSimple size={8} weight="bold" />
            Soon
          </span>
        )}
      </div>

      {/* Bill copy */}
      <div className="relative min-w-0 flex-1 py-3.5 pl-3.5 pr-4">
        {/* Oversized index, stop-row style */}
        <span
          className="pointer-events-none absolute -top-1 right-2 font-grotesk text-[52px] font-bold leading-none text-white/[0.05]"
          aria-hidden
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex items-center gap-2">
          <span
            className={`font-grotesk text-[9px] uppercase tracking-[0.3em] ${
              active ? 'text-acid' : 'text-label-3'
            }`}
          >
            {active ? 'Now guiding' : comingSoon ? 'On the bill next' : 'Available'}
          </span>
        </div>

        <h3
          className={`mt-1 truncate font-jost text-[17px] font-bold uppercase leading-tight tracking-tight ${
            comingSoon ? 'text-label-3' : 'text-label-1'
          }`}
        >
          {guide.name}
        </h3>
        <p className="mt-0.5 truncate font-grotesk text-[10px] uppercase tracking-[0.1em] text-label-3">
          {guide.tagline}
        </p>

        <p
          className={`mt-2 line-clamp-2 text-[11.5px] leading-relaxed ${
            comingSoon ? 'text-label-3' : 'text-label-2'
          }`}
        >
          {guide.bio}
        </p>
      </div>

      {/* Active furniture: acid spine + tick */}
      {active && (
        <>
          <span className="absolute inset-y-0 left-0 z-10 w-[3px] bg-acid shadow-[0_0_12px_rgba(204,255,0,0.6)]" aria-hidden />
          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-acid shadow-[0_0_14px_rgba(204,255,0,0.45)]">
            <Check size={11} weight="bold" color="#000000" />
          </span>
        </>
      )}
    </motion.button>
  )
}
