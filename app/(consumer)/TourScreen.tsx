'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BeerStein,
  CheckCircle,
  Headphones,
  LockSimple,
  Sparkle,
} from '@phosphor-icons/react'
import { haversineDistance } from '@/lib/geo'
import { useGeofence, type GeoPosition } from '@/lib/geo/useGeofence'
import { isPaywalled, useTourProgress } from '@/lib/tour/useTourProgress'
import type { TourStop } from '@/lib/tour/launchRoute'
import StoryPlayer from './StoryPlayer'

const TourMap = dynamic(() => import('./TourMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/5 font-mono text-[11px] text-smoke">
      Loading the map
    </div>
  ),
})

const TOTAL_DISTANCE_SCALE_M = 500

function formatRuntime(s: number): string {
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km away`
  return `${Math.round(m)}m away`
}

export default function TourScreen({ stops }: { stops: TourStop[] }) {
  const progress = useTourProgress()
  const {
    unlockedStops,
    bankedStops,
    paid,
    hydrated,
    unlockStop,
    bankStop,
    markPaid,
  } = progress

  const sorted = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops],
  )

  const nextStop = hydrated
    ? sorted.find((s) => !unlockedStops.includes(s.position)) ?? null
    : null

  const [override, setOverride] = useState<GeoPosition | null>(null)
  const [unlockFlash, setUnlockFlash] = useState<TourStop | null>(null)
  const [activeStory, setActiveStory] = useState<TourStop | null>(null)
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null)

  const geo = useGeofence(
    nextStop
      ? { lat: nextStop.lat, lng: nextStop.lng, radiusM: nextStop.radiusM }
      : null,
    8_000,
    override,
  )

  const arrive = useCallback(
    (stop: TourStop) => {
      if (isPaywalled(stop.position, paid)) {
        // StoryPlayer shows the paywall for gated stops.
        setActiveStory(stop)
        return
      }
      setUnlockFlash(stop)
      unlockStop(stop.position)
      window.setTimeout(() => {
        setUnlockFlash(null)
        setActiveStory(stop)
      }, 1500)
    },
    [paid, unlockStop],
  )

  // Geofence dwell completed: unlock the next stop (once per stop+paid state).
  const handledRef = useRef<string | null>(null)
  useEffect(() => {
    if (!geo.triggered || !nextStop) return
    const key = `${nextStop.position}:${paid}`
    if (handledRef.current === key) return
    handledRef.current = key
    arrive(nextStop)
  }, [geo.triggered, nextStop, paid, arrive])

  const simEnabled =
    process.env.NEXT_PUBLIC_GEO_SIM === 'true' ||
    geo.permissionState === 'denied'

  const simulateArrival = () => {
    if (!nextStop) return
    setOverride({ lat: nextStop.lat, lng: nextStop.lng, accuracy: 5 })
    arrive(nextStop)
  }

  const bankedCount = bankedStops.length

  return (
    <main>
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase leading-none tracking-tight text-ink">
            Camden <span className="text-camden">Crawl</span>
          </h1>
          <p className="mt-1 text-[13px] text-smoke">
            Seven rooms. Stories unlock when your feet arrive.
          </p>
        </div>
        <span className="rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] text-cream">
          {bankedCount} of {sorted.length} stops
        </span>
      </header>

      {/* Segmented progress bar */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {sorted.map((s) => (
          <motion.span
            key={s.position}
            className="h-1.5 flex-1 rounded-full"
            initial={false}
            animate={{
              backgroundColor: bankedStops.includes(s.position)
                ? s.accent
                : '#E7E5E4',
            }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>

      {/* Map */}
      <div className="relative mt-4 h-[45vh] min-h-[280px] overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(22,18,16,0.12)]">
        <TourMap
          stops={sorted}
          userPosition={geo.position}
          unlockedStops={unlockedStops}
          bankedStops={bankedStops}
          nextPosition={nextStop?.position ?? null}
          onSelectStop={setSelectedStop}
        />
      </div>

      {/* Distance / dwell card for the next stop */}
      <div className="mt-4">
        {nextStop ? (
          <DistanceCard
            stop={nextStop}
            distanceM={geo.distanceM}
            inside={geo.inside}
            dwellProgress={geo.dwellProgress}
            permissionState={geo.permissionState}
            onPlay={() => setActiveStory(nextStop)}
          />
        ) : hydrated ? (
          <div className="rounded-2xl border-2 border-brass/40 bg-brass/5 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
              Tour complete
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              A witch, a boxer, a lie about jazz, a pool table, a hiding place,
              and the night punk went overground. Your pin is waiting at
              Dingwalls. Wear it somewhere people will ask.
            </p>
          </div>
        ) : null}

        {simEnabled && nextStop && (
          <button
            onClick={simulateArrival}
            className="mt-2 font-mono text-[11px] text-smoke underline underline-offset-2"
          >
            Simulate arrival
          </button>
        )}
      </div>

      {/* Stop list */}
      <motion.ul
        className="mt-5 space-y-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07 } },
        }}
      >
        {sorted.map((stop) => {
          const banked = bankedStops.includes(stop.position)
          const unlocked = unlockedStops.includes(stop.position)
          const isNext = stop.position === nextStop?.position
          return (
            <StopCard
              key={stop.position}
              stop={stop}
              banked={banked}
              unlocked={unlocked}
              isNext={isNext}
              onOpen={() => {
                if (unlocked) setActiveStory(stop)
                else setSelectedStop(stop)
              }}
            />
          )
        })}
      </motion.ul>

      {/* Marker bottom sheet */}
      <AnimatePresence>
        {selectedStop && (
          <StopSheet
            stop={selectedStop}
            userPosition={geo.position}
            banked={bankedStops.includes(selectedStop.position)}
            unlocked={unlockedStops.includes(selectedStop.position)}
            isNext={selectedStop.position === nextStop?.position}
            onClose={() => setSelectedStop(null)}
            onPlay={() => {
              setSelectedStop(null)
              setActiveStory(selectedStop)
            }}
          />
        )}
      </AnimatePresence>

      {/* Unlock flash takeover */}
      <AnimatePresence>
        {unlockFlash && (
          <motion.div
            key="unlock-flash"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
            style={{ backgroundColor: unlockFlash.accent }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            >
              <Sparkle size={56} weight="fill" color="#FFFFFF" />
            </motion.div>
            <motion.div
              className="mt-4 font-mono text-[12px] uppercase tracking-[0.3em] text-white/90"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              You have arrived. Stop {unlockFlash.position}
            </motion.div>
            <motion.h2
              className="mt-2 font-display text-[40px] uppercase leading-[0.98] text-white"
              initial={{ y: 24, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 18 }}
            >
              {unlockFlash.name}
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story player / paywall overlay */}
      <AnimatePresence>
        {activeStory && (
          <StoryPlayer
            key={activeStory.position}
            stop={activeStory}
            paid={paid}
            banked={bankedStops.includes(activeStory.position)}
            onBank={bankStop}
            onMarkPaid={markPaid}
            onClose={() => setActiveStory(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

/* ------------------------------------------------------------------ */

function DistanceCard({
  stop,
  distanceM,
  inside,
  dwellProgress,
  permissionState,
  onPlay,
}: {
  stop: TourStop
  distanceM: number | null
  inside: boolean
  dwellProgress: number
  permissionState: string
  onPlay: () => void
}) {
  const fill =
    distanceM === null
      ? 0
      : Math.max(0, Math.min(1, (TOTAL_DISTANCE_SCALE_M - distanceM) / TOTAL_DISTANCE_SCALE_M))

  return (
    <div
      className="overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
      style={{ borderLeft: `5px solid ${stop.accent}` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.25em]"
            style={{ color: stop.accent }}
          >
            Next up. Stop {stop.position}
          </div>
          <div className="mt-0.5 text-[15px] font-semibold text-ink">
            {stop.name}
          </div>
        </div>
        <div className="shrink-0 font-mono text-[13px] font-bold text-ink">
          {distanceM !== null ? formatDistance(distanceM) : '...'}
        </div>
      </div>

      {inside ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 font-mono text-[12px] text-ink">
            <Sparkle size={16} weight="fill" color={stop.accent} />
            Stay put. Unlocking.
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: stop.accent }}
              initial={false}
              animate={{ width: `${Math.round(dwellProgress * 100)}%` }}
              transition={{ ease: 'linear', duration: 0.2 }}
            />
          </div>
          {dwellProgress >= 1 && (
            <motion.button
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onPlay}
              className="mt-3 w-full rounded-xl px-4 py-3 font-display text-[15px] uppercase tracking-[0.06em] text-white"
              style={{ backgroundColor: stop.accent }}
            >
              Play the story
            </motion.button>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: stop.accent }}
              initial={false}
              animate={{ width: `${Math.round(fill * 100)}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-smoke">
            {distanceM === null
              ? permissionState === 'denied'
                ? 'Location is off. Turn it on to unlock stops as you walk.'
                : 'Waiting for a GPS fix. Keep walking, it will catch up.'
              : `Inside ${stop.radiusM}m the story unlocks itself. No tapping, no QR codes.`}
          </p>
        </div>
      )}
    </div>
  )
}

