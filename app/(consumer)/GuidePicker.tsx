'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, LockSimple } from '@phosphor-icons/react'
import { GUIDES, useGuide, type TourGuide } from '@/lib/tour/guides'

/**
 * Guide chooser: same route, same stops, a different voice in your ears.
 * Lives in Settings; the tour screen only shows the current guide's face.
 * Live guides are tappable; the rest tease what's coming.
 */
export default function GuidePicker() {
  const { guideId, setGuide, hydrated } = useGuide()

  return (
    <div className="mt-2.5 space-y-2">
      {GUIDES.map((g) => (
        <GuideRow
          key={g.id}
          guide={g}
          active={hydrated && g.id === guideId}
          onPick={() => setGuide(g.id)}
        />
      ))}
    </div>
  )
}

function GuideRow({
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
      whileTap={comingSoon ? undefined : { scale: 0.98 }}
      aria-pressed={active}
      aria-disabled={comingSoon}
      aria-label={
        comingSoon ? `${guide.name}, coming soon` : `Tour guide: ${guide.name}`
      }
      className={`relative flex w-full items-start gap-3 overflow-hidden border p-3 text-left transition-colors ${
        active ? 'border-acid bg-night-2' : 'border-white/10 bg-night-2'
      } ${comingSoon ? 'cursor-default' : ''}`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
        <Image
          src={guide.image}
          alt={guide.name}
          fill
          sizes="56px"
          className="object-cover"
          style={{
            filter: comingSoon
              ? 'grayscale(100%) contrast(1.05) brightness(0.55)'
              : 'grayscale(15%) contrast(1.05)',
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate font-jost text-[14px] font-bold uppercase tracking-tight ${
              comingSoon ? 'text-label-3' : active ? 'text-acid' : 'text-label-1'
            }`}
          >
            {guide.name}
          </span>
          {comingSoon && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-grotesk text-[8.5px] uppercase tracking-[0.2em] text-label-3">
              <LockSimple size={8} weight="bold" />
              Soon
            </span>
          )}
        </div>
        <div className="mt-0.5 font-grotesk text-[10.5px] uppercase tracking-[0.08em] text-label-3">
          {guide.tagline}
        </div>
        <p
          className={`mt-1.5 text-[12px] leading-relaxed ${
            comingSoon ? 'text-label-3' : 'text-label-2'
          }`}
        >
          {guide.bio}
        </p>
      </div>
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-acid">
          <Check size={11} weight="bold" color="#000000" />
        </span>
      )}
      {active && (
        <span className="absolute inset-y-0 left-0 w-[2px] bg-acid" aria-hidden />
      )}
    </motion.button>
  )
}
