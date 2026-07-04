/**
 * The launch route, built from camden-crawl-audio-scripts.md.
 *
 * This is the static fallback used when the database is unreachable or
 * empty. The DB loader in getTourStops.ts maps live route data onto the
 * same TourStop shape, so client components never care about the source.
 *
 * Audio: drop MP3 files into public/audio/ and they resolve automatically.
 * Expected filenames: stop-01.mp3 … stop-07.mp3, link-01-02.mp3 … link-06-07.mp3
 * Override paths via NEXT_PUBLIC_AUDIO_BASE env var (CDN base URL, no trailing slash).
 */

// Public blob store base for the launch-route narration. Used as the
// default so audio resolves on every deployment without depending on the
// NEXT_PUBLIC_AUDIO_BASE env var being scoped into each build. The host is
// public (not a secret); set NEXT_PUBLIC_AUDIO_BASE to override.
const DEFAULT_AUDIO_BASE = 'https://2nrkszijjyuoqrsq.public.blob.vercel-storage.com'

const AUDIO_BASE = process.env.NEXT_PUBLIC_AUDIO_BASE || DEFAULT_AUDIO_BASE

export const INTRO_AUDIO_URL = `${AUDIO_BASE}/audio/intro.mp3`

/**
 * Where the tour begins: outside Camden Town tube. Not a stop (no story, no
 * reward), just the start marker on the map and the spot the intro is meant
 * to play. Radius is generous; it only gates the intro, never an unlock.
 */
export const START_POINT = {
  name: 'Camden Town tube',
  lat: 51.53940,
  lng: -0.14290,
  radiusM: 50,
} as const

/**
 * Deep link that opens the user's maps app navigated to the venue. We query
 * by name + address so the maps provider geocodes the real venue, which is
 * accurate even if our stored pin drifts a few metres.
 */
