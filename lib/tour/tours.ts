'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  INTRO_AUDIO_URL,
  LAUNCH_ROUTE,
  type TourStop,
} from './launchRoute'
import { CULTURE_INTRO_AUDIO_URL, CULTURE_ROUTE } from './cultureRoute'

/**
 * The tour registry. Two routes share one start point (Camden Town tube),
 * one paywall model (stops 1 and 2 free) and one app; what changes is the
 * stops, the narration and the voice of the thing.
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
    descriptor: 'Music venues tour',
    family: false,
    tagline:
      'Your personal walking tour from a real Camden legend, with rewards waiting to be unlocked.',
    introAudioUrl: INTRO_AUDIO_URL,
    completeText:
      'A witch, a boxer, a lie about jazz, a pool table, a hiding place, the night punk went overground, a fortune teller, the room on every CV, and the bar where it happens next. Your pin is waiting at Dingwalls. Wear it somewhere people will ask.',
    stops: LAUNCH_ROUTE,
  },
  {
    id: 'culture',
    name: 'The Culture Cut',
    shortName: 'Culture Cut',
    descriptor: 'Family culture walk',
    family: true,
    tagline:
      'The daylight route. Record shops, boots, murals and monsters, no pint required.',
    introAudioUrl: CULTURE_INTRO_AUDIO_URL,
    completeText:
      'The guitars, the boots, the records, the eggs, the robots, the horses, the girl from Jeffrey’s Street and the man who built the monsters. Your pin is waiting at Dingwalls. Go back for the record you left in the crate.',
    stops: CULTURE_ROUTE,
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
 * components in the same tab. Same pattern as useLanguage and useGuide.
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
