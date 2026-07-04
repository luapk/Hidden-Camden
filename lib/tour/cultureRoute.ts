/**
 * The Culture Cut — the daylight route. Record shops, boots, murals and
 * monsters, no pint required. Ten stops looping from Camden Town tube.
 *
 * Narration lives in blob storage as culture-*.mp3 (generated from
 * audioScripts.ts, which is also the source of the transcripts below, so
 * script and transcript can never drift apart).
 *
 * Coordinates are desk estimates from street addresses; nudge fence
 * centres after an on-site walk.
 */
import {
  AUDIO_BASE,
  STOP_ACCENTS,
  STOP_IMAGES,
  type TourStop,
} from './launchRoute'
import { AUDIO_FILES } from './audioScripts'

export const CULTURE_INTRO_AUDIO_URL = `${AUDIO_BASE}/audio/culture-intro.mp3`

function cultureAudio(n: number): string {
  return `${AUDIO_BASE}/audio/culture-stop-${String(n).padStart(2, '0')}.mp3`
}

function cultureLink(from: number, to: number): string {
  return `${AUDIO_BASE}/audio/culture-link-${String(from).padStart(2, '0')}-${String(to).padStart(2, '0')}.mp3`
}

/** Transcript straight from the generation script: one source of truth. */
function script(filename: string): string {
  return AUDIO_FILES.find((f) => f.filename === filename)?.text ?? ''
}

interface CultureStopSeed {
  name: string
  subtitle: string
  address: string
  instagram: string
  lat: number
  lng: number
  radiusM: number
  rewardLabel: string
  rewardWindow: string
  runtimeS: number
}

const SEEDS: CultureStopSeed[] = [
  {
    name: 'GuitarGuitar',
    subtitle: 'The tools',
    address: '16 Delancey St, London NW1 7NH',
    instagram: 'guitarguitaruk',
    lat: 51.5368,
    lng: -0.1433,
    radiusM: 40,
    rewardLabel: '10 percent off strings and picks',
    rewardWindow: 'Store hours, daily',
    runtimeS: 90,
  },
  {
    name: 'All Ages Records',
    subtitle: 'The punk shelf',
    address: '27a Pratt St, London NW1 0BG',
    instagram: 'allagesrecords',
    lat: 51.5379,
    lng: -0.1418,
    radiusM: 35,
    rewardLabel: '£2 off any record',
    rewardWindow: 'Store hours, Tue to Sun',
    runtimeS: 85,
  },
  {
    name: 'British Boot Company',
    subtitle: 'Heritage in cherry red',
    address: '5 Kentish Town Rd, London NW1 8NH',
    instagram: 'britishbootcompany',
    lat: 51.5396,
    lng: -0.1421,
    radiusM: 30,
    rewardLabel: 'Free laces with any boots',
    rewardWindow: 'Store hours, daily',
    runtimeS: 90,
  },
  {
    name: "Jeffrey's Street",
    subtitle: "Amy's first Camden address",
    address: "Jeffrey's St, by Quinns, London NW1 9PS",
    instagram: '',
    lat: 51.5408,
    lng: -0.1406,
    radiusM: 45,
    rewardLabel: 'Coffee or soft drink at Quinns',
    rewardWindow: '12:00 to 17:00, daily',
    runtimeS: 95,
  },
  {
    name: 'The Amy Mural',
    subtitle: 'Behind the Hawley Arms',
    address: 'Castlehaven Rd, London NW1 8QU',
    instagram: '',
    lat: 51.5421,
    lng: -0.1455,
    radiusM: 35,
    rewardLabel: 'Coffee or soft drink at the Hawley',
    rewardWindow: '12:00 to 17:00, daily',
    runtimeS: 85,
  },
  {
    name: 'MTV Studios',
    subtitle: 'The egg cups',
    address: '17-29 Hawley Crescent, London NW1 8TT',
    instagram: '',
    lat: 51.5408,
    lng: -0.1448,
    radiusM: 40,
    rewardLabel: 'Hidden Camden sticker set',
    rewardWindow: 'Claim at any partner till',
    runtimeS: 90,
  },
  {
    name: 'Out on the Floor Records',
    subtitle: 'The crates',
    address: '10 Inverness St, London NW1 7HJ',
    instagram: 'outonthefloorrecords',
    lat: 51.53935,
    lng: -0.1442,
    radiusM: 35,
    rewardLabel: '£2 off any record',
    rewardWindow: 'Store hours, daily',
    runtimeS: 90,
  },
  {
    name: 'Cyberdog',
    subtitle: 'The rave embassy',
    address: 'Stables Market, London NW1 8AH',
    instagram: 'cyberdogltd',
    lat: 51.5421,
    lng: -0.1468,
    radiusM: 45,
    rewardLabel: '10 percent off in store',
    rewardWindow: 'Store hours, daily',
    runtimeS: 90,
  },
  {
    name: 'The Horse Hospital',
    subtitle: 'Built for four legs',
    address: 'Stables Market, London NW1 8AH',
    instagram: '',
    lat: 51.5426,
    lng: -0.147,
    radiusM: 40,
    rewardLabel: 'Small market coffee, on us',
    rewardWindow: 'Market hours, daily',
    runtimeS: 95,
  },
  {
    name: 'The Henson',
    subtitle: 'The monster factory',
    address: '30 Oval Rd, London NW1 7DE',
    instagram: '',
    lat: 51.5392,
    lng: -0.1478,
    radiusM: 40,
    rewardLabel: 'Culture Cut enamel pin',
    rewardWindow: 'Claim at Dingwalls, before 18:00',
    runtimeS: 110,
  },
]

export const CULTURE_ROUTE: TourStop[] = SEEDS.map((seed, i) => {
  const position = i + 1
  return {
    position,
    name: seed.name,
    subtitle: seed.subtitle,
    address: seed.address,
    instagram: seed.instagram,
    lat: seed.lat,
    lng: seed.lng,
    radiusM: seed.radiusM,
    rewardLabel: seed.rewardLabel,
    rewardWindow: seed.rewardWindow,
    runtimeS: seed.runtimeS,
    isFree: position <= 2,
    accent: STOP_ACCENTS[i % STOP_ACCENTS.length],
    image: STOP_IMAGES[i % STOP_IMAGES.length],
    transcript: script(`culture-stop-${String(position).padStart(2, '0')}.mp3`),
    linkAudioUrl:
      position < SEEDS.length ? cultureLink(position, position + 1) : null,
    audioUrl: cultureAudio(position),
  }
})
