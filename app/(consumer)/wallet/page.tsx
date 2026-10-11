'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, LockSimple } from '@phosphor-icons/react'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'
import { useTourProgress } from '@/lib/tour/useTourProgress'
import {
  DRINK_EXPIRY_DAYS,
  WOLFIES,
  drinkMilestones,
  type DrinkMilestone,
} from '@/lib/tour/drinks'

/**
 * The wallet: two Wolfie's, earned as you walk. Drink one after the third
 * story, drink two at the finale. Earned drinks open the redeem ticket;
 * the rest show how far away they are.
 */
export default function WalletPage() {
  const progress = useTourProgress('crawl')
  const [stops, setStops] = useState<TourStop[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/tour')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: TourStop[]) => {
        if (!cancelled) setStops(data)
      })
      .catch(() => {
        if (!cancelled) setStops(LAUNCH_ROUTE)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loading = !progress.hydrated || stops === null
  const sorted = [...(stops ?? [])].sort((a, b) => a.position - b.position)
  const positions = sorted.map((s) => s.position)
  const drinks = drinkMilestones(positions)
  const earnedCount = drinks.filter((d) => progress.bankedStops.includes(d.stop)).length

  return (
    <main>
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Two on us
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Wallet
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-label-2">
          Two free Wolfie&apos;s, earned as you walk. Each keeps for{' '}
          {DRINK_EXPIRY_DAYS} days.
        </p>
      </header>

      {/* The drink */}
      <div className="mt-5 flex items-center gap-4 border border-white/10 bg-night-2 p-4">
        <Image
          src={WOLFIES.logoWhite}
          alt={WOLFIES.name}
          width={96}
          height={Math.round(96 / WOLFIES.logoAspect)}
          className="h-auto w-[96px] shrink-0"
        />
        <p className="text-[12px] leading-snug text-label-2">
          {WOLFIES.blurb} {WOLFIES.serve}
        </p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <motion.ul
          className="mt-4 space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {drinks.map((drink) => (
            <DrinkSlot
              key={drink.id}
              drink={drink}
              stop={sorted.find((s) => s.position === drink.stop) ?? null}
              earned={progress.bankedStops.includes(drink.stop)}
              stopsAway={
                positions.filter(
                  (p) => p <= drink.stop && !progress.bankedStops.includes(p),
                ).length
              }
            />
          ))}
        </motion.ul>
      )}

      {!loading && earnedCount === 0 && !progress.tourStarted && (
        <Link
          href="/"
          className="mx-auto mt-6 block w-fit bg-acid px-6 py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
        >
          Start the tour
        </Link>
      )}

      <p className="mt-6 border border-white/10 bg-night-3/80 px-4 py-3 font-grotesk text-[11px] leading-relaxed text-label-2">
        Show your phone at the bar, staff tear, you drink. Codes are cheap,
        drinks are precious. A dead code never eats a drink.
      </p>
    </main>
  )
}

function DrinkSlot({
  drink,
  stop,
  earned,
  stopsAway,
}: {
  drink: DrinkMilestone
  stop: TourStop | null
  earned: boolean
  stopsAway: number
}) {
  const ordinal = drink.id === 1 ? 'First' : 'Second'
  const where = stop ? `${stop.name}, stop ${stop.position}` : `stop ${drink.stop}`

  return (
    <motion.li
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      {earned ? (
        <div className="relative flex overflow-hidden bg-acid text-black shadow-[0_0_24px_rgba(204,255,0,0.2)]">
          <div className="relative min-w-0 flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5 font-grotesk text-[10px] font-bold uppercase tracking-[0.3em] text-black/60">
                <CheckCircle size={13} weight="fill" color="#000000" />
                {ordinal} drink · earned
              </div>
              <Image
                src={WOLFIES.logoBlack}
                alt={WOLFIES.name}
                width={72}
                height={Math.round(72 / WOLFIES.logoAspect)}
                className="h-auto w-[72px] shrink-0"
              />
            </div>
            <div className="mt-1 font-jost text-[22px] font-bold uppercase leading-tight tracking-tight">
              A Wolfie&apos;s, on us
            </div>
            <div className="mt-0.5 font-grotesk text-[11px] text-black/60">
              Earned at {where}
            </div>
            <Link
              href={`/redeem/demo-drink-${drink.id}`}
              className="mt-3 inline-block rounded-full bg-black px-4 py-2 font-jost text-[13px] font-bold uppercase tracking-[0.1em] text-acid"
            >
              Redeem at the bar
            </Link>
          </div>
          {/* Perforation dot column */}
          <div
            className="flex shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-black/20 px-2.5"
            aria-hidden
          >
            {[0, 1, 2, 3, 4].map((d) => (
              <span key={d} className="h-1 w-1 rounded-full bg-black/20" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 border border-white/10 bg-night-2 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15">
            <LockSimple size={18} weight="bold" color="rgba(255,255,255,0.45)" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-3">
              {ordinal} drink
            </div>
            <div className="mt-0.5 font-jost text-[17px] font-bold uppercase leading-tight tracking-tight text-label-1">
              {stopsAway} {stopsAway === 1 ? 'stop' : 'stops'} to go
            </div>
            <div className="mt-0.5 truncate font-grotesk text-[11px] text-label-2">
              Lands with the story at {where}
            </div>
          </div>
        </div>
      )}
    </motion.li>
  )
}
