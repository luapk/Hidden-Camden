'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BeerStein,
  CaretDown,
  CheckCircle,
  InstagramLogo,
  NavigationArrow,
  Pause,
  Play,
  Wallet,
  X,
} from '@phosphor-icons/react'
import { directionsHref, type TourStop } from '@/lib/tour/launchRoute'
import { localizeAudioUrl, useLanguage } from '@/lib/tour/language'
import { DEFAULT_GUIDE_ID, resolveAudioUrl, useGuide } from '@/lib/tour/guides'
import { isPaywalled } from '@/lib/tour/useTourProgress'
import { VENUE_POSTERS } from '@/lib/tour/venuePosters'
import Paywall from './Paywall'
import PosterCarousel from './PosterCarousel'

function clock(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

type AudioState = 'none' | 'loading' | 'ready' | 'failed'

export default function StoryPlayer({
  stop,
  paid,
  banked,
  onBank,
  onMarkPaid,
  onClose,
  bypassPaywall = false,
  autoPlay = false,
}: {
  stop: TourStop
  paid: boolean
  banked: boolean
  onBank: (position: number) => void
  onMarkPaid: () => void
  onClose: () => void
  bypassPaywall?: boolean
  autoPlay?: boolean
}) {
  const gated = isPaywalled(stop.position, paid) && !bypassPaywall

  return (
    <motion.div
      className="fixed inset-0 z-50 mx-auto max-w-md overflow-y-auto bg-night text-label-1"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      role="dialog"
      aria-label={gated ? 'Continue tour' : `Story: ${stop.name}`}
    >
      {gated ? (
        <Paywall onUnlock={onMarkPaid} onClose={onClose} />
      ) : (
        <StoryBody stop={stop} banked={banked} onBank={onBank} onClose={onClose} autoPlay={autoPlay} />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */

function StoryBody({
  stop,
  banked,
  onBank,
  onClose,
  autoPlay = false,
}: {
  stop: TourStop
  banked: boolean
  onBank: (position: number) => void
  onClose: () => void
  autoPlay?: boolean
}) {
  const { lang } = useLanguage()
  const { guideId, guide } = useGuide()
  const guideUrl = resolveAudioUrl(stop.audioUrl, lang, guideId)
  const houseUrl = localizeAudioUrl(stop.audioUrl, lang)
  // A guide whose file for this stop is not recorded yet falls back to the
  // house narration rather than a dead player.
  const [guideAudioFailed, setGuideAudioFailed] = useState(false)
  const audioUrl = guideAudioFailed ? houseUrl : guideUrl
  const guideActive =
    lang === 'en' && guideId !== DEFAULT_GUIDE_ID && !guideAudioFailed
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioState, setAudioState] = useState<AudioState>(
    stop.audioUrl ? 'loading' : 'none',
  )
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(stop.runtimeS)
  const [rate, setRate] = useState<1 | 1.5>(1)
  const [finished, setFinished] = useState(banked)
  const [justBanked, setJustBanked] = useState(false)
  const noAudio = audioState === 'none' || audioState === 'failed'
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const autoPlayedRef = useRef(false)

  useEffect(() => {
    if (noAudio) setTranscriptOpen(true)
  }, [noAudio])

  // Auto-play VO when the user arrives at a stop. Fires once per mount when
  // autoPlay is true and the audio element is ready. Silent failure on iOS
  // if the gesture chain is broken — the play button stays visible.
  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current || audioState !== 'ready') return
    autoPlayedRef.current = true
    audioRef.current?.play().catch(() => {})
  }, [autoPlay, audioState])

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => setAudioState('failed'))
    }
  }

  const toggleRate = () => {
    const next = rate === 1 ? 1.5 : 1
    setRate(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const seek = (pct: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    const t = pct * el.duration
    el.currentTime = t
    setElapsed(t)
  }

  const bank = () => {
    onBank(stop.position)
    setJustBanked(true)
  }

  const hasAudio = !!audioUrl && audioState !== 'failed'

  return (
    <div className="pb-10">
      {/* Banner — play button lives here */}
      <div className="relative h-60 w-full">
        <Image
          src={stop.image}
          alt={stop.name}
          fill
          priority
          sizes="448px"
          className="object-cover"
          style={{ filter: 'grayscale(30%) contrast(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-acid" aria-hidden />
        <button
          onClick={onClose}
          aria-label="Close the story"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-label-1 backdrop-blur-xl"
        >
          <X size={18} weight="bold" />
        </button>
        <span
          className="pointer-events-none absolute right-3 top-10 font-grotesk text-[96px] font-bold leading-none text-white/10"
          aria-hidden
        >
          {String(stop.position).padStart(2, '0')}
        </span>
        {/* Stop info — right-padded to clear play button */}
        <div className="absolute inset-x-5 bottom-5 pr-16">
          <div className="font-grotesk text-[11px] uppercase tracking-[0.35em] text-acid">
            Stop {stop.position} · Unlocked
          </div>
          {guideActive && (
            <div className="mt-1 font-grotesk text-[10px] uppercase tracking-[0.25em] text-label-2">
              Told by <span className="text-acid">{guide.name}</span>
            </div>
          )}
          <h2 className="mt-1.5 font-jost text-3xl font-bold uppercase leading-[1.02] tracking-tight text-label-1">
            {stop.name}
          </h2>
          <p className="mt-1 text-[13px] text-label-2">{stop.subtitle}</p>
          <div className="mt-1.5 flex items-center gap-3">
            {stop.address && (
              <a
                href={directionsHref(stop.name, stop.address)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-grotesk text-[10.5px] uppercase tracking-[0.12em] text-label-3"
              >
                <NavigationArrow size={11} weight="bold" color="#CCFF00" />
                {stop.address}
              </a>
            )}
            {stop.instagram && (
              <a
                href={`https://instagram.com/${stop.instagram}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`@${stop.instagram} on Instagram`}
                className="inline-flex items-center gap-1 font-grotesk text-[10.5px] text-label-3"
              >
                <InstagramLogo size={12} weight="regular" color="#CCFF00" />
                @{stop.instagram}
              </a>
            )}
          </div>
        </div>
        {/* Play/pause button — embedded in banner bottom-right */}
        {hasAudio && (
          <button
            onClick={togglePlay}
            aria-label={playing ? 'Pause the story' : 'Play the story'}
            className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-acid text-black shadow-[0_0_24px_rgba(204,255,0,0.3)]"
          >
            {audioState === 'loading' ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : playing ? (
              <Pause size={20} weight="fill" />
            ) : (
              <Play size={20} weight="fill" />
            )}
          </button>
        )}
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onCanPlay={() => setAudioState('ready')}
          onError={() => {
            if (!guideAudioFailed && guideUrl !== houseUrl) {
              setGuideAudioFailed(true)
              setAudioState('loading')
            } else {
              setAudioState('failed')
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration)
            }
          }}
          onEnded={() => {
            setPlaying(false)
            setFinished(true)
          }}
        />
      )}

      {/* Scrubber — full bleed, tight below the banner */}
      {hasAudio && (
        <div>
          <div
            className="relative h-[3px] cursor-pointer bg-white/10"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              seek((e.clientX - rect.left) / rect.width)
            }}
          >
            <div
              className="h-full bg-acid"
              style={{ width: duration > 0 ? `${(elapsed / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-2 font-mono text-[11px]">
            <span className="text-label-3">{clock(elapsed)}</span>
            <button
              onClick={toggleRate}
              className="rounded border border-white/20 px-2 py-0.5 text-label-2"
            >
              {rate}x
            </button>
            <span className="text-label-3">{clock(duration)}</span>
          </div>
        </div>
      )}

      <div className="px-5">
        {/* Guide file missing → house narration note */}
        {guideAudioFailed && lang === 'en' && guideId !== DEFAULT_GUIDE_ID && (
          <p className="mt-4 border border-white/10 bg-night-2 px-3 py-2 font-grotesk text-[11px] text-label-2">
            {guide.name}&apos;s take on this stop lands soon. The house voice has it covered.
          </p>
        )}

        {/* No-audio fallback */}
        {noAudio && (
          <div className="mt-5 border border-white/10 bg-night-2 p-4">
            <p className="font-grotesk text-[12px] text-label-2">
              Audio coming soon. Read the story below.
            </p>
            {!finished && (
              <button
                onClick={() => setFinished(true)}
                className="mt-3 w-full bg-acid px-4 py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-black"
              >
                Mark as listened
              </button>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="mt-4 border border-white/10 bg-night-1">
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={transcriptOpen}
          >
            <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-label-1">
              Transcript
            </span>
            <motion.span
              animate={{ rotate: transcriptOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <CaretDown
                size={16}
                weight="bold"
                color={transcriptOpen ? '#CCFF00' : '#98989D'}
              />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {transcriptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-[14px] leading-relaxed text-label-1/85">
                  {stop.transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Who played here — poster carousel */}
        {VENUE_POSTERS[stop.position] && (
          <PosterCarousel
            posters={VENUE_POSTERS[stop.position]}
            accent={stop.accent}
          />
        )}

        {/* The bank moment */}
        <AnimatePresence>
          {finished && (
            <div key="bank-card" className="relative">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                className="mt-5 bg-acid p-4 text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
              >
                <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-black/60">
                  {banked ? 'Reward banked' : 'Your reward'}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <BeerStein size={22} weight="fill" color="#000000" />
                  <span className="font-jost text-xl font-bold uppercase leading-tight tracking-tight">
                    {stop.rewardLabel}
                  </span>
                </div>
                <div className="mt-1 font-grotesk text-[11px] text-black/60">
                  {stop.rewardWindow} · keeps for 7 days
                </div>

                {banked ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 font-grotesk text-[12px] text-black">
                      <CheckCircle size={18} weight="fill" color="#000000" />
                      Banked. Find it in your wallet.
                    </span>
                    <Link
                      href="/wallet"
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-3 py-1.5 font-grotesk text-[11px] uppercase tracking-[0.1em] text-acid"
                    >
                      <Wallet size={14} weight="bold" />
                      Wallet
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={bank}
                    className="mt-3 w-full bg-black px-4 py-3 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-acid"
                  >
                    Bank reward
                  </button>
                )}
              </motion.div>
              {justBanked && <BauhausBurst />}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Bauhaus confetti: tiny lime squares, circles, and triangles. No extra deps. */
function BauhausBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    distance: 70 + (i % 3) * 30,
    delay: i * 0.025,
    shape: i % 3,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: [0, 1.2, 0.7],
            opacity: [1, 1, 0],
            rotate: p.shape === 1 ? 0 : 135,
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
        >
          {p.shape === 0 ? (
            <span className="block h-2 w-2 bg-acid" />
          ) : p.shape === 1 ? (
            <span className="block h-2 w-2 rounded-full bg-acid" />
          ) : (
            <span
              className="block h-0 w-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '9px solid #CCFF00',
              }}
            />
          )}
        </motion.span>
      ))}
    </div>
  )
}
