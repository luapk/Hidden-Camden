import { localizeAudioUrl, type Lang } from './language'

/**
 * The cast. One tour, many voices: a host who walks the whole half-mile and
 * narrates the walks in between, plus guest guides who each take the stop
 * they are tied to. Nobody is chosen; the cast is introduced up front and
 * each stop is told by its owner.
 *
 * Guest audio lives under /audio/guides/<id>/ mirroring the default
 * filenames. Until a guest's recording exists (status 'coming-soon'), the
 * host narrates their stop. Guests record English only; any other language
 * plays the host's localized narration.
 */

export type GuideId =
  | 'sammie'
  | 'suggs'
  | 'yungblud'
  | 'carl-barat'
  | 'camden-cat'
  | 'little-simz'

export interface TourGuide {
  id: GuideId
  name: string
  /** One-liner under the name on the cast list. */
  tagline: string
  /** Short line on what they bring to the walk. */
  bio: string
  /** Portrait, or null until one is available (monogram shown). */
  image: string | null
  /** CSS object-position for cropping the portrait into a circle. */
  imagePosition?: string
  /** 'live' once their recordings exist; until then the host covers them. */
  status: 'live' | 'coming-soon'
  role: 'host' | 'guest'
}

// Guest portraits are the acid-duotone shots from the promo site
// (public/promo/assets/portraits). Any guest without one shows a monogram.
export const GUIDES: TourGuide[] = [
  {
    id: 'sammie',
    name: 'DJ Sammie Star',
    tagline: 'Your host. Spins at the Dublin Castle and the Good Mixer.',
    bio: 'Walks you the whole half-mile and fills in the gaps between the legends: the bar stools that matter, the booth gossip, and what happens after the shutters drop.',
    image: '/guides/sammie.png',
    status: 'live',
    role: 'host',
  },
  {
    id: 'suggs',
    name: 'Suggs',
    tagline: 'Madness. Camden royalty.',
    bio: 'Takes the Dublin Castle, the pub where Madness cut their teeth.',
    image: '/promo/assets/portraits/suggs.jpg',
    status: 'coming-soon',
    role: 'guest',
  },
  {
    id: 'yungblud',
    name: 'Yungblud',
    tagline: 'The new noise.',
    bio: 'Takes the Hawley Arms, the pub that never learned to whisper.',
    image: '/promo/assets/portraits/yungblud.jpg',
    status: 'coming-soon',
    role: 'guest',
  },
  {
    id: 'carl-barat',
    name: 'Carl Barât',
    tagline: 'The Libertines.',
    bio: 'Takes the Barfly, the little room every band passes through on the way up.',
    image: '/promo/assets/portraits/carl-barat.jpg',
    status: 'coming-soon',
    role: 'guest',
  },
  {
    id: 'camden-cat',
    name: 'The Camden Cat',
    tagline: 'Bluesman. Northern Line legend.',
    bio: "Takes the Marathon, where he played the back room till the small hours for more than a decade.",
    image: '/promo/assets/portraits/camden-cat.jpg',
    status: 'coming-soon',
    role: 'guest',
  },
  {
    id: 'little-simz',
    name: 'Little Simz',
    tagline: 'North London, all the way.',
    bio: 'Takes the Roundhouse and brings the walk home.',
    image: '/promo/assets/portraits/little-simz.jpg',
    status: 'coming-soon',
    role: 'guest',
  },
]

/** The host: narrates every link, plus any stop without a live guest. */
export const HOST_ID: GuideId = 'sammie'

export function getGuide(id: GuideId): TourGuide {
  return GUIDES.find((g) => g.id === id) ?? GUIDES[0]
}

export function host(): TourGuide {
  return getGuide(HOST_ID)
}

/** Who owns a stop on the bill (the host when no guest is assigned). */
export function assignedGuide(stop: { voice?: GuideId }): TourGuide {
  return getGuide(stop.voice ?? HOST_ID)
}

/**
 * Who you actually hear at a stop: its guest once their English recording
 * is live, otherwise the host.
 */
export function narratorFor(stop: { voice?: GuideId }, lang: Lang): TourGuide {
  const owner = assignedGuide(stop)
  return lang === 'en' && owner.status === 'live' ? owner : host()
}

/**
 * Maps a host-narration audio URL onto a given narrator's recording.
 * Guests record English only: other languages fall through to the host's
 * localized file, whoever owns the stop.
 */
export function resolveAudioUrl(
  url: string | null,
  lang: Lang,
  guideId: GuideId,
): string | null {
  if (!url) return null
  if (lang !== 'en') return localizeAudioUrl(url, lang)
  if (guideId === HOST_ID) return url
  return url.replace('/audio/', `/audio/guides/${guideId}/`)
}

/** Two-letter monogram for guests without a portrait yet. */
export function monogram(name: string): string {
  const words = name.replace(/^the\s+/i, '').split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
