'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BeerStein, Wallet as WalletIcon } from '@phosphor-icons/react'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'
import { useTourProgress } from '@/lib/tour/useTourProgress'

export default function WalletPage() {
  const { bankedStops, hydrated } = useTourProgress()
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

  const banked = (stops ?? [])
    .filter((s) => bankedStops.includes(s.position))
    .sort((a, b) => a.position - b.position)

  const loading = !hydrated || stops === null

  return (
    <main>
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-camden">
          Your round
        </div>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink">
          Wallet
        </h1>
        <p className="mt-1.5 text-[13px] text-smoke">
          Drinks land here as you unlock venues. They keep for 7 days.
        </p>
      </header>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink/5" />
          ))}
        </div>
      ) : banked.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex flex-col items-center text-center"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-electric/10">
            <WalletIcon size={44} weight="fill" color="#2563EB" />
          </span>
          <p className="mt-5 max-w-[260px] text-[15px] leading-relaxed text-ink/80">
            Nothing banked yet. The first pint is a ten minute walk away.
          </p>
          <Link
            href="/"
            className="mt-5 rounded-xl bg-ink px-5 py-3 font-display text-[14px] uppercase tracking-[0.06em] text-cream"
          >
            Start the tour
          </Link>
        </motion.div>
      ) : (
        <motion.ul
          className="mt-6 space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {banked.map((stop) => (
            <motion.li
              key={stop.position}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <div
                className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
                style={{ borderLeft: `6px solid ${stop.accent}` }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: stop.accent }}
                >
                  Banked · Stop {stop.position}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <BeerStein size={22} weight="fill" color={stop.accent} />
                  <span className="font-display text-xl uppercase leading-tight text-ink">
                    {stop.rewardLabel}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-smoke">
                  {stop.name} · {stop.rewardWindow}
                </div>
                <Link
                  href={`/redeem/demo-${stop.position}`}
                  className="mt-3 block w-full rounded-xl px-4 py-3 text-center font-display text-[14px] uppercase tracking-[0.06em] text-white"
                  style={{ backgroundColor: stop.accent }}
                >
                  Redeem at the bar
                </Link>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </main>
  )
}
