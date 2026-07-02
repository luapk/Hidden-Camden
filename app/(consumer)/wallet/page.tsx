'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BeerStein, Wallet as WalletIcon } from '@phosphor-icons/react'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'
import { useTourProgress } from '@/lib/tour/useTourProgress'
import BrandLogo from '../BrandLogo'

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
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Your round
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Wallet
        </h1>
        <p className="mt-2 text-[13px] text-label-2">
          Drinks land here as you unlock venues. They keep for 7 days.
        </p>
      </header>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : banked.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className="mt-14 flex flex-col items-center text-center"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-acid">
            <WalletIcon size={44} weight="fill" color="#CCFF00" />
          </span>
          <p className="mt-6 max-w-[260px] text-[15px] leading-relaxed text-label-2">
            Nothing banked yet. The first pint is a ten minute walk away.
          </p>
          <Link
            href="/"
            className="mt-6 bg-acid px-6 py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
          >
            Start the tour
          </Link>
        </motion.div>
      ) : (
        <motion.ul
          className="mt-6 space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {banked.map((stop) => (
            <motion.li
              key={stop.position}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            >
              <div className="relative flex overflow-hidden border border-white/10 bg-night-2">
                {/* Lime ticket rule */}
                <span className="w-[3px] shrink-0 bg-acid" aria-hidden />
                <div className="relative min-w-0 flex-1 p-4">
                  {/* Brand watermark */}
                  <BrandLogo
                    className="pointer-events-none absolute right-3 top-3 h-auto w-12 opacity-45"
                  />
                  <div className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
                    Banked · Stop{' '}
                    <span style={{ color: stop.accent }}>{stop.position}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <BeerStein size={22} weight="fill" color="#CCFF00" />
                    <span className="font-jost text-xl font-bold uppercase leading-tight tracking-tight text-label-1">
                      {stop.rewardLabel}
                    </span>
                  </div>
                  <div className="mt-1 font-grotesk text-[11px] text-label-2">
                    {stop.name} · {stop.rewardWindow}
                  </div>
                  <Link
                    href={`/redeem/demo-${stop.position}`}
                    className="mt-3 inline-block font-jost text-[14px] font-bold uppercase tracking-[0.1em] text-acid underline-offset-4 hover:underline"
                  >
                    Redeem at the bar
                  </Link>
                </div>
                {/* Perforation dot column */}
                <div
                  className="flex shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-white/10 px-2.5"
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4].map((d) => (
                    <span key={d} className="h-1 w-1 rounded-full bg-white/10" />
                  ))}
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </main>
  )
}
