'use client'

import { useEffect, useRef, useState } from 'react'
import type { VenuePoster } from '@/lib/tour/venuePosters'

interface CardState {
  imageUrl: string | null
  loaded: boolean
}

export default function PosterCarousel({
  posters,
  accent,
}: {
  posters: VenuePoster[]
  accent: string
}) {
  const [cards, setCards] = useState<CardState[]>(
    () => posters.map(() => ({ imageUrl: null, loaded: false })),
  )
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    posters.forEach((poster, i) => {
      const title = encodeURIComponent(poster.wikiTitle.replace(/ /g, '_'))
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
        headers: { 'Api-User-Agent': 'CamdenCrawlApp/1.0' },
      })
        .then((r) => r.json())
        .then((data: { thumbnail?: { source?: string } }) => {
          setCards((prev) => {
            const next = [...prev]
            next[i] = { imageUrl: data.thumbnail?.source ?? null, loaded: true }
            return next
          })
        })
        .catch(() => {
          setCards((prev) => {
            const next = [...prev]
            next[i] = { imageUrl: null, loaded: true }
            return next
          })
        })
    })
  }, [posters])

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
          Who played here
        </span>
        <span
          className="rounded border px-1.5 py-0.5 font-grotesk text-[9px] uppercase tracking-[0.12em]"
          style={{ borderColor: accent + '40', color: accent + 'AA' }}
        >
          Placeholder
        </span>
      </div>

      {/* Scroll track */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {posters.map((poster, i) => {
          const card = cards[i]
          return (
            <PosterCard
              key={i}
              poster={poster}
              card={card ?? { imageUrl: null, loaded: false }}
              accent={accent}
            />
          )
        })}
      </div>

      {/* Credit */}
      <p className="mt-1 font-grotesk text-[9px] leading-relaxed text-label-3">
        Images sourced from Wikipedia (CC licence) — to be replaced with licensed poster art.
      </p>
    </div>
  )
}

function PosterCard({
  poster,
  card,
  accent,
}: {
  poster: VenuePoster
  card: CardState
  accent: string
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: 124,
        height: 172,
        scrollSnapAlign: 'start',
        borderLeft: `2px solid ${accent}`,
        backgroundColor: '#1A1A1E',
      }}
    >
      {/* Wikipedia thumbnail */}
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt={poster.artist}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'grayscale(50%) contrast(1.15) brightness(0.85)' }}
        />
      )}

      {/* Loading shimmer */}
      {!card.loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}

      {/* Gradient overlay — heavier at the bottom for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.88) 100%)',
        }}
      />

      {/* Year chip top-right */}
      <span
        className="absolute right-2 top-2 font-grotesk text-[9px] font-bold leading-none"
        style={{ color: accent }}
      >
        {poster.year}
      </span>

      {/* Text block bottom */}
      <div className="absolute inset-x-2 bottom-2">
        <div className="font-jost text-[13px] font-bold uppercase leading-tight tracking-tight text-white">
          {poster.artist}
        </div>
        <div className="mt-0.5 line-clamp-1 font-grotesk text-[9px] leading-tight text-white/50">
          {poster.note}
        </div>
      </div>
    </div>
  )
}
