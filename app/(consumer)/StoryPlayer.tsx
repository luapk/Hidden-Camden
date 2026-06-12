'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BeerStein,
  CaretDown,
  CheckCircle,
  Pause,
  Play,
  Sparkle,
  Wallet,
  X,
} from '@phosphor-icons/react'
import type { TourStop } from '@/lib/tour/launchRoute'
import { isPaywalled } from '@/lib/tour/useTourProgress'
import Paywall from './Paywall'

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
}: {
  stop: TourStop
  paid: boolean
  banked: boolean
  onBank: (position: number) => void
  onMarkPaid: () => void
  onClose: () => void
}) {
  const gated = isPaywalled(stop.position, paid)

  return (
    <motion.div
      className="fixed inset-0 z-50 mx-auto max-w-md overflow-y-auto bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      role="dialog"
      aria-label={gated ? 'Unlock the last five' : `Story: ${stop.name}`}
    >
      {gated ? (
        <Paywall onUnlock={onMarkPaid} onClose={onClose} />
      ) : (
        <StoryBody stop={stop} banked={banked} onBank={onBank} onClose={onClose} />
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
}: {
  stop: TourStop
  banked: boolean
  onBank: (position: number) => void
  onClose: () => void
}) {
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

  // No audio: the transcript is the story. Open it.
  useEffect(() => {
    if (noAudio) setTranscriptOpen(true)
  }, [noAudio])

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

  const seek = (value: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = value
    setElapsed(value)
  }

  const bank = () => {
    onBank(stop.position)
    setJustBanked(true)
  }

  return (
    <div className="pb-10">
      {/* Banner */}
      <div className="relative h-52 w-full">
        <Image
          src={stop.image}
          alt={stop.name}
          fill
          priority
          sizes="448px"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${stop.accent}33 0%, ${stop.accent}E6 100%)`,
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close the story"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow"
        >
          <X size={18} weight="bold" />
        </button>
        <div className="absolute inset-x-5 bottom-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/90">
            Stop {stop.position} · Unlocked
          </div>
          <h2 className="mt-1 font-display text-3xl uppercase leading-[1.02] text-white">
            {stop.name}
          </h2>
          <p className="mt-0.5 text-[13px] text-white/85">{stop.subtitle}</p>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Audio player */}
        {stop.audioUrl && audioState !== 'failed' ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
            <audio
              ref={audioRef}
              src={stop.audioUrl}
              preload="metadata"
              onCanPlay={() => setAudioState('ready')}
              onError={() => setAudioState('failed')}
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
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pause the story' : 'Play the story'}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: stop.accent }}
              >
                {playing ? (
                  <Pause size={24} weight="fill" />
                ) : (
                  <Play size={24} weight="fill" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || stop.runtimeS}
                  step={1}
                  value={Math.min(elapsed, duration)}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="w-full"
                  style={{ accentColor: stop.accent }}
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-smoke">
                  <span>{clock(elapsed)}</span>
                  <span>{clock(duration)}</span>
                </div>
              </div>
              <button
                onClick={toggleRate}
                className="shrink-0 rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[12px] font-bold text-ink"
              >
                {rate}x
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
            <p className="font-mono text-[12px] text-ink">
              Audio coming soon. Read the story below.
            </p>
            {!finished && (
              <button
                onClick={() => setFinished(true)}
                className="mt-3 w-full rounded-xl px-4 py-3 font-display text-[14px] uppercase tracking-[0.06em] text-white"
                style={{ backgroundColor: stop.accent }}
              >
                Mark as listened
              </button>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="mt-4 rounded-2xl border border-ink/10">
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={transcriptOpen}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
              Transcript
            </span>
            <motion.span
              animate={{ rotate: transcriptOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <CaretDown size={16} weight="bold" color="#8A8077" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {transcriptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-[14px] leading-relaxed text-ink/85">
                  {stop.transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The bank moment */}
        <AnimatePresence>
          {finished && (
            <motion.div
              key="bank-card"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mt-5 overflow-hidden rounded-2xl border-2 bg-white p-4"
              style={{ borderColor: stop.accent }}
            >
              {justBanked && <SparkleBurst accent={stop.accent} />}
              <div
                className="font-mono text-[10px] uppercase tracking-[0.25em]"
                style={{ color: stop.accent }}
              >
                {banked ? 'Reward banked' : 'Your reward'}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <BeerStein size={22} weight="fill" color={stop.accent} />
                <span className="font-display text-xl uppercase leading-tight text-ink">
                  {stop.rewardLabel}
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-smoke">
                {stop.rewardWindow} · keeps for 7 days
              </div>

              {banked ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-mono text-[12px] text-ink">
                    <CheckCircle size={18} weight="fill" color={stop.accent} />
                    Banked. Find it in your wallet.
                  </span>
                  <Link
                    href="/wallet"
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] text-cream"
                  >
                    <Wallet size={14} weight="bold" />
                    Wallet
                  </Link>
                </div>
              ) : (
                <button
                  onClick={bank}
                  className="mt-3 w-full rounded-xl px-4 py-3 font-display text-[15px] uppercase tracking-[0.06em] text-white"
                  style={{ backgroundColor: stop.accent }}
                >
                  Bank reward
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** A small confetti-ish burst of sparkles and dots. No extra deps. */
function SparkleBurst({ accent }: { accent: string }) {
  const particles = Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2,
    distance: 60 + (i % 3) * 26,
    delay: i * 0.02,
    sparkle: i % 3 === 0,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: [0, 1.2, 0.6],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
        >
          {p.sparkle ? (
            <Sparkle size={16} weight="fill" color={accent} />
          ) : (
            <span
              className="block h-2 w-2 rounded-full"
              style={{ backgroundColor: accent }}
            />
          )}
        </motion.span>
      ))}
    </div>
  )
}
