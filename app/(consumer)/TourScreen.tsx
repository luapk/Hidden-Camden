'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BeerStein,
  Check,
  Headphones,
  LockSimple,
  NavigationArrow,
  Pause,
  Play,
} from '@phosphor-icons/react'
import { haversineDistance } from '@/lib/geo'
import { useGeofence, type GeoPosition } from '@/lib/geo/useGeofence'
import { isPaywalled, useTourProgress } from '@/lib/tour/useTourProgress'
import {
  INTRO_AUDIO_URL,
  directionsHref,
  type TourStop,
} from '@/lib/tour/launchRoute'
import { localizeAudioUrl, useLanguage } from '@/lib/tour/language'
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
    unlockStop,
    bankStop,
    markPaid,
  } = progress

  const { lang } = useLanguage()

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
  const [miniAudio, setMiniAudio] = useState<{ url: string; label: string } | null>(null)
  // Link audio is armed when a story closes, then plays once the walker
  // actually leaves that venue heading for the next stop (see effect below).
  const [pendingLink, setPendingLink] = useState<{
    from: TourStop
    url: string
    label: string
  } | null>(null)

  // When a story closes, arm the link audio for the walk to the next stop.
  const prevStoryRef = useRef<TourStop | null>(null)
  useEffect(() => {
    if (activeStory) {
      prevStoryRef.current = activeStory
    } else if (prevStoryRef.current) {
      const closed = prevStoryRef.current
      prevStoryRef.current = null
      const nextInRoute = sorted.find((s) => s.position === closed.position + 1)
      const linkUrl = localizeAudioUrl(closed.linkAudioUrl, lang)
      if (linkUrl && nextInRoute) {
        setPendingLink({
          from: closed,
          url: linkUrl,
          label: `Walk to ${nextInRoute.name}`,
        })
      }
    }
  }, [activeStory, sorted, lang])

  // Reward sting played the instant a new stop unlocks.
  const rewardSoundRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const audio = new Audio('/sounds/reward.wav')
    audio.preload = 'auto'
    audio.volume = 0.7
    rewardSoundRef.current = audio
    return () => {
      audio.pause()
      rewardSoundRef.current = null
    }
  }, [])

  const playReward = useCallback(() => {
    const audio = rewardSoundRef.current
    if (!audio) return
    audio.currentTime = 0
    // Autoplay can be blocked before any interaction; ignore that.
    audio.play().catch(() => {})
  }, [])

  const geo = useGeofence(
    nextStop
      ? { lat: nextStop.lat, lng: nextStop.lng, radiusM: nextStop.radiusM }
      : null,
    5_000,
    override,
  )

  const arrive = useCallback(
    (stop: TourStop) => {
      setMiniAudio(null) // stop any link or intro audio
      setPendingLink(null) // a new arrival makes a pending walk-link moot
      if (isPaywalled(stop.position, paid)) {
        setActiveStory(stop)
        return
      }
      setUnlockFlash(stop)
      playReward()
      unlockStop(stop.position)
      window.setTimeout(() => {
        setUnlockFlash(null)
        setActiveStory(stop)
      }, 1500)
    },
    [paid, unlockStop, playReward],
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

  const [searchSim, setSearchSim] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchSim(new URLSearchParams(window.location.search).has('sim'))
    }
  }, [])

  const simEnabled =
    searchSim ||
    process.env.NEXT_PUBLIC_GEO_SIM === 'true' ||
    geo.permissionState === 'denied'

  const simulateArrival = () => {
    if (!nextStop) return
    setOverride({ lat: nextStop.lat, lng: nextStop.lng, accuracy: 5 })
    // In sim mode, also bank the reward immediately so you can step through
    // all 7 stops without opening the story player each time.
    bankStop(nextStop.position)
    arrive(nextStop)
  }

  // Play the armed link audio only once the walker has left the venue they
  // just heard about, i.e. they are genuinely walking to the next stop. In
  // sim mode (or with no GPS fix) there is no walk to detect, so play it now.
  useEffect(() => {
    if (!pendingLink) return
    if (simEnabled || !geo.position) {
      setMiniAudio({ url: pendingLink.url, label: pendingLink.label })
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
      setMiniAudio({ url: pendingLink.url, label: pendingLink.label })
      setPendingLink(null)
    }
  }, [pendingLink, geo.position, simEnabled])

  const bankedCount = bankedStops.length

  return (
    <main>
      {/* Header */}
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Walking tour · NW1
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
            Camden <span className="text-acid">Crawl</span>
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

      {/* Intro audio — shown before first stop unlocks */}
      {hydrated && unlockedStops.length === 0 && !miniAudio && (
        <MiniPlayer
          key={`intro-${lang}`}
          url={localizeAudioUrl(INTRO_AUDIO_URL, lang) ?? INTRO_AUDIO_URL}
          label="Introduction"
          onDismiss={() => setMiniAudio(null)}
        />
      )}

      {/* Link audio — auto-plays after a story closes */}
      {miniAudio && (
        <MiniPlayer
          key={miniAudio.url}
          url={miniAudio.url}
          label={miniAudio.label}
          onDismiss={() => setMiniAudio(null)}
        />
      )}

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
          />
        ) : hydrated ? (
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
        ) : null}

        {simEnabled && (
          <div className="mt-3 border border-dashed border-acid/30 bg-night-2 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-acid/60">
                Sim mode
              </span>
              {nextStop ? (
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
              </p>
            )}
          </div>
        )}
      </div>

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
            onClose={() => setActiveStory(null)}
          />
        )}
      </AnimatePresence>
    </main>
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
  label,
  onDismiss,
}: {
  url: string
  label: string
  onDismiss: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

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
        src={url}
        preload="auto"
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
}: {
  stop: TourStop
  distanceM: number | null
  inside: boolean
  dwellProgress: number
  permissionState: string
  lowAccuracy: boolean
  onPlay: () => void
}) {
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
          {stop.address && (
            <a
              href={directionsHref(stop.name, stop.address)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-between gap-3 border border-white/10 bg-night-3/60 px-3 py-2.5"
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