function StopCard({
  stop,
  banked,
  unlocked,
  isNext,
  onOpen,
}: {
  stop: TourStop
  banked: boolean
  unlocked: boolean
  isNext: boolean
  onOpen: () => void
}) {
  const locked = !banked && !unlocked && !isNext

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
    >
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 text-left shadow-sm"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={stop.image}
            alt={stop.name}
            fill
            sizes="56px"
            className={`object-cover ${locked ? 'grayscale' : ''}`}
          />
          <span
            className="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full font-display text-[11px] text-white"
            style={{ backgroundColor: locked ? '#9CA3AF' : stop.accent }}
          >
            {stop.position}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[14px] font-semibold ${
              locked ? 'text-smoke' : 'text-ink'
            }`}
          >
            {stop.name}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-smoke">
            {formatRuntime(stop.runtimeS)} story · {stop.rewardLabel}
          </div>
        </div>
        <div className="shrink-0">
          {banked ? (
            <span className="flex items-center gap-1">
              <CheckCircle size={20} weight="fill" color={stop.accent} />
              <BeerStein size={18} weight="fill" color={stop.accent} />
            </span>
          ) : unlocked ? (
            <Headphones size={20} weight="bold" color={stop.accent} />
          ) : isNext ? (
            <ArrowRight size={20} weight="bold" color={stop.accent} />
          ) : (
            <LockSimple size={18} weight="bold" color="#9CA3AF" />
          )}
        </div>
      </button>
    </motion.li>
  )
}

function StopSheet({
  stop,
  userPosition,
  banked,
  unlocked,
  isNext,
  onClose,
  onPlay,
}: {
  stop: TourStop
  userPosition: GeoPosition | null
  banked: boolean
  unlocked: boolean
  isNext: boolean
  onClose: () => void
  onPlay: () => void
}) {
  const distance = userPosition
    ? haversineDistance(userPosition.lat, userPosition.lng, stop.lat, stop.lng)
    : null

  const stateLabel = banked
    ? 'Done'
    : unlocked
      ? 'Unlocked'
      : isNext
        ? 'Next up'
        : 'Locked'

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md overflow-hidden rounded-t-3xl bg-white"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        role="dialog"
        aria-label={stop.name}
      >
        <div className="relative h-36 w-full">
          <Image
            src={stop.image}
            alt={stop.name}
            fill
            sizes="448px"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 30%, ${stop.accent}CC)`,
            }}
          />
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 font-mono text-[11px] font-bold text-ink">
            Stop {stop.position}
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-ink/80 px-3 py-1 font-mono text-[11px] text-cream">
            {stateLabel}
          </span>
        </div>
        <div className="p-5 pb-8">
          <h3 className="font-display text-2xl uppercase leading-tight text-ink">
            {stop.name}
          </h3>
          <p className="mt-0.5 text-[13px] text-smoke">{stop.subtitle}</p>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-ink">
            <BeerStein size={18} weight="fill" color={stop.accent} />
            <span className="font-medium">{stop.rewardLabel}</span>
            <span className="font-mono text-[11px] text-smoke">
              {stop.rewardWindow}
            </span>
          </div>
          {distance !== null && (
            <div className="mt-2 font-mono text-[12px] text-smoke">
              {formatDistance(distance)}
            </div>
          )}
          {unlocked ? (
            <button
              onClick={onPlay}
              className="mt-4 w-full rounded-xl px-4 py-3 font-display text-[15px] uppercase tracking-[0.06em] text-white"
              style={{ backgroundColor: stop.accent }}
            >
              {banked ? 'Replay the story' : 'Play the story'}
            </button>
          ) : (
            <p className="mt-4 rounded-xl bg-ink/5 px-4 py-3 font-mono text-[11px] text-smoke">
              {isNext
                ? 'Walk to the venue and the story unlocks itself.'
                : 'Locked until you arrive. The route knows the way.'}
            </p>
          )}
        </div>
      </motion.div>
    </>
  )
}
