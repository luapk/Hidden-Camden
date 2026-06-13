/**
 * Historical acts per venue, used as placeholder carousel cards.
 * wikiTitle drives a client-side Wikipedia REST thumbnail fetch.
 * Replace imageUrl with a licensed poster scan to graduate from placeholder.
 */

export interface VenuePoster {
  artist: string
  year: string
  /** One-line context shown on the card. */
  note: string
  /** Wikipedia article title — fetched at runtime for thumbnail. */
  wikiTitle: string
}

/** Keyed by TourStop.position (1–7). */
export const VENUE_POSTERS: Record<number, VenuePoster[]> = {
  1: [
    // The World's End / The Underworld
    {
      artist: 'The Prodigy',
      year: '1992',
      note: 'Early rave residency',
      wikiTitle: 'The_Prodigy',
    },
    {
      artist: 'The Libertines',
      year: '2002',
      note: 'First Camden shows',
      wikiTitle: 'The_Libertines',
    },
    {
      artist: 'Arctic Monkeys',
      year: '2004',
      note: 'Pre-album Camden circuit',
      wikiTitle: 'Arctic_Monkeys',
    },
    {
      artist: 'Suede',
      year: '1993',
      note: 'Animal Nitrate era',
      wikiTitle: 'Suede_(band)',
    },
    {
      artist: 'Placebo',
      year: '1996',
      note: 'Debut tour warm-up',
      wikiTitle: 'Placebo_(band)',
    },
  ],

  2: [
    // Electric Ballroom
    {
      artist: 'Joy Division',
      year: '1979',
      note: 'Oct 26 — Unknown Pleasures tour',
      wikiTitle: 'Joy_Division',
    },
    {
      artist: 'The Cramps',
      year: '1980',
      note: 'Mar 21 — classic lineup',
      wikiTitle: 'The_Cramps',
    },
    {
      artist: 'Jesus and Mary Chain',
      year: '1985',
      note: 'Sep 9 — the riot show',
      wikiTitle: 'The_Jesus_and_Mary_Chain',
    },
    {
      artist: 'Siouxsie and the Banshees',
      year: '1979',
      note: 'Post-punk era residency',
      wikiTitle: 'Siouxsie_and_the_Banshees',
    },
    {
      artist: 'Nick Cave',
      year: '1984',
      note: 'Apr 12 — The Cavemen',
      wikiTitle: 'Nick_Cave',
    },
  ],

  3: [
    // Jazz Café
    {
      artist: 'Amy Winehouse',
      year: '2004',
      note: 'Frank-era Camden shows',
      wikiTitle: 'Amy_Winehouse',
    },
    {
      artist: "D'Angelo",
      year: '1995',
      note: 'Live at the Jazz Café LP',
      wikiTitle: "D'Angelo",
    },
    {
      artist: 'Lee Scratch Perry',
      year: '2016',
      note: 'Two-night dub residency',
      wikiTitle: 'Lee_Perry',
    },
    {
      artist: 'Pharoah Sanders',
      year: '2011',
      note: 'Televised on Mezzo Europe',
      wikiTitle: 'Pharoah_Sanders',
    },
    {
      artist: 'Gil Scott-Heron',
      year: '1999',
      note: 'Spoken word and soul',
      wikiTitle: 'Gil_Scott-Heron',
    },
  ],

  4: [
    // The Dublin Castle
    {
      artist: 'Madness',
      year: '1979',
      note: 'Jan 16 — debut residency',
      wikiTitle: 'Madness_(band)',
    },
    {
      artist: 'Coldplay',
      year: '1998',
      note: 'Feb 22 — first ever gig',
      wikiTitle: 'Coldplay',
    },
    {
      artist: 'The Libertines',
      year: '2001',
      note: 'Third booking — "really something"',
      wikiTitle: 'The_Libertines',
    },
    {
      artist: 'Muse',
      year: '1999',
      note: 'Signed after second show here',
      wikiTitle: 'Muse_(band)',
    },
    {
      artist: 'Amy Winehouse',
      year: '2002',
      note: 'Pre-Frank Camden circuit',
      wikiTitle: 'Amy_Winehouse',
    },
  ],

  5: [
    // The Good Mixer
    {
      artist: 'Blur',
      year: '1994',
      note: 'Parklife — permanent residency',
      wikiTitle: 'Blur_(band)',
    },
    {
      artist: 'Oasis',
      year: '1994',
      note: 'Definitely Maybe era',
      wikiTitle: 'Oasis_(band)',
    },
    {
      artist: 'Elastica',
      year: '1994',
      note: 'Signed their deal at the bar',
      wikiTitle: 'Elastica',
    },
    {
      artist: 'Pulp',
      year: '1995',
      note: 'His n Hers — post-Brits',
      wikiTitle: 'Pulp_(band)',
    },
    {
      artist: 'Suede',
      year: '1993',
      note: 'Dog Man Star sessions',
      wikiTitle: 'Suede_(band)',
    },
  ],

  6: [
    // The Hawley Arms
    {
      artist: 'Amy Winehouse',
      year: '2005',
      note: 'Regulars table — and the bar',
      wikiTitle: 'Amy_Winehouse',
    },
    {
      artist: 'Pete Doherty',
      year: '2004',
      note: 'Libertines split era',
      wikiTitle: 'Pete_Doherty',
    },
    {
      artist: 'Razorlight',
      year: '2008',
      note: 'Nov 7 — rooftop reopening',
      wikiTitle: 'Razorlight',
    },
    {
      artist: 'Arctic Monkeys',
      year: '2005',
      note: 'Whatever People Say era',
      wikiTitle: 'Arctic_Monkeys',
    },
    {
      artist: 'Mark Ronson',
      year: '2006',
      note: 'Met Winehouse here — Back to Black',
      wikiTitle: 'Mark_Ronson',
    },
  ],

  7: [
    // Dingwalls
    {
      artist: 'Ramones',
      year: '1976',
      note: 'Jul 5 — the night punk started',
      wikiTitle: 'Ramones',
    },
    {
      artist: 'Blondie',
      year: '1978',
      note: 'Jan 24 — UK debut',
      wikiTitle: 'Blondie_(band)',
    },
    {
      artist: 'Siouxsie and the Banshees',
      year: '1977',
      note: 'May 19 — third ever show',
      wikiTitle: 'Siouxsie_and_the_Banshees',
    },
    {
      artist: 'The Damned',
      year: '1976',
      note: 'Original punk four-piece',
      wikiTitle: 'The_Damned_(band)',
    },
    {
      artist: 'Elliott Smith',
      year: '1998',
      note: 'Either/Or UK tour',
      wikiTitle: 'Elliott_Smith',
    },
  ],
}
