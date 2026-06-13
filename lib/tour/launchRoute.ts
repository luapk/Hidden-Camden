/**
 * The launch route, built from camden-crawl-audio-scripts.md.
 *
 * This is the static fallback used when the database is unreachable or
 * empty. The DB loader in getTourStops.ts maps live route data onto the
 * same TourStop shape, so client components never care about the source.
 */

export interface TourStop {
  /** 1-based stop number on the route. */
  position: number
  name: string
  subtitle: string
  lat: number
  lng: number
  radiusM: number
  rewardLabel: string
  rewardWindow: string
  runtimeS: number
  isFree: boolean
  /** Hex accent colour. One per stop, cycled from STOP_ACCENTS. */
  accent: string
  /** Unsplash image URL for the stop card. */
  image: string
  /** Opening lines of the stop's story. */
  transcript: string
  audioUrl: string | null
}

/** Accent palette cycled across stops: each stop gets an identity. */
export const STOP_ACCENTS = [
  '#D8432F', // Camden red
  '#2563EB', // electric blue
  '#8B5CF6', // violet
  '#C9933C', // brass
  '#84CC16', // acid green
  '#EC4899', // hot pink
] as const

export const STOP_IMAGES = [
  'https://images.unsplash.com/photo-1546726747-421c6d69c929?w=800&q=80', // pub exterior
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80', // concert crowd
  'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800&q=80', // vinyl/jazz
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', // guitarist
  'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80', // beer pint
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80', // neon sign
  'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800&q=80', // Camden Lock
] as const

export const LAUNCH_ROUTE: TourStop[] = [
  {
    position: 1,
    name: "The World's End & The Underworld",
    subtitle: "The witch's corner",
    lat: 51.53935,
    lng: -0.143,
    radiusM: 30,
    rewardLabel: 'House pint',
    rewardWindow: '12:00 to 17:00, daily',
    runtimeS: 120,
    isFree: true,
    accent: STOP_ACCENTS[0],
    image: STOP_IMAGES[0],
    transcript:
      'Before the bands. Before the market. Before Camden was even Camden, there was a cottage on this corner, and in it lived a woman called Jinny Bingham. The locals called her Mother Damnable, then later Mother Red Cap, and they gave her a wide berth. Partly manners. Mostly because the men in her life kept dying.',
    audioUrl: null,
  },
  {
    position: 2,
    name: 'Electric Ballroom',
    subtitle: "The boxer's ballroom",
    lat: 51.53985,
    lng: -0.1432,
    radiusM: 30,
    rewardLabel: 'Club night drink voucher',
    rewardWindow: 'Thu to Sat, after 19:00',
    runtimeS: 135,
    isFree: true,
    accent: STOP_ACCENTS[1],
    image: STOP_IMAGES[1],
    transcript:
      'In 1938, a Kerry-born builder and amateur boxer called Bill Fuller took over a rough little Irish club on this site called the Buffalo. Then the war came, and the Luftwaffe bombed the terrace next door. Most people saw tragedy. Bill Fuller saw site clearance.',
    audioUrl: null,
  },
  {
    position: 3,
    name: 'Jazz Café',
    subtitle: 'The small room for giants',
    lat: 51.53872,
    lng: -0.1443,
    radiusM: 30,
    rewardLabel: 'Tanqueray and tonic',
    rewardWindow: '19:00 to 20:00, doors hour',
    runtimeS: 105,
    isFree: false,
    accent: STOP_ACCENTS[2],
    image: STOP_IMAGES[2],
    transcript:
      'Not everything in Camden is loud. This corner has been the Jazz Café since 1990, and it runs on a single idea: take the artists who fill arenas, and put them in a room where the back row is closer than the front row anywhere else.',
    audioUrl: null,
  },
  {
    position: 4,
    name: 'The Dublin Castle',
    subtitle: 'The lie about jazz',
    lat: 51.53858,
    lng: -0.14598,
    radiusM: 30,
    rewardLabel: 'Pint of Guinness',
    rewardWindow: '12:00 to 18:00, daily',
    runtimeS: 140,
    isFree: false,
    accent: STOP_ACCENTS[3],
    image: STOP_IMAGES[3],
    transcript:
      "January 1979. Seven young men walk in and tell the landlord, Alo Conlon, that they're a jazz band. Alo thinks: jazz, lovely, respectable. Friday night comes, and a wall of skinheads turns up at his door. The band was Madness. The crowd was great.",
    audioUrl: null,
  },
  {
    position: 5,
    name: 'The Good Mixer',
    subtitle: "Britpop's living room",
    lat: 51.53948,
    lng: -0.14545,
    radiusM: 30,
    rewardLabel: 'Pint plus a free rack of pool',
    rewardWindow: 'Mon to Thu, 12:00 to 17:00',
    runtimeS: 120,
    isFree: false,
    accent: STOP_ACCENTS[4],
    image: STOP_IMAGES[4],
    transcript:
      'This is the pub that looks like nothing twice. But for about five years in the 1990s, this little boozer was the centre of the British music industry, and the pool table behind that window was the most influential piece of furniture in the country.',
    audioUrl: null,
  },
  {
    position: 6,
    name: 'The Hawley Arms',
    subtitle: 'The hiding place',
    lat: 51.54152,
    lng: -0.14702,
    radiusM: 30,
    rewardLabel: 'House pint',
    rewardWindow: 'Mon to Thu, 12:00 to 17:00',
    runtimeS: 135,
    isFree: false,
    accent: STOP_ACCENTS[5],
    image: STOP_IMAGES[5],
    transcript:
      "She didn't come here to be seen. She came here to disappear. And when even sitting at the bar got complicated, she did the most Amy thing imaginable: she got up, walked round, and started serving.",
    audioUrl: null,
  },
  {
    position: 7,
    name: 'Dingwalls',
    subtitle: 'The night punk went overground',
    lat: 51.54172,
    lng: -0.14618,
    radiusM: 30,
    rewardLabel: 'Terrace pint plus enamel pin',
    rewardWindow: 'Before 18:00, daily',
    runtimeS: 135,
    isFree: false,
    accent: STOP_ACCENTS[0],
    image: STOP_IMAGES[6],
    transcript:
      'The queue outside Dingwalls on 5 July 1976 was the most important guest list ever assembled: the Sex Pistols. The Clash. The Damned. Chrissie Hynde. Every band that would define the next five years of music, all unknown, all broke, all here.',
    audioUrl: null,
  },
]
