'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'
import { GUIDES, host, monogram, type TourGuide } from '@/lib/tour/guides'

/**
 * Meet your guides. Nothing to choose: one tour, one host who walks the
 * whole half-mile, and guest guides who each take the stop tied to them.
 * Guests not yet recorded sit on the bill as coming soon; the host covers
 * their stops until they land.
 */
export default function GuideCast({ stops = LAUNCH_ROUTE }: { stops?: TourStop[] }) {
  const lead = host()
  const guests = GUIDES.filter((g) => g.role === 'guest')
    .map((g) => ({ guide: g, stop: stops.find((s) => s.voice === g.id) ?? null }))
    .sort((a, b) => (a.stop?.position ?? 99) - (b.stop?.position ?? 99))

  return (
    <div className="mt-4">
      {/* Host */}
      <div className="relative flex items-stretch overflow-hidden border border-acid/70 bg-night-2 shadow-[0_0_28px_rgba(204,255,0,0.12)]">
        <span className="absolute inset-y-0 left-0 z-10 w-[3px] bg-acid" aria-hidden />
        <div className="relative w-[96px] shrink-0 self-stretch">
          {lead.image && (
            <Image
              src={lead.image}
              alt={lead.name}
              fill
              sizes="96px"
              className="object-cover"
              style={{ filter: 'grayscale(15%) contrast(1.08)' }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, transparent 45%, rgba(17,17,19,0.6) 80%, #111113 100%)',
            }}
          />
        </div>
        <div className="min-w-0 flex-1 py-3.5 pl-3 pr-4">
          <div className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-acid">
            Your host · every stop
          </div>
          <h3 className="mt-1 font-jost text-[18px] font-bold uppercase leading-tight tracking-tight text-label-1">
            {lead.name}
          </h3>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-label-2">{lead.bio}</p>
        </div>
      </div>

      {/* Guests */}
      <div className="mt-5 font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
        The guests
      </div>
      <ul className="mt-2.5 space-y-2">
        {guests.map(({ guide, stop }, i) => (
          <GuestRow key={guide.id} guide={guide} stop={stop} index={i} />
        ))}
      </ul>
    </div>
  )
}

function GuestRow({
  guide,
  stop,
  index,
}: {
  guide: TourGuide
  stop: TourStop | null
  index: number
}) {
  const soon = guide.status !== 'live'
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 140, damping: 22 }}
      className="flex items-center gap-3 border border-white/10 bg-night-2 p-3"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-acid/40">
        {guide.image ? (
          <Image src={guide.image} alt={guide.name} fill sizes="48px" className="object-cover" />
        ) : (
          <span className="font-grotesk text-[15px] font-bold tracking-tight text-acid">
            {monogram(guide.name)}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        {stop && (
          <div className="font-grotesk text-[9px] uppercase tracking-[0.25em] text-acid">
            Stop {stop.position} · {stop.name}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate font-jost text-[15px] font-bold uppercase tracking-tight text-label-1">
            {guide.name}
          </span>
          {soon && (
            <span className="shrink-0 rounded-full border border-white/15 px-1.5 py-0.5 font-grotesk text-[8px] uppercase tracking-[0.2em] text-label-2">
              Coming soon
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-label-2">{guide.bio}</p>
      </div>
    </motion.li>
  )
}
