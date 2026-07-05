'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, LockSimple, UsersThree } from '@phosphor-icons/react'
import {
  effectiveGuideId,
  guidesForTour,
  useGuide,
  type GuideId,
} from '@/lib/tour/guides'
import { getTour, useActiveTour, type TourId } from '@/lib/tour/tours'
import { useTourProgress } from '@/lib/tour/useTourProgress'

/**
 * One list, one decision: who walks you round, and which Camden they show
 * you. The venue guides and the family Culture Cut sit side by side as
 * poster cards; picking a card sets both the tour and the voice. Switching
 * routes locks while a walk is in progress, because half-finished streets
 * are chaos.
 */

interface WalkOption {
  key: string
  tourId: TourId
  guideId: GuideId
  headline: string
  eyebrow: string
  tagline: string
  bio: string
  image: string
  comingSoon: boolean
  family: boolean
}

function buildOptions(): WalkOption[] {
  const crawl = getTour('crawl')
  const culture = getTour('culture')

  const crawlGuides = guidesForTour('crawl').map((g) => ({
    key: `crawl:${g.id}`,
    tourId: 'crawl' as TourId,
    guideId: g.id,
    headline: g.name,
    eyebrow: crawl.descriptor,
    tagline: g.tagline,
    bio: g.bio,
    image: g.image,
    comingSoon: g.status === 'coming-soon',
    family: false,
  }))

  const cultureOption: WalkOption = {
    key: 'culture:local',
    tourId: 'culture',
    guideId: 'local',
    headline: culture.name,
    eyebrow: culture.descriptor,
    tagline: 'Told by The Local. Ten stops in daylight.',
    bio: 'Record shops, boots, murals and the man who built the monsters. Rewards without the round, so bring the kids and keep the receipts.',
    image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=600&q=80',
    comingSoon: false,
    family: true,
  }

  const live = crawlGuides.filter((o) => !o.comingSoon)
  const soon = crawlGuides.filter((o) => o.comingSoon)
  return [...live, cultureOption, ...soon]
}

export default function WalkPicker() {
  const { tourId: activeTourId, tour: activeTour, setTour, hydrated: tourHydrated } = useActiveTour()
  const { guideId: chosenGuideId, setGuide, hydrated: guideHydrated } = useGuide()
  const activeProgress = useTourProgress(activeTourId)

  // Switching routes mid-walk would be chaos. You change walks before you
  // start, or after you finish, never in between. Changing voice on the
  // same route is always fine.
  const lockedIn =
    activeProgress.hydrated &&
    activeProgress.tourStarted &&
    activeProgress.bankedStops.length < activeTour.stops.length

  const hydrated = tourHydrated && guideHydrated
  const activeGuideId = effectiveGuideId(activeTourId, chosenGuideId)

  const options = buildOptions()

  return (
    <div className="mt-3 space-y-2.5">
      {options.map((option, i) => {
        const isActive =
          hydrated &&
          option.tourId === activeTourId &&
          (option.tourId === 'culture' || option.guideId === activeGuideId)
        const isLocked =
          !option.comingSoon && lockedIn && option.tourId !== activeTourId

        return (
          <WalkCard
            key={option.key}
            option={option}
            index={i}
            active={isActive}
            locked={isLocked}
            lockNote={
              isLocked
                ? `One walk at a time. Finish ${activeTour.shortName.toLowerCase()} to switch.`
                : null
            }
            onPick={() => {
              if (option.comingSoon || isLocked) return
              setGuide(option.guideId)
              if (option.tourId !== activeTourId) setTour(option.tourId)
            }}
          />
        )
      })}
    </div>
  )
}

function WalkCard({
  option,
  index,
  active,
  locked,
  lockNote,
  onPick,
}: {
  option: WalkOption
  index: number
  active: boolean
  locked: boolean
  lockNote: string | null
  onPick: () => void
}) {
  const disabled = option.comingSoon || locked

  return (
    <motion.button
      onClick={disabled ? undefined : onPick}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      aria-pressed={active}
      aria-disabled={disabled}
      aria-label={
        option.comingSoon
          ? `${option.headline}, coming soon`
          : locked
            ? `${option.headline}, locked while a walk is in progress`
            : `Walk: ${option.headline}, ${option.eyebrow}`
      }
      className={`relative flex w-full items-stretch overflow-hidden border text-left transition-colors duration-300 ${
        active
          ? 'border-acid/70 bg-night-2 shadow-[0_0_28px_rgba(204,255,0,0.12)]'
          : 'border-white/10 bg-night-2'
      } ${disabled ? 'cursor-default' : ''}`}
    >
      {/* Portrait panel — full bleed, fades into the card */}
      <div className="relative w-[104px] shrink-0 self-stretch">
        <Image
          src={option.image}
          alt={option.headline}
          fill
          sizes="104px"
          className="object-cover"
          style={{
            filter: option.comingSoon
              ? 'grayscale(100%) contrast(1.1) brightness(0.5)'
              : locked
                ? 'grayscale(60%) contrast(1.05) brightness(0.7)'
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
        {option.comingSoon && (
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

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`font-grotesk text-[9px] uppercase tracking-[0.3em] ${
              active ? 'text-acid' : 'text-label-3'
            }`}
          >
            {active
              ? 'Your walk'
              : option.comingSoon
                ? 'On the bill next'
                : option.eyebrow}
          </span>
          {option.family && (
            <span className="flex items-center gap-1 rounded-full border border-acid/40 px-2 py-0.5 font-grotesk text-[8px] font-bold uppercase tracking-[0.2em] text-acid">
              <UsersThree size={9} weight="bold" />
              Family
            </span>
          )}
        </div>

        <h3
          className={`mt-1 truncate font-jost text-[17px] font-bold uppercase leading-tight tracking-tight ${
            disabled ? 'text-label-3' : 'text-label-1'
          }`}
        >
          {option.headline}
        </h3>
        <p className="mt-0.5 truncate font-grotesk text-[10px] uppercase tracking-[0.1em] text-label-3">
          {option.tagline}
        </p>

        <p
          className={`mt-2 line-clamp-2 text-[11.5px] leading-relaxed ${
            disabled ? 'text-label-3' : 'text-label-2'
          }`}
        >
          {option.bio}
        </p>

        {lockNote && (
          <p className="mt-2 flex items-center gap-1.5 font-grotesk text-[9.5px] uppercase tracking-[0.12em] text-label-3">
            <LockSimple size={10} weight="bold" />
            {lockNote}
          </p>
        )}
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
