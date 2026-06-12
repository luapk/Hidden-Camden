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
      className="fixed inset-0 z-50 mx-auto max-w-md overflow-y-auto bg-night text-label-1"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
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
        {/* Lime hairline along the banner's lower edge */}
        <span className="absolute inset-x-0 bottom-0 h-px bg-acid" aria-hidden />
        <button
          onClick={onClose}
          aria-label="Close the story"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-label-1 backdrop-blur-xl"
        >
          <X size={18} weight="bold" />
        </button>
        {/* Ghost stop numeral */}
        <span
          className="pointer-events-none absolute right-3 top-10 font-grotesk text-[96px] font-bold leading-none text-white/10"
          aria-hidden
        >
          {String(stop.position).padStart(2, '0')}
        </span>
        <div className="absolute inset-x-5 bottom-5">
          <div className="font-grotesk text-[11px] uppercase tracking-[0.35em] text-acid">
            Stop {stop.position} · Unlocked
          </div>
          <h2 className="mt-1.5 font-jost text-3xl font-bold uppercase leading-[1.02] tracking-tight text-label-1">
            {stop.name}
          </h2>
          <p className="mt-1 text-[13px] text-label-2">{stop.subtitle}</p>
        </div>
      </div>

      <div className="px-5">
        {/* Audio transport on a glass strip over the banner edge */}
        {stop.audioUrl && audioState !== 'failed' ? (
          <div className="relative z-10 -mt-7 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-2xl">
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
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-acid text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
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
                  style={{ accentColor: '#CCFF00' }}
                />
                <div className="mt-1 flex justify-between font-grotesk text-[11px] text-label-2">
                  <span>{clock(elapsed)}</span>
                  <span>{clock(duration)}</span>
                </div>
              </div>
              <button
                onClick={toggleRate}
                className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 font-grotesk text-[12px] font-bold text-label-1"
              >
                {rate}x
              </button>
            </div>
          </div>
        ) : (
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
    shape: i % 3, // 0 square, 1 circle, 2 triangle
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
