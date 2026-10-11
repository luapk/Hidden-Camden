'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  INTRO_AUDIO_URL,
  LAUNCH_ROUTE,
  type TourStop,
} from './launchRoute'

/**
 * The tour registry. One tour is live: the music venues walk, free end to
 * end, told by a host and a cast of guest guides. The Culture Cut
 * (cultureRoute.ts) is parked: its code stays, but it is not registered
 * here, so nothing in the app offers it.
 */

export type TourId = 'crawl' | 'culture'

export interface TourDef {
  id: TourId
  /** Full name for headers and the wallet. */
  name: string
  /** Short label for chips and tags. */
  shortName: string
  /** Plain descriptor that tells the two walks apart at a glance. */
  descriptor: string
  /** Suitable for all ages: rewards without the round. */
  family: boolean
  /** One-line subhead under the logo. */
  tagline: string
  introAudioUrl: string
  /** Shown on the tour-complete card. */
  completeText: string
  /** Static stop list. The crawl may be overridden by DB data at runtime. */
  stops: TourStop[]
}

export const TOURS: TourDef[] = [
  {
    id: 'crawl',
    name: 'The Music Venues Tour',
    shortName: 'Music venues',
    descriptor: 'Music venues',
    family: false,
    tagline:
      "Your personal walking tour from real Camden legends, with two Wolfie's on us along the way.",
    introAudioUrl: INTRO_AUDIO_URL,
    completeText:
      "A witch, a boxer, a lie about jazz, a pool table, a hiding place, the night punk went overground, a fortune teller, the room on every CV, a kebab shop's back room, and the engine shed that outlived the trains. Your second Wolfie's is in the wallet. Raise it to the round room.",
    stops: LAUNCH_ROUTE,
  },
]

export const DEFAULT_TOUR_ID: TourId = 'crawl'

export function getTour(id: TourId): TourDef {
  return TOURS.find((t) => t.id === id) ?? TOURS[0]
}

const KEY = 'cc-active-tour'
const EVENT = 'cc-active-tour-change'

function isTourId(v: string | null): v is TourId {
  return TOURS.some((t) => t.id === v)
}

function read(): TourId {
  if (typeof window === 'undefined') return DEFAULT_TOUR_ID
  try {
    const stored = localStorage.getItem(KEY)
    return isTourId(stored) ? stored : DEFAULT_TOUR_ID
  } catch {
    return DEFAULT_TOUR_ID
  }
}

/**
 * Reads and writes the chosen tour, localStorage-backed and synced across
 * components in the same tab. Same pattern as useLanguage.
 */
export function useActiveTour(): {
  tourId: TourId
  tour: TourDef
  setTour: (id: TourId) => void
  hydrated: boolean
} {
  const [tourId, setTourId] = useState<TourId>(DEFAULT_TOUR_ID)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setTourId(read())
    setHydrated(true)
    const onChange = () => setTourId(read())
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setTour = useCallback((id: TourId) => {
    if (!isTourId(id)) return
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
    setTourId(id)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { tourId, tour: getTour(tourId), setTour, hydrated }
}
