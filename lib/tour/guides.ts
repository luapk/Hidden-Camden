'use client'

import { useCallback, useEffect, useState } from 'react'
import { localizeAudioUrl, type Lang } from './language'

/**
 * Tour guides — alternative narrators for the English tour.
 *
 * Every guide walks the same route and the same stops; only the voice over
 * changes. Guide audio lives under /audio/guides/<id>/ mirroring the default
 * filenames, so `stop-01.mp3` becomes `guides/sammie/stop-01.mp3`.
 *
 * Guides narrate in English only. When the tour language is not English the
 * default narration for that language plays regardless of the chosen guide.
 */

export type GuideId = 'local' | 'sammie' | 'suggs' | 'yungblud' | 'carl-barat'

/** Which tours a guide narrates. Star guides are a music-venue thing;
 *  the house voice covers everything. */
export type GuideTour = 'crawl' | 'culture'

export interface TourGuide {
  id: GuideId
  name: string
  /** One-liner shown under the name in the picker. */
  tagline: string
  /** Short bio hinting at what this guide's telling of the route reveals. */
  bio: string
  /** Portrait. Placeholder shots for guides not yet recorded. */
  image: string
  status: 'live' | 'coming-soon'
  tours: GuideTour[]
}

// Portraits are placeholders reused from the app's proven Unsplash set until
// real press shots are cleared. Swap per-guide when assets land.
export const GUIDES: TourGuide[] = [
  {
    id: 'local',
    name: 'The Local',
    tagline: 'The house voice. Dry, North London.',
    bio: 'Knows every back door and who got thrown out of it. Witches, boxers, and the lie about jazz, told straight.',
    image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=600&q=80',
    status: 'live',
    tours: ['crawl', 'culture'],
  },
  {
    id: 'sammie',
    name: 'DJ Sammie Star',
    tagline: 'Spins at the Dublin Castle and the Good Mixer on weekends.',
    bio: 'He has worked these rooms for a decade. Expect the bar stools that matter, the booth gossip, and what really happens after the shutters drop.',
    image: '/guides/sammie.png',
    status: 'live',
    tours: ['crawl'],
  },
  {
    id: 'suggs',
    name: 'Suggs',
    tagline: 'Madness frontman. Camden royalty.',
    bio: 'The streets that built Madness, told by the man who walked them first. Ska, sharp suits, and the ballroom that nearly swallowed the band.',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80',
    status: 'coming-soon',
    tours: ['crawl'],
  },
  {
    id: 'yungblud',
    name: 'Yungblud',
    tagline: 'Loud, restless, Underworld approved.',
    bio: 'The new noise and where it hides. Sweat on the Underworld ceiling, eyeliner in the Ballroom toilets, and why Camden still bites.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80',
    status: 'coming-soon',
    tours: ['crawl'],
  },
  {
    id: 'carl-barat',
    name: 'Carl Barât',
    tagline: 'The Libertines. Knows the Dublin Castle stage by heart.',
    bio: 'Lock-ins, guerrilla gigs and the Good Old Days. He played half these rooms and got carried out of the rest.',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80',
    status: 'coming-soon',
    tours: ['crawl'],
  },
]

export const DEFAULT_GUIDE_ID: GuideId = 'local'

export function getGuide(id: GuideId): TourGuide {
  return GUIDES.find((g) => g.id === id) ?? GUIDES[0]
}

/** The roster for one tour's picker. */
export function guidesForTour(tourId: GuideTour): TourGuide[] {
  return GUIDES.filter((g) => g.tours.includes(tourId))
}

/**
 * The guide who actually narrates a given tour. A chosen star guide only
 * applies to tours they cover; everywhere else the house voice steps in.
 * The stored choice is untouched, so Sammie resumes when you return to
 * the venues route.
 */
export function effectiveGuideId(tourId: GuideTour, guideId: GuideId): GuideId {
  return getGuide(guideId).tours.includes(tourId) ? guideId : DEFAULT_GUIDE_ID
}

const KEY = 'cc-guide'
const EVENT = 'cc-guide-change'

function isSelectable(id: string | null): id is GuideId {
  return GUIDES.some((g) => g.id === id && g.status === 'live')
}

function read(): GuideId {
  if (typeof window === 'undefined') return DEFAULT_GUIDE_ID
  try {
    const stored = localStorage.getItem(KEY)
    return isSelectable(stored) ? stored : DEFAULT_GUIDE_ID
  } catch {
    return DEFAULT_GUIDE_ID
  }
}

/**
 * Reads and writes the chosen tour guide, kept in localStorage and synced
 * across components in the same tab via a custom event (and across tabs via
 * the native storage event). Same pattern as useLanguage.
 */
export function useGuide(): {
  guideId: GuideId
  guide: TourGuide
  setGuide: (id: GuideId) => void
  hydrated: boolean
} {
  const [guideId, setGuideId] = useState<GuideId>(DEFAULT_GUIDE_ID)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setGuideId(read())
    setHydrated(true)
    const onChange = () => setGuideId(read())
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setGuide = useCallback((id: GuideId) => {
    if (!isSelectable(id)) return
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
    setGuideId(id)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { guideId, guide: getGuide(guideId), setGuide, hydrated }
}

/**
 * Maps a default-narration audio URL onto the chosen guide's version.
 * Guides record English only: any other language falls through to
 * localizeAudioUrl unchanged, whatever guide is selected.
 */
export function resolveAudioUrl(
  url: string | null,
  lang: Lang,
  guideId: GuideId,
): string | null {
  if (!url) return null
  if (lang !== 'en') return localizeAudioUrl(url, lang)
  if (guideId === DEFAULT_GUIDE_ID) return url
  return url.replace('/audio/', `/audio/guides/${guideId}/`)
}
