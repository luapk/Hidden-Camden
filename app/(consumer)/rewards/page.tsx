import Image from 'next/image'
import { LAUNCH_ROUTE } from '@/lib/tour/launchRoute'

export const metadata = {
  title: 'Rewards · Hidden Camden',
}

export default function RewardsPage() {
  const stops = [...LAUNCH_ROUTE].sort((a, b) => a.position - b.position)

  return (
    <main>
      <header>
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Seven stops, seven drinks
        </div>
        <h1 className="mt-2 font-jost text-4xl font-bold uppercase leading-[0.95] tracking-tight text-label-1">
          Rewards
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-label-2">
          Every stop banks a free drink. Redeem inside the window, any day
          within 7 days.
        </p>
      </header>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {stops.map((stop) => (
          <li
            key={stop.position}
            className="overflow-hidden border border-white/10 bg-night-2"
          >
            <div className="relative h-28 w-full">
              <Image
                src={stop.image}
                alt={stop.name}
                fill
                sizes="(max-width: 448px) 50vw, 224px"
                className="object-cover"
                style={{ filter: 'grayscale(20%)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
              <span className="absolute left-2 top-2 bg-acid px-2 py-0.5 font-grotesk text-[10px] font-bold uppercase tracking-[0.1em] text-black">
                Stop {stop.position}
              </span>
            </div>
            <div className="p-3">
              <div className="text-[13px] font-semibold leading-snug text-label-1">
                {stop.rewardLabel}
              </div>
              <div className="mt-1 truncate font-grotesk text-[10px] text-label-2">
                {stop.name}
              </div>
              <div className="mt-1.5 font-grotesk text-[10px] text-label-3">
                {stop.rewardWindow}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 border border-white/10 bg-night-3/80 px-4 py-3 font-grotesk text-[11px] leading-relaxed text-label-2">
        Show your phone at the bar, staff tear, you drink. Codes are cheap,
        vouchers are precious. A dead code never eats a drink.
      </p>
    </main>
  )
}
