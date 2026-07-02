'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, LockSimple } from '@phosphor-icons/react'
import { GUIDES, useGuide, type TourGuide } from '@/lib/tour/guides'

/**
 * Horizontal guide chooser. Same route, same stops, different voice in your
 * ears. Live guides are tappable; the rest tease what's coming.
 * English mode only — the parent hides this for other languages.
 */
export default function GuidePicker() {
  const { guideId, setGuide, hydrated } = useGuide()

  return (
    <section className="mt-5" aria-label="Choose your tour guide">
      <div className="flex items-baseline justify-between">
        <h2 className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
          Your guide
        </h2>
        <span className="font-grotesk text-[9.5px] uppercase tracking-[0.2em] text-label-3">
          Same streets, different voice
        </span>
      </div>
      <div className="-mx-5 mt-2.5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GUIDES.map((g) => (
          <GuideCard
            key={g.id}
            guide={g}
            active={hydrated && g.id === guideId}
            onPick={() => setGuide(g.id)}
          />
        ))}
      </div>
    </section>
  )
}

function GuideCard({
  guide,
  active,
  onPick,
}: {
  guide: TourGuide
  active: boolean
  onPick: () => void
}) {
  const comingSoon = guide.status === 'coming-soon'

  return (
    <motion.button
      onClick={comingSoon ? undefined : onPick}
      whileTap={comingSoon ? undefined : { scale: 0.97 }}
      aria-pressed={active}
      aria-disabled={comingSoon}
      aria-label={
        comingSoon ? `${guide.name}, coming soon` : `Tour guide: ${guide.name}`
      }
      className={`relative w-[124px] shrink-0 overflow-hidden border text-left transition-colors ${
        active
          ? 'border-acid bg-night-2'
          : 'border-white/10 bg-night-2'
      } ${comingSoon ? 'cursor-default' : ''}`}
    >
      <div className="relative h-[88px] w-full">
        <Image
          src={guide.image}
          alt={guide.name}
          fill
          sizes="124px"
          className="object-cover"
          style={{
            filter: comingSoon
              ? 'grayscale(100%) contrast(1.05) brightness(0.55)'
              : 'grayscale(20%) contrast(1.05)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
        {active && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-acid">
            <Check size={11} weight="bold" color="#000000" />
          </span>
        )}
        {comingSoon && (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 font-grotesk text-[8.5px] uppercase tracking-[0.25em] text-label-2 backdrop-blur-sm">
            <LockSimple size={9} weight="bold" />
            Coming soon
          </span>
        )}
      </div>
      <div className="p-2">
        <div
          className={`truncate font-jost text-[12.5px] font-bold uppercase tracking-tight ${
            comingSoon ? 'text-label-3' : active ? 'text-acid' : 'text-label-1'
          }`}
        >
          {guide.name}
        </div>
        <div className="mt-0.5 line-clamp-2 font-grotesk text-[9.5px] leading-snug text-label-3">
          {guide.tagline}
        </div>
      </div>
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-acid" aria-hidden />
      )}
    </motion.button>
  )
}
