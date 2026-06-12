import Image from 'next/image'
import { LAUNCH_ROUTE } from '@/lib/tour/launchRoute'

export const metadata = {
  title: 'Rewards · Camden Crawl',
}

export default function RewardsPage() {
  const stops = [...LAUNCH_ROUTE].sort((a, b) => a.position - b.position)

  return (
    <main>
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">
          Seven stops, seven drinks
        </div>
        <h1 className="mt-1 font-display text-3xl uppercase leading-none text-ink">
          Rewards
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-smoke">
          Every stop banks a free drink. Redeem inside the window, any day
          within 7 days.
        </p>
      </header>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {stops.map((stop) => (
          <li
            key={stop.position}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm"
          >
            <div className="relative h-28 w-full">
              <Image
                src={stop.image}
                alt={stop.name}
                fill
                sizes="(max-width: 448px) 50vw, 224px"
                className="object-cover"
              />
              <span
                className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold text-white"
                style={{ backgroundColor: stop.accent }}
              >
                Stop {stop.position}
              </span>
            </div>
            <div className="p-3">
              <div className="text-[13px] font-semibold leading-snug text-ink">
                {stop.rewardLabel}
              </div>
              <div className="mt-1 truncate font-mono text-[10px] text-smoke">
                {stop.name}
              </div>
              <div
                className="mt-1.5 font-mono text-[10px]"
                style={{ color: stop.accent }}
              >
                {stop.rewardWindow}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-2xl bg-ink/5 px-4 py-3 font-mono text-[11px] leading-relaxed text-smoke">
        Show your phone at the bar, staff tear, you drink. Codes are cheap,
        vouchers are precious. A dead code never eats a drink.
      </p>
    </main>
  )
}