export function directionsHref(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`
}

function stopAudio(n: number): string {
  return `${AUDIO_BASE}/audio/stop-${String(n).padStart(2, '0')}.mp3`
}

function linkAudio(from: number, to: number): string {
  return `${AUDIO_BASE}/audio/link-${String(from).padStart(2, '0')}-${String(to).padStart(2, '0')}.mp3`
}

export interface TourStop {
  /** 1-based stop number on the route. */
  position: number
  name: string
  subtitle: string
  /** Street address, shown discreetly and used for the directions link. */
  address: string
  /** Instagram handle without @, e.g. "worldsendcamden" */
  instagram: string
  /** Actual venue coordinates — used for the map pin and directions. */
  lat: number
  lng: number
  /** Geofence centre — defaults to lat/lng but can be offset to match real
   *  GPS drift at the venue (urban canyons shift phone readings by 30–100m). */
  fenceLat?: number
  fenceLng?: number
  radiusM: number
  rewardLabel: string
  rewardWindow: string
  runtimeS: number
  isFree: boolean
  /** Hex accent colour. One per stop, cycled from STOP_ACCENTS. */
  accent: string
  /** Unsplash image URL for the stop card. */
  image: string
  /** Full narration text for the stop (no SFX cues). */
  transcript: string
  /** Narration played while walking to the NEXT stop. Null on the last stop. */
  linkAudioUrl: string | null
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
    address: '174 Camden High St, London NW1 0NE',
    instagram: 'worldsendcamden',
    lat: 51.53915,
    lng: -0.14231,
    fenceLat: 51.53926,
    fenceLng: -0.14208,
    radiusM: 35,
    rewardLabel: 'House pint',
    rewardWindow: '12:00 to 17:00, daily',
    runtimeS: 120,
    isFree: true,
    accent: STOP_ACCENTS[0],
    image: STOP_IMAGES[0],
    transcript:
      'Before the bands. Before the market. Before Camden was even Camden, there was a cottage on this corner, and in it lived a woman called Jinny Bingham.\n\n' +
      'Seventeenth century. The locals called her Mother Damnable, then later Mother Red Cap, and they gave her a wide berth. Partly manners. Mostly because the men in her life kept dying. One vanished. One went into the oven, according to the kinder versions. And the story goes that on the night Jinny herself died, witnesses saw the devil walk in through her front door.\n\n' +
      'Nobody saw him leave.\n\n' +
      'The pub that grew up on this spot traded as The Mother Red Cap for the next three centuries, a coaching halt at the edge of London, the last drink before the countryside. The world\'s end. Hence the name on the wall now. These days it\'s the biggest boozer in Camden, the pre-gig waiting room for every show in NW1, and if the jukebox sounds harder than your average pub, there\'s a reason.\n\n' +
      'That\'s coming from under your feet. Down the stairs is The Underworld, and for more than thirty years it\'s been the loudest basement in Britain. Every metal, punk and hardcore band you\'ve ever loved either played that room on the way up or came back to it on the way down, close enough to touch and twice as sweaty. There\'s a pillar in the middle of the floor. Veterans navigate around it by instinct, in the dark, mid-mosh.\n\n' +
      'Your first reward just landed. One pint, on us, any time before five. Jinny\'s round.',
    linkAudioUrl: linkAudio(1, 2),
    audioUrl: stopAudio(1),
  },
  {
    position: 2,
    name: 'Electric Ballroom',
    subtitle: "The boxer's ballroom",
    address: '184 Camden High St, London NW1 8QP',
    instagram: 'electricballroomcamden',
    lat: 51.53966,
    lng: -0.14318,
    fenceLat: 51.53961,
    fenceLng: -0.14333,
    radiusM: 35,
    rewardLabel: 'Club night drink voucher',
    rewardWindow: 'Thu to Sat, after 19:00',
    runtimeS: 135,
    isFree: true,
    accent: STOP_ACCENTS[1],
    image: STOP_IMAGES[1],
    transcript:
      'In 1938, a Kerry-born builder and amateur boxer called Bill Fuller took over a rough little Irish club on this site called the Buffalo. The main entrance was round the back on Kentish Town Road. Business was steady. Space was tight.\n\n' +
      'Then the war came, and the Luftwaffe bombed the terrace next door.\n\n' +
      'Most people saw tragedy. Bill Fuller saw site clearance. He bought the rubble, knocked through, and built himself a two-thousand-capacity ballroom where Irish London came to dance for the next forty years.\n\n' +
      'By 1978, the dancing had changed. The relaunch night starred The Greedies, a supergroup built around Phil Lynott of Thin Lizzy plus half the Sex Pistols. They got the name because they demanded three quarters of the door money and Fuller called them a crowd of greedy bastards. To their credit, they kept it.\n\n' +
      'Two weeks later, Sid Vicious played a one-off here with a pickup band. The gig was billed as Sid Sods Off, and the door money had a specific purpose: raising the airfare to get Sid and Nancy to New York. Camden crowdfunded the most doomed relocation in rock history, at a fiver a head.\n\n' +
      'Since then: Joy Division. The Clash, who rehearsed here for a week. Madness. The Smiths. Public Enemy. And one night in 2014, with a few hours\' notice and rumours flying on Twitter, Prince walked in and played to about seventy people, while a queue of the disbelieving wrapped around the block outside.\n\n' +
      'This is a two-thousand-cap room. He used roughly four percent of it.\n\n' +
      'Your voucher\'s banked. It works on club nights, after seven. Wear black. You\'ll want to blend in.',
    linkAudioUrl: linkAudio(2, 3),
    audioUrl: stopAudio(2),
  },
  {
    position: 3,
    name: 'Jazz Café',
    subtitle: 'The small room for giants',
    address: '5 Parkway, London NW1 7PG',
    instagram: 'thejazzcafe',
    lat: 51.53872,
    lng: -0.14306,
    fenceLat: 51.53881,
    fenceLng: -0.14310,
    radiusM: 50,
    rewardLabel: 'Tanqueray and tonic',
    rewardWindow: '19:00 to 20:00, doors hour',
    runtimeS: 105,
    isFree: false,
    accent: STOP_ACCENTS[2],
    image: STOP_IMAGES[2],
    transcript:
      'Not everything in Camden is loud.\n\n' +
      'This corner has been the Jazz Café since 1990, and it runs on a single idea: take the artists who fill arenas, and put them in a room where the back row is closer than the front row anywhere else. Four hundred people. A balcony where you can eat dinner while a legend works below you, close enough to read the setlist.\n\n' +
      'The room\'s reputation was sealed in 1995, when a young singer from Virginia called D\'Angelo played a run of nights here and taped them. That recording got passed between musicians for years like contraband, the sound of neo-soul being born in NW1, and it put a permanent question mark over the idea that the great soul rooms were all in America.\n\n' +
      'Since then the walls have absorbed everyone. Soul royalty, funk pioneers on farewell laps, rappers doing the one small show of the tour, and now and then a north London girl with a beehive, back when only Camden knew her name.\n\n' +
      'Here\'s the thing about this room: it\'s at its best in the first hour, when the lights are low and the band is checking levels and you can still get the rail. Which is exactly when your drink works. Doors hour, seven till eight, a proper gin and tonic at the brass rail while everyone else is still queueing.\n\n' +
      'Arrive early. The room rewards it. So do we.',
    linkAudioUrl: linkAudio(3, 4),
    audioUrl: stopAudio(3),
  },
  {
    position: 4,
    name: 'The Dublin Castle',
    subtitle: 'The lie about jazz',
    address: '94 Parkway, London NW1 7AN',
    instagram: 'thedublincastle',
    lat: 51.53744,
    lng: -0.14557,
    fenceLat: 51.53737,
    fenceLng: -0.14545,
    radiusM: 50,
    rewardLabel: 'Pint of Guinness',
    rewardWindow: '12:00 to 18:00, daily',
    runtimeS: 140,
    isFree: false,
    accent: STOP_ACCENTS[3],
    image: STOP_IMAGES[3],
    transcript:
      'Right. Stop looking at your phone and look at the pub. Cream paint, hanging baskets, looks like nothing. This is the most important room in British pop music and it holds about a hundred and fifty people.\n\n' +
      'It opened in 1856 to stop navvies killing each other. Camden was crawling with men digging the railway, and the bright idea was separate pubs for each nationality, so there\'d be fewer fights and more men fit for work in the morning. The Irish got this one. Bear that in mind. This pub exists because of a strategy for managing drunk people. It\'s been refining it ever since.\n\n' +
      'Now. January 1979. Seven young men walk in and tell the landlord, Alo Conlon, that they\'re a jazz band. Alo thinks: jazz, lovely, respectable. Friday night comes, and a wall of skinheads turns up at his door. The band was Madness. The crowd was great. Alo gave them a year-long residency, and the back room behind you became the launchpad for One Step Beyond. They shot the video for My Girl in here. That\'s Alo at the start of it.\n\n' +
      'The lying-about-jazz trick worked so well the room never stopped. Blur played in there. Coldplay. Supergrass. The Killers. Muse got signed off the back of one electrifying set. The Libertines did a residency that nobody fully remembers, including the Libertines.\n\n' +
      'And then there\'s Amy. Winehouse loved this pub so much that when the paparazzi made a normal night out impossible, she\'d come in and get behind the bar, pulling pints for startled customers. Hiding in plain sight, dressed as her own barmaid. In 2007, already conquering the world with Back to Black, she played a secret homecoming gig in that back room. Crammed in hip to hip. Suggs was there. And right at the back, cap pulled down over his face, was David Schwimmer. Ross from Friends, hiding in a Camden boozer, watching Amy. Nobody bothered either of them. That\'s the whole pub in one image.\n\n' +
      'Your reward is live. One pint of Guinness, the same drink John Foreman was holding when he pulled the curtain off the Madness plaque outside. And there are four bands on in the back tonight. Statistically, one of them is the next Coldplay. You\'ve been warned.',
    linkAudioUrl: linkAudio(4, 5),
    audioUrl: stopAudio(4),
  },
  {
    position: 5,
    name: 'The Good Mixer',
    subtitle: "Britpop's living room",
    address: '30 Inverness St, London NW1 7HJ',
    instagram: 'goodmixerpub',
    lat: 51.53942,
    lng: -0.14457,
    fenceLat: 51.53946,
    fenceLng: -0.14464,
    radiusM: 60,
    rewardLabel: 'Pint plus a free rack of pool',
    rewardWindow: 'Mon to Thu, 12:00 to 17:00',
    runtimeS: 120,
    isFree: false,
    accent: STOP_ACCENTS[4],
    image: STOP_IMAGES[4],
    transcript:
      'This is the pub that looks like nothing twice.\n\n' +
      'Formica tables. A pool table. A telly for the football. In any other postcode, you\'d walk straight past. But for about five years in the 1990s, this little boozer was the centre of the British music industry, and the pool table behind that window was the most influential piece of furniture in the country.\n\n' +
      'Blur drank here. Not occasionally. Residentially. Graham Coxon lived around the corner and treated the Mixer as an extension of his front room, and where Blur drank, everyone followed: journalists, A&R men, photographers, and a steady supply of skinny young hopefuls in charity-shop suits. Legend says Menswear were less a band that formed than a band that condensed, out of cigarette smoke, somewhere between that pool table and the bar. They had a record deal before they had songs.\n\n' +
      'And because every scene needs a war, this is where Britpop\'s cold front ran. When Oasis came down from Manchester, this pub is where the two tribes actually had to share a room, and depending on who\'s telling it, that ended with words, or a squaring-up, or the Gallaghers barred outright. Nobody agrees on the details. Everyone agrees on the venue.\n\n' +
      'One more regular, years later. A local girl who\'d come in, put her money on the table, and quietly run it. Amy was, by all accounts, very good at pool. People only remember the voice. The pool arm deserves its due.\n\n' +
      'Your reward fits the room: a pint and a free rack. Weekday afternoons, when the table\'s empty and the light comes in sideways. Bring someone you want to beat.',
    linkAudioUrl: linkAudio(5, 6),
    audioUrl: stopAudio(5),
  },
  {
    position: 6,
    name: 'The Hawley Arms',
    subtitle: 'The hiding place',
    address: '2 Castlehaven Rd, London NW1 8QU',
    instagram: 'thehawleyarms',
    lat: 51.54199,
    lng: -0.14536,
    fenceLat: 51.54198,
    fenceLng: -0.14530,
    radiusM: 38,
    rewardLabel: 'House pint',
    rewardWindow: 'Mon to Thu, 12:00 to 17:00',
    runtimeS: 135,
    isFree: false,
    accent: STOP_ACCENTS[5],
    image: STOP_IMAGES[5],
    transcript:
      'Every pub on this tour has famous customers. This one had a family.\n\n' +
      'Through the 2000s, the Hawley Arms was the indie aristocracy\'s living room. Kate Moss at the bar. Noel Fielding in the corner. Half the bands you owned on CD, in here on a Tuesday, being left alone. That was the deal at the Hawley. You could be anyone, and they\'d treat you like no one, in the nicest possible way.\n\n' +
      'Which is why Amy Winehouse loved it.\n\n' +
      'She didn\'t come here to be seen. She came here to disappear. And when even sitting at the bar got complicated, she did the most Amy thing imaginable: she got up, walked round, and started serving. The biggest soul voice of her generation, pulling pints for tourists who couldn\'t believe what they were looking at. The bar wasn\'t a stage. It was a hiding place where she could be the version of herself she liked best.\n\n' +
      'Then, in February 2008, the great Camden fire tore through the market, and the Hawley burned with it. Ten days later, Amy stood up at the Grammys, in the biggest moment of her career, with the whole world finally watching, and used it to send a message home: that Camden Town was still standing. Her pub. On that stage. That night.\n\n' +
      'The Hawley rebuilt. Amy kept coming back until she couldn\'t. And now, behind the pub, there\'s a mural of her, two storeys tall, watching over the street she never really left. Go and see it after the audio ends. People leave flowers. It\'s the only stop on this tour where we\'d ask you to take the photo quietly.\n\n' +
      'Your pint is banked for a calm weekday afternoon, which is when this pub is most itself. Raise it to the family.',
    linkAudioUrl: linkAudio(6, 7),
    audioUrl: stopAudio(6),
  },
  {
    position: 7,
    name: 'Dingwalls',
    subtitle: 'The night punk went overground',
    address: 'Middle Yard, Camden Lock, London NW1 8AB',
    instagram: 'dingwallscamden',
    lat: 51.54120,
    lng: -0.14596,
    fenceLat: 51.54128,
    fenceLng: -0.14564,
    radiusM: 38,
    rewardLabel: 'Terrace pint plus enamel pin',
    rewardWindow: 'Before 18:00, daily',
    runtimeS: 135,
    isFree: false,
    accent: STOP_ACCENTS[0],
    image: STOP_IMAGES[6],
    transcript:
      'The name on this building belongs to T.E. Dingwall, a packing-case maker who stencilled his name on his warehouse and went out of business long before any of this. The name outlived the man, the trade, and very nearly the century. In 1973 the building reopened as a dance hall, kept the dead man\'s sign for the look of it, and accidentally made him immortal.\n\n' +
      'But this stop is really about one night. The fifth of July, 1976.\n\n' +
      'The evening before, four leather-jacketed brothers from Queens called the Ramones had played the Roundhouse up the road and reduced it to rubble in under forty minutes. The next night they played here. Smaller room. Same chainsaw. And the queue outside Dingwalls was the most important guest list ever assembled: the Sex Pistols. The Clash. The Damned. Chrissie Hynde. Every band that would define the next five years of music, all unknown, all broke, all here.\n\n' +
      'The British bands waited outside before doors, sitting on the bonnets of parked cars like a gang in a western, trying to look dangerous for the Americans. The Clash, who\'d played their first ever gig the night before, asked the Ramones how on earth they\'d filled two venues. The answer, more or less: we\'re terrible musicians, we play fast, we give the kids a show. Stop rehearsing. Go blow them away.\n\n' +
      'They did. Everyone did. Within six months, every band in London had doubled its tempo, and the brawl that broke out front of here that night, Clash versus Stranglers, made the national papers and put this warehouse on the map for good. Blondie made their UK debut on this stage too, just to round out the syllabus.\n\n' +
      'So that\'s your hour. A witch, a boxer, a lie about jazz, a pool table, a hiding place, and the night punk went overground. All within one half-mile, all still pouring.\n\n' +
      'Your final pint is waiting on the terrace over the lock, and your pin is claimable at the bar. Wear it somewhere people will ask about it.\n\n' +
      'Then tell them the one about the jazz band.',
    linkAudioUrl: linkAudio(7, 8),
    audioUrl: stopAudio(7),
  },
  // ── Chalk Farm Road extension, added July 2026. Coordinates are desk
  // estimates from the street addresses; nudge fenceLat/fenceLng after an
  // on-site walk (the calibrate screen helps).
  {
    position: 8,
    name: 'The Imperial Palace of Big Red',
    subtitle: 'The temple of loud',
    address: '40-42 Chalk Farm Rd, London NW1 8BG',
    instagram: 'theimperialpalaceof.bigred',
    lat: 51.54195,
    lng: -0.1484,
    radiusM: 30,
    rewardLabel: 'House pint',
    rewardWindow: '16:00 to 21:00, daily',
    runtimeS: 120,
    isFree: false,
    accent: STOP_ACCENTS[1],
    image: STOP_IMAGES[5],
    transcript:
      'Some bars book bands. This one built a shrine to them.\n\n' +
      'Big Red was Camden\'s rock bar for years, the room where the leather jackets outnumbered the tourists and the jukebox never once apologised. Then it went dark, the way too many rooms here have. And in October 2024 the original owner got the keys back, gave the place a name with delusions of grandeur, and reopened it as the Imperial Palace of Big Red.\n\n' +
      'The walls are the show. Posters on posters, memorabilia stacked like the room is trying to remember every gig Camden ever hosted at once. Animal print where you least expect it. A pool table waiting for your money. And horror B movies playing silently in the corner, all rubber monsters and screaming, because nothing pairs with a cold lager like a man in a latex suit menacing a cardboard spaceship.\n\n' +
      'Then there is Zoltan, the fortune telling machine. Feed it a coin and it will tell you your future, which in this postcode is usually another round and a band you have never heard of becoming your new favourite.\n\n' +
      'Rock bars are supposed to be extinct. Nobody told this one.\n\n' +
      'Your pint is banked, the table is open, and the monsters are already screaming. Ask Zoltan about the next stop. He knows.',
    linkAudioUrl: linkAudio(8, 9),
    audioUrl: stopAudio(8),
  },
  {
    position: 9,
    name: 'Barfly',
    subtitle: 'The room on every CV',
    address: '49 Chalk Farm Rd, London NW1 8AN',
    instagram: '',
    lat: 51.54235,
    lng: -0.1489,
    radiusM: 30,
    rewardLabel: 'House lager',
    rewardWindow: 'Gig nights, before 20:00',
    runtimeS: 130,
    isFree: false,
    accent: STOP_ACCENTS[2],
    image: STOP_IMAGES[1],
    transcript:
      'Every big band has a small room on their CV. This is the one most of them share.\n\n' +
      'From 1996 this was the Barfly. Two hundred capacity, sticky floor, and the sharpest scouting post in Britain. The names who sweated on that little stage on their way up read like a festival poster: Coldplay. Adele. Muse. Ed Sheeran. The deal was simple. If the industry wanted to know what was next, it stood at the back of this room with a warm beer and found out.\n\n' +
      'Then in 2016 the name came off the door, and the building spent eight years answering to Camden Assembly, which never sounded right, and everybody knew it.\n\n' +
      'On the twenty second of June, 2026, the sign went back up. Frank Turner played the first night of the reborn Barfly, which is about as correct as bookings get, and the new room keeps the old religion while upgrading the tools: a wall of fame with photographs nobody had seen before, blue plaques for the alumni, a proper new rig, and downstairs a vinyl listening bar built around a 1959 jukebox that is older than every record it plays.\n\n' +
      'Two hundred capacity, same as ever. Statistically, somebody on this stage in the next twelve months will be filling arenas before your tour pin needs polishing. You get to say you saw them here, and this time the wall of fame is ready for them.\n\n' +
      'Your lager is banked for gig nights, early doors, when the support band is soundchecking and hope is at its loudest.',
    linkAudioUrl: linkAudio(9, 10),
    audioUrl: stopAudio(9),
  },
  {
    position: 10,
    name: 'Spiritual Bar',
    subtitle: 'Where legends come to listen',
    address: '4-6 Ferdinand St, London NW1 8ER',
    instagram: '',
    lat: 51.54275,
    lng: -0.1503,
    radiusM: 35,
    rewardLabel: 'House drink',
    rewardWindow: 'Tue to Sun, 18:00 to 22:00',
    runtimeS: 120,
    isFree: false,
    accent: STOP_ACCENTS[3],
    image: STOP_IMAGES[3],
    transcript:
      'Ferdinand Street does not look like a launchpad. One room, run by a record label, live music six nights a week, and a Tuesday open mic that is quietly one of the most dangerous career moves in London. Dangerous because here, people actually listen.\n\n' +
      'Ask Ann Liu Cannon. She was playing this room when Ethan Johns walked in, the producer behind records for Paul McCartney and Laura Marling. He heard her, and the publishing deal with BMG followed. From this floor, no stage worth mentioning, to editorial playlists and American tours. The bar carries the torch for grassroots music and every so often the torch catches.\n\n' +
      'That is the trick of the Spiritual. The legends do not play here. They stand at the back with a drink, watching, because this is where the next ones surface first. Keep an eye on whoever looks too relaxed. That is usually somebody famous doing their listening.\n\n' +
      'The tour ends here, and that is deliberate. You have spent the evening walking through rooms where it already happened. This is the room where it happens next.\n\n' +
      'Your last drink is banked. Take it slow, face the stage, and if the person next to you hums along too precisely, buy them one as well. Chances are you own their records.',
    linkAudioUrl: null,
    audioUrl: stopAudio(10),
  },
]
