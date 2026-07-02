'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BeerStein,
  Check,
  FlagCheckered,
  Headphones,
  InstagramLogo,
  LockSimple,
  MapPin,
  NavigationArrow,
  Pause,
  Play,
} from '@phosphor-icons/react'
import { haversineDistance } from '@/lib/geo'
import { useGeofence, type GeoPosition } from '@/lib/geo/useGeofence'
import { isPaywalled, useTourProgress } from '@/lib/tour/useTourProgress'
import {
  INTRO_AUDIO_URL,
  START_POINT,
  directionsHref,
  type TourStop,
} from '@/lib/tour/launchRoute'
import Link from 'next/link'
import { localizeAudioUrl, useLanguage } from '@/lib/tour/language'
import { resolveAudioUrl, useGuide } from '@/lib/tour/guides'
import { arrivalSting, playSting } from '@/lib/tour/stings'
import BrandLogo from './BrandLogo'
import StoryPlayer from './StoryPlayer'

const TourMap = dynamic(() => import('./TourMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-night-1 font-grotesk text-[11px] uppercase tracking-[0.2em] text-label-3">
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

function distanceFigure(m: number): { value: string; unit: string } {
  if (m >= 1000) return { value: (m / 1000).toFixed(1), unit: 'KM' }
  return { value: String(Math.round(m)), unit: 'M' }
}

export default function TourScreen({ stops }: { stops: TourStop[] }) {
  const progress = useTourProgress()
  const {
    unlockedStops,
    bankedStops,
    paid,
    hydrated,
    tourStarted,
    unlockStop,
    bankStop,
    markPaid,
    startTour,
    reset,
  } = progress

  const { lang } = useLanguage()
  const { guideId, guide } = useGuide()

  const sorted = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops],
  )

  const nextStop = hydrated && tourStarted
    ? sorted.find((s) => !unlockedStops.includes(s.position)) ?? null
    : null

  const [override, setOverride] = useState<GeoPosition | null>(null)
  const [unlockFlash, setUnlockFlash] = useState<TourStop | null>(null)
  const [activeStory, setActiveStory] = useState<TourStop | null>(null)
  const [autoPlayStory, setAutoPlayStory] = useState(false)
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null)
  const [miniAudio, setMiniAudio] = useState<{
    url: string
    fallbackUrl: string | null
    label: string
  } | null>(null)
  // Link audio is armed when a story closes, then plays once the walker
  // actually leaves that venue heading for the next stop (see effect below).
  const [pendingLink, setPendingLink] = useState<{
    from: TourStop
    url: string
    fallbackUrl: string | null
    label: string
  } | null>(null)
  // When geofence triggers but confidence is low (nearby stops within GPS error
  // margin), we hold and show a manual confirm instead of auto-firing.
  const [pendingUnlock, setPendingUnlock] = useState<TourStop | null>(null)
  // TEMP: testing affordance, two-tap tour reset. Remove before launch.
  const [confirmReset, setConfirmReset] = useState(false)

  const resetTour = () => {
    reset()
    setOverride(null)
    setMiniAudio(null)
    setPendingLink(null)
    setPendingUnlock(null)
    setActiveStory(null)
    setUnlockFlash(null)
    setSelectedStop(null)
    setAutoPlayStory(false)
    handledRef.current = null
    setConfirmReset(false)
  }

  // When a story closes, arm the link audio for the walk to the next stop.
  const prevStoryRef = useRef<TourStop | null>(null)
  useEffect(() => {
    if (activeStory) {
      prevStoryRef.current = activeStory
    } else if (prevStoryRef.current) {
      const closed = prevStoryRef.current
      prevStoryRef.current = null
      const nextInRoute = sorted.find((s) => s.position === closed.position + 1)
      const linkUrl = resolveAudioUrl(closed.linkAudioUrl, lang, guideId)
      if (linkUrl && nextInRoute) {
        setPendingLink({
          from: closed,
          url: linkUrl,
          // Guide files not recorded yet fall back to the house narration.
          fallbackUrl: localizeAudioUrl(closed.linkAudioUrl, lang),
          label: `Walk to ${nextInRoute.name}`,
        })
      }
    }
  }, [activeStory, sorted, lang, guideId])

  // Arrival sting: the stop's own guitar riff, served from /sounds/ by stop
  // number. Independent of the DB and of the narration audioUrl, so it works
  // in sim and live.
  const playReward = useCallback((position: number) => {
    playSting(arrivalSting(position))
  }, [])

  const geo = useGeofence(
    nextStop
      ? {
          lat: nextStop.fenceLat ?? nextStop.lat,
          lng: nextStop.fenceLng ?? nextStop.lng,
          radiusM: nextStop.radiusM,
        }
      : null,
    8_000,
    override,
  )

  // Distance to start point (Camden Town tube) — used to gate the tour start.
  const distanceToTube = geo.position
    ? haversineDistance(
        geo.position.lat,
        geo.position.lng,
        START_POINT.lat,
        START_POINT.lng,
      )
    : null
  const nearTube =
    distanceToTube !== null &&
    distanceToTube <= START_POINT.radiusM &&
    !geo.lowAccuracy

  // Confidence check: when the geofence triggers, make sure the GPS isn't
  // ambiguously close to a different stop. If the second-nearest stop is
  // within the accuracy radius, hold and ask for manual confirm rather than
  // auto-firing the wrong venue.
  const isConfidentUnlock = useCallback(
    (stop: TourStop): boolean => {
      if (!geo.position) return true
      const accuracy = geo.position.accuracy
      const others = sorted.filter((s) => s.position !== stop.position)
      const distToStop = haversineDistance(
        geo.position.lat,
        geo.position.lng,
        stop.fenceLat ?? stop.lat,
        stop.fenceLng ?? stop.lng,
      )
      const tooClose = others.some((s) => {
        const d = haversineDistance(
          geo.position!.lat,
          geo.position!.lng,
          s.fenceLat ?? s.lat,
          s.fenceLng ?? s.lng,
        )
        // Another stop is within our GPS accuracy bubble of the target stop
        return d - distToStop < accuracy
      })
      return !tooClose
    },
    [geo.position, sorted],
  )

  const [searchSim, setSearchSim] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Keyed, not bare: a guessable ?sim would let anyone walk the tour
      // (and skip the paywall) from their sofa.
      setSearchSim(
        new URLSearchParams(window.location.search).get('sim') === 'backstage',
      )
    }
  }, [])

  // Sim mode is a demo affordance: the keyed ?sim=backstage param or the
  // env flag. Never auto-enabled by a denied location permission — that
  // would hand a free walkthrough (and paywall bypass) to anyone who taps
  // "Don't allow".
  const simEnabled =
    searchSim || process.env.NEXT_PUBLIC_GEO_SIM === 'true'

  const arrive = useCallback(
    (stop: TourStop) => {
      setMiniAudio(null)
      setPendingLink(null)
      setPendingUnlock(null)
      // Sim mode is for testing: walk through every stop, no paywall.
      if (isPaywalled(stop.position, paid) && !simEnabled) {
        setActiveStory(stop)
        return
      }
      setUnlockFlash(stop)
      playReward(stop.position)
      unlockStop(stop.position)
      window.setTimeout(() => {
        setUnlockFlash(null)
        setAutoPlayStory(true)
        setActiveStory(stop)
      }, 1500)
    },
    [paid, unlockStop, playReward, simEnabled],
  )

  // Geofence dwell completed: auto-unlock if confident, else ask for confirm.
  const handledRef = useRef<string | null>(null)
  useEffect(() => {
    if (!geo.triggered || !nextStop) return
    const key = `${nextStop.position}:${paid}`
    if (handledRef.current === key) return
    handledRef.current = key
    if (isConfidentUnlock(nextStop)) {
      arrive(nextStop)
    } else {
      setPendingUnlock(nextStop)
    }
  }, [geo.triggered, nextStop, paid, arrive, isConfidentUnlock])

  const simulateArrival = () => {
    if (!nextStop) return
    if (!tourStarted) {
      startTour()
      return
    }
    setOverride({ lat: nextStop.lat, lng: nextStop.lng, accuracy: 5 })
    bankStop(nextStop.position)
    arrive(nextStop)
  }

  // Play the armed link audio only once the walker has left the venue they
  // just heard about, i.e. they are genuinely walking to the next stop. In
  // sim mode (or with no GPS fix) there is no walk to detect, so play it now.
  useEffect(() => {
    if (!pendingLink) return
    if (simEnabled || !geo.position) {
      setMiniAudio({
        url: pendingLink.url,
        fallbackUrl: pendingLink.fallbackUrl,
        label: pendingLink.label,
      })
      setPendingLink(null)
      return
    }
    const distFromHeard = haversineDistance(
      geo.position.lat,
      geo.position.lng,
      pendingLink.from.lat,
      pendingLink.from.lng,
    )
    // A clear step beyond the fence: they are on the move to the next room.
    if (distFromHeard > pendingLink.from.radiusM + 15) {
      setMiniAudio({
        url: pendingLink.url,
        fallbackUrl: pendingLink.fallbackUrl,
        label: pendingLink.label,
      })
      setPendingLink(null)
    }
  }, [pendingLink, geo.position, simEnabled])

  const bankedCount = bankedStops.length

  return (
    <main>
      {/* Header */}
      <header>
        <div className="flex items-center justify-between">
          <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
            Walking tour · NW1
          </div>
          {/* Current guide indicator — pick happens in Settings */}
          {lang === 'en' && (
            <Link
              href="/settings#guide"
              aria-label={`Your guide: ${guide.name}. Change in settings.`}
              className="flex shrink-0 items-center gap-2"
            >
              <span className="text-right">
                <span className="block font-grotesk text-[8px] uppercase tracking-[0.25em] text-label-3">
                  Guide
                </span>
                <span className="block max-w-[110px] truncate font-jost text-[11px] font-bold uppercase tracking-tight text-label-1">
                  {guide.name}
                </span>
              </span>
              <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-acid/70 shadow-[0_0_16px_rgba(204,255,0,0.2)]">
                <Image
                  src={guide.image}
                  alt={guide.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                  style={{ filter: 'grayscale(15%) contrast(1.05)' }}
                />
              </span>
            </Link>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="m-0">
            <BrandLogo className="h-auto w-[188px]" priority />
          </h1>
          <div
            className="shrink-0 font-grotesk text-3xl font-bold leading-none tracking-tight"
            aria-label={`${bankedCount} of ${sorted.length} stops`}
          >
            <span className="text-acid">
              {String(bankedCount).padStart(2, '0')}
            </span>
            <span className="text-label-3">
              /{String(sorted.length).padStart(2, '0')}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-label-2">
          Seven rooms. Stories unlock when your feet arrive.
        </p>
        {/* Bauhaus ornament */}
        <div className="mt-3 flex items-center gap-2" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-acid" />
          <span className="h-2 w-2 bg-label-1" />
          <span
            className="h-0 w-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '9px solid #5A5A5F',
            }}
          />
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </header>

      {/* Segmented progress bar */}
      <div className="mt-3 flex gap-1" aria-hidden>
        {sorted.map((s) => (
          <motion.span
            key={s.position}
            className="h-[3px] flex-1"
            initial={false}
            animate={{
              backgroundColor: bankedStops.includes(s.position)
                ? '#CCFF00'
                : 'rgba(255,255,255,0.1)',
            }}
            transition={{ duration: 0.7 }}
          />
        ))}
      </div>


      {/* Map */}
      <div className="relative mt-4 h-[50vh] min-h-[280px] overflow-hidden rounded-2xl border border-white/10">
        <TourMap
          stops={sorted}
          userPosition={geo.position}
          unlockedStops={unlockedStops}
          bankedStops={bankedStops}
          nextPosition={nextStop?.position ?? null}
          onSelectStop={setSelectedStop}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-grotesk text-[11px] uppercase tracking-[0.2em] text-label-1 backdrop-blur-xl">
          <span className="text-acid">{bankedCount}</span> of {sorted.length}
        </div>
      </div>

      {/* Link audio — auto-plays once the walker leaves a venue */}
      {miniAudio && (
        <MiniPlayer
          key={miniAudio.url}
          url={miniAudio.url}
          fallbackUrl={miniAudio.fallbackUrl}
          label={miniAudio.label}
          onDismiss={() => setMiniAudio(null)}
        />
      )}

      {/* ── Pre-start gate ── */}
      {hydrated && !tourStarted && (
        <StartGate
          nearTube={nearTube || simEnabled}
          distanceToTube={distanceToTube}
          permissionState={geo.permissionState}
          onStart={() => {
            startTour()
            // The intro rides the persistent mini player so it survives this
            // card unmounting and keeps its controls on screen. Arrival at
            // stop 1 clears it, so it can never talk over the first story.
            setMiniAudio({
              url: resolveAudioUrl(INTRO_AUDIO_URL, lang, guideId) ?? INTRO_AUDIO_URL,
              fallbackUrl: localizeAudioUrl(INTRO_AUDIO_URL, lang) ?? INTRO_AUDIO_URL,
              label: 'Introduction',
            })
          }}
        />
      )}

      {/* ── Tour in progress ── */}
      {hydrated && tourStarted && (
        <>
          {/* Pending-unlock confirm — shown when GPS can't confidently
              distinguish which stop the user is at */}
          <AnimatePresence>
            {pendingUnlock && (
              <motion.div
                key="pending-unlock"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-4 border border-acid/40 bg-night-2 p-4"
              >
                <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-acid">
                  Are you at stop {pendingUnlock.position}?
                </div>
                <p className="mt-1 text-[13px] text-label-1">
                  {pendingUnlock.name}
                </p>
                <p className="mt-1 font-grotesk text-[11px] text-label-3">
                  GPS signal is ambiguous here. Confirm if you are standing outside.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => arrive(pendingUnlock)}
                    className="flex-1 bg-acid py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-black"
                  >
                    Yes, unlock it
                  </button>
                  <button
                    onClick={() => setPendingUnlock(null)}
                    className="px-4 py-3 border border-white/10 font-grotesk text-[11px] text-label-2"
                  >
                    Not yet
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Distance / dwell card for the next stop */}
          <div className="mt-4">
            {nextStop ? (
              <DistanceCard
                stop={nextStop}
                distanceM={geo.distanceM}
                inside={geo.inside}
                dwellProgress={geo.dwellProgress}
                permissionState={geo.permissionState}
                lowAccuracy={geo.lowAccuracy}
                onPlay={() => setActiveStory(nextStop)}
                onConfirmHere={() => setPendingUnlock(nextStop)}
              />
            ) : (
              <div className="border border-white/10 bg-night-2 p-4">
                <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-acid">
                  Tour complete
                </div>
                <p className="mt-2 text-sm leading-relaxed text-label-1">
                  A witch, a boxer, a lie about jazz, a pool table, a hiding place,
                  and the night punk went overground. Your pin is waiting at
                  Dingwalls. Wear it somewhere people will ask.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {simEnabled && (
        <div className="mt-3 border border-dashed border-acid/30 bg-night-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-acid/60">
              Sim mode
            </span>
            {!tourStarted ? (
              <button
                onClick={simulateArrival}
                className="bg-acid px-4 py-2 font-grotesk text-[11px] font-bold uppercase tracking-[0.2em] text-black"
              >
                Start tour →
              </button>
            ) : nextStop ? (
              <button
                onClick={simulateArrival}
                className="bg-acid px-4 py-2 font-grotesk text-[11px] font-bold uppercase tracking-[0.2em] text-black"
              >
                Arrive at stop {nextStop.position} →
              </button>
            ) : (
              <span className="font-grotesk text-[11px] text-label-2">All stops done</span>
            )}
          </div>
          {geo.position && (
            <p className="mt-2 font-mono text-[9.5px] text-label-3">
              {geo.position.lat.toFixed(6)}, {geo.position.lng.toFixed(6)} ±{Math.round(geo.position.accuracy)}m
              {geo.distanceM !== null && ` · ${Math.round(geo.distanceM)}m from pin`}
              {geo.lowAccuracy && ' · LOW ACC'}
              {distanceToTube !== null && ` · ${Math.round(distanceToTube)}m from tube`}
            </p>
          )}
        </div>
      )}

      {/* Stop list */}
      <motion.ul
        className="mt-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {sorted.map((stop) => {
          const banked = bankedStops.includes(stop.position)
          const unlocked = unlockedStops.includes(stop.position)
          const isNext = stop.position === nextStop?.position
          return (
            <StopRow
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

      {/* TEMP: testing-only tour reset. Remove before launch. */}
      {hydrated && (tourStarted || unlockedStops.length > 0) && (
        <div className="mt-10 border-t border-white/10 pt-4">
          {confirmReset ? (
            <div className="border border-camden/50 bg-night-2 p-4">
              <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-camden">
                Reset the tour
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-label-1">
                Your progress will be lost. Unlocked stories and banked rewards
                go with it, and the tour starts again from the tube.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={resetTour}
                  className="flex-1 bg-camden py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-cream"
                >
                  Reset everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="border border-white/10 px-4 py-3 font-grotesk text-[11px] text-label-2"
                >
                  Keep my progress
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full border border-white/10 py-2.5 font-grotesk text-[10px] uppercase tracking-[0.25em] text-label-3"
            >
              Reset tour · testing
            </button>
          )}
        </div>
      )}

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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-acid px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="font-grotesk text-[120px] font-bold leading-none text-black"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}
            >
              {String(unlockFlash.position).padStart(2, '0')}
            </motion.div>
            <motion.div
              className="mt-4 font-grotesk text-[12px] uppercase tracking-[0.35em] text-black/70"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              You have arrived. Stop {unlockFlash.position}
            </motion.div>
            <motion.h2
              className="mt-2 font-jost text-[38px] font-bold uppercase leading-[0.98] tracking-tight text-black"
              initial={{ y: 24, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 20 }}
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
            onClose={() => {
              setActiveStory(null)
              setAutoPlayStory(false)
            }}
            bypassPaywall={simEnabled}
            autoPlay={autoPlayStory}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

/* ------------------------------------------------------------------ */

function StartGate({
  nearTube,
  distanceToTube,
  permissionState,
  onStart,
}: {
  nearTube: boolean
  distanceToTube: number | null
  permissionState: string
  onStart: () => void
}) {
  // One live status line, so the user always knows what the app is waiting
  // for. The button itself never waits: the gate guides, it does not block.
  const statusLine = nearTube
    ? "That's the spot. Headphones in."
    : distanceToTube !== null
      ? `${Math.round(distanceToTube)}m away. It's the entrance on Camden High Street.`
      : permissionState === 'denied'
        ? 'Location is off, so the app cannot see you arrive. Turn it on for the full experience.'
        : 'Getting a GPS fix. Head for the tube in the meantime.'

  const steps: { label: string; done: boolean }[] = [
    { label: 'Meet at Camden Town tube', done: nearTube },
    { label: 'Tap start. The intro plays in your ears', done: false },
    { label: 'Walk. Stories unlock when your feet arrive', done: false },
  ]

  return (
    <motion.div
      className="mt-4 border border-white/10 bg-night-2 p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      <div className="flex items-center gap-2 font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
        <FlagCheckered size={13} weight="fill" color="#CCFF00" />
        Starting point
      </div>

      <p className="mt-2 text-[15px] font-semibold text-label-1">
        {nearTube
          ? 'You are at Camden Town tube.'
          : 'The tour starts at Camden Town tube.'}
      </p>
      <p className="mt-1 font-grotesk text-[11px] leading-relaxed text-label-2">
        {statusLine}
      </p>

      {/* How it works, in three lines. Step one ticks itself off live. */}
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-2.5">
            {step.done ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-acid">
                <Check size={11} weight="bold" color="#000000" />
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 font-grotesk text-[10px] font-bold text-label-3">
                {i + 1}
              </span>
            )}
            <span
              className={`font-grotesk text-[12px] ${
                step.done ? 'text-label-1' : 'text-label-2'
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {!nearTube && (
        <a
          href={directionsHref(START_POINT.name, 'Camden High Street, London NW1 0JH')}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-between border border-white/10 bg-night-3/60 px-3 py-2.5"
        >
          <span className="flex items-center gap-2">
            <MapPin size={14} weight="fill" color="#CCFF00" />
            <span className="font-grotesk text-[11.5px] text-label-1">
              Camden Town tube, NW1 0JH
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-grotesk text-[10px] uppercase tracking-[0.15em] text-acid">
            <NavigationArrow size={12} weight="bold" />
            Directions
          </span>
        </a>
      )}

      <GuideNudge />

      <button
        onClick={onStart}
        className="mt-4 w-full bg-acid px-5 py-4 font-jost text-lg font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
      >
        Start the tour
      </button>
      {!nearTube && (
        <p className="mt-2 font-grotesk text-[10.5px] leading-relaxed text-label-3">
          Not there yet? Start anyway. The intro plays now and the map walks you to stop 1.
        </p>
      )}
    </motion.div>
  )
}

/**
 * The moment before the walk begins is the one time the user is standing
 * still with headphones going in — the best moment to choose whose voice
 * they walk with. Shows the current guide and points at Settings to swap.
 */
function GuideNudge() {
  const { lang } = useLanguage()
  const { guide } = useGuide()

  if (lang !== 'en') return null

  return (
    <Link
      href="/settings#guide"
      className="mt-3 flex items-center gap-3 border border-white/10 bg-night-3/60 p-2.5"
    >
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-acid/60">
        <Image
          src={guide.image}
          alt={guide.name}
          fill
          sizes="40px"
          className="object-cover"
          style={{ filter: 'grayscale(15%) contrast(1.05)' }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-grotesk text-[9px] uppercase tracking-[0.25em] text-label-3">
          Walking with
        </span>
        <span className="mt-0.5 block truncate font-jost text-[13.5px] font-bold uppercase tracking-tight text-label-1">
          {guide.name}
        </span>
      </span>
      <span className="shrink-0 font-grotesk text-[10px] uppercase tracking-[0.15em] text-acid">
        Change →
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------------ */

function miniClock(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function MiniPlayer({
  url,
  fallbackUrl,
  label,
  onDismiss,
}: {
  url: string
  fallbackUrl: string | null
  label: string
  onDismiss: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  // Guide link audio not recorded yet → swap in the house narration.
  const [src, setSrc] = useState(url)

  useEffect(() => {
    audioRef.current?.play().catch(() => {})
  }, [src])

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) el.pause()
    else el.play().catch(() => {})
  }

  return (
    <div className="mt-4 border border-white/10 bg-night-2">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onError={() => {
          if (fallbackUrl && src !== fallbackUrl) setSrc(fallbackUrl)
          else onDismiss()
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onDismiss}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration)
          }
        }}
      />
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-acid text-black"
        >
          {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-grotesk text-[11px] uppercase tracking-[0.2em] text-label-2">
            {label}
          </div>
          <div className="relative mt-1.5 h-[2px] bg-white/10">
            <div
              className="h-full bg-acid"
              style={{ width: duration > 0 ? `${(elapsed / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-label-3">
          {miniClock(elapsed)}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DistanceCard({
  stop,
  distanceM,
  inside,
  dwellProgress,
  permissionState,
  lowAccuracy,
  onPlay,
  onConfirmHere,
}: {
  stop: TourStop
  distanceM: number | null
  inside: boolean
  dwellProgress: number
  permissionState: string
  lowAccuracy: boolean
  onPlay: () => void
  onConfirmHere: () => void
}) {
  // GPS rescue: only offered when the best available fix already puts the
  // user at the venue's doorstep (fence + 60m of drift allowance). Distant
  // users never see it, so the tour cannot be completed from a sofa.
  const canConfirmHere =
    !inside && distanceM !== null && distanceM <= stop.radiusM + 60
  const fill =
    distanceM === null
      ? 0
      : Math.max(0, Math.min(1, (TOTAL_DISTANCE_SCALE_M - distanceM) / TOTAL_DISTANCE_SCALE_M))

  const figure = distanceM !== null ? distanceFigure(distanceM) : null

  return (
    <div className="relative overflow-hidden border border-white/10 bg-night-2 p-4">
      {/* Thin per-stop identity rule */}
      <span
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{ backgroundColor: stop.accent }}
        aria-hidden
      />
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
            Next up. Stop{' '}
            <span style={{ color: stop.accent }}>{stop.position}</span>
          </div>
          <div className="mt-1 truncate font-jost text-[17px] font-bold uppercase tracking-tight text-label-1">
            {stop.name}
          </div>
          {stop.address && (
            <a
              href={directionsHref(stop.name, stop.address)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-grotesk text-[11px] text-label-2"
            >
              <NavigationArrow size={11} weight="bold" color="#CCFF00" />
              <span className="truncate">{stop.address}</span>
            </a>
          )}
        </div>
        <div className="shrink-0 text-right">
          {figure ? (
            <div className="font-grotesk leading-none">
              <span className="text-3xl font-bold text-acid">
                {figure.value}
              </span>
              <span className="ml-1 text-sm font-medium text-acid/70">
                {figure.unit}
              </span>
            </div>
          ) : (
            <span className="font-grotesk text-xl text-label-3">...</span>
          )}
        </div>
      </div>

      {inside ? (
        <div className="mt-4">
          <div className="flex items-center justify-between font-grotesk text-[11px] uppercase tracking-[0.25em]">
            <span className="text-acid">Stay put. Unlocking.</span>
            <span className="text-label-2">
              {Math.round(dwellProgress * 100)}%
            </span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-white/10">
            <motion.div
              className="h-full bg-acid shadow-[0_0_24px_rgba(204,255,0,0.25)]"
              initial={false}
              animate={{ width: `${Math.round(dwellProgress * 100)}%` }}
              transition={{ ease: 'linear', duration: 0.2 }}
            />
          </div>
          {dwellProgress >= 1 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              onClick={onPlay}
              className="mt-4 w-full bg-acid px-4 py-3.5 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
            >
              Play the story
            </motion.button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-[2px] w-full bg-white/10">
            <motion.div
              className="h-full bg-acid"
              initial={false}
              animate={{ width: `${Math.round(fill * 100)}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 22 }}
            />
          </div>
          <p className="mt-2.5 font-grotesk text-[11px] leading-relaxed text-label-2">
            {distanceM === null
              ? permissionState === 'denied'
                ? 'Location is off. Turn it on to unlock stops as you walk.'
                : 'Waiting for a GPS fix. Keep walking, it will catch up.'
              : lowAccuracy
                ? 'Improving the GPS lock. Step into the open and it will sharpen.'
                : `Inside ${stop.radiusM}m the story unlocks itself. No tapping, no QR codes.`}
          </p>
          {canConfirmHere && (
            <button
              onClick={onConfirmHere}
              className="mt-3 w-full border border-acid/40 py-2.5 font-grotesk text-[11px] uppercase tracking-[0.2em] text-acid"
            >
              At the door and nothing happening? Tap here
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function StopRow({
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
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      className="border-b border-white/10 first:border-t"
    >
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-4 py-4 text-left"
      >
        <span
          className={`w-14 shrink-0 font-grotesk text-[44px] font-bold leading-none ${
            isNext ? 'text-acid/40' : 'text-white/10'
          }`}
          aria-hidden
        >
          {String(stop.position).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate font-jost text-[15px] font-bold uppercase tracking-tight ${
              locked ? 'text-label-3' : 'text-label-1'
            }`}
          >
            {stop.name}
          </div>
          <div className="mt-0.5 truncate font-grotesk text-[11px] text-label-2">
            {formatRuntime(stop.runtimeS)} story ·{' '}
            <span style={locked ? undefined : { color: stop.accent }}>
              {stop.rewardLabel}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {banked ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-acid">
              <Check size={14} weight="bold" color="#000000" />
            </span>
          ) : unlocked ? (
            <Headphones size={20} weight="bold" color="#CCFF00" />
          ) : isNext ? (
            <ArrowRight size={20} weight="bold" color="#CCFF00" />
          ) : (
            <LockSimple size={16} weight="bold" color="rgba(255,255,255,0.3)" />
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
        className="fixed inset-0 z-40 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md overflow-hidden rounded-t-2xl border-t border-white/10 bg-night-1"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
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
            style={{ filter: 'grayscale(30%) contrast(1.05)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
          {/* Glass header chips over the venue image */}
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-grotesk text-[11px] font-bold uppercase tracking-[0.15em] text-label-1 backdrop-blur-xl">
            Stop <span className="text-acid">{stop.position}</span>
          </span>
          <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-grotesk text-[11px] uppercase tracking-[0.15em] text-label-2 backdrop-blur-xl">
            {stateLabel}
          </span>
        </div>
        <div className="p-5 pb-8">
          <h3 className="font-jost text-2xl font-bold uppercase leading-tight tracking-tight text-label-1">
            {stop.name}
          </h3>
          <p className="mt-0.5 text-[13px] text-label-2">{stop.subtitle}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[13px] text-label-1">
            <BeerStein size={18} weight="fill" color="#CCFF00" />
            <span className="font-medium">{stop.rewardLabel}</span>
            <span className="font-grotesk text-[11px] text-label-2">
              {stop.rewardWindow}
            </span>
          </div>
          {distance !== null && (
            <div className="mt-2 font-grotesk text-[12px] text-label-2">
              {formatDistance(distance)}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {stop.address && (
              <a
                href={directionsHref(stop.name, stop.address)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-between gap-3 border border-white/10 bg-night-3/60 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block font-grotesk text-[9px] uppercase tracking-[0.25em] text-label-3">
                    Address
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-label-1">
                    {stop.address}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-grotesk text-[10px] uppercase tracking-[0.15em] text-acid">
                  <NavigationArrow size={13} weight="bold" />
                  Directions
                </span>
              </a>
            )}
            {stop.instagram && (
              <a
                href={`https://instagram.com/${stop.instagram}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`@${stop.instagram} on Instagram`}
                className="flex items-center justify-center border border-white/10 bg-night-3/60 px-3.5"
              >
                <InstagramLogo size={20} weight="regular" color="#CCFF00" />
              </a>
            )}
          </div>
          {unlocked ? (
            <button
              onClick={onPlay}
              className="mt-5 w-full bg-acid px-4 py-3.5 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
            >
              {banked ? 'Replay the story' : 'Play the story'}
            </button>
          ) : (
            <p className="mt-5 border border-white/10 bg-night-3/80 px-4 py-3 font-grotesk text-[11px] leading-relaxed text-label-2">
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
