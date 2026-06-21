/**
 * Seeds the launch route (7 stops) based on camden-crawl-audio-scripts.md.
 * Run with: pnpm db:seed
 */
import { db } from './index'
import { venues, sponsors, rewards, routes, routeStops } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Sponsor: Diageo (Guinness)
  const [diageo] = await db
    .insert(sponsors)
    .values({
      name: 'Diageo',
      billing_ref: 'DIAGEO-CAMDEN-2024',
    })
    .returning()

  if (!diageo) throw new Error('Failed to insert sponsor')

  // Seven Camden venues (approximate coordinates)
  const venueData = [
    {
      name: 'The Dublin Castle',
      slug: 'dublin-castle',
      lat: 51.5394,
      lng: -0.1477,
      address: '94 Parkway, Camden Town, London NW1 7AN',
    },
    {
      name: 'The Monarch',
      slug: 'the-monarch',
      lat: 51.5401,
      lng: -0.1484,
      address: '49 Chalk Farm Rd, London NW1 8AN',
    },
    {
      name: 'Electric Ballroom',
      slug: 'electric-ballroom',
      lat: 51.5392,
      lng: -0.1432,
      address: '184 Camden High St, London NW1 8QP',
    },
    {
      name: 'The Jazz Cafe',
      slug: 'jazz-cafe',
      lat: 51.5388,
      lng: -0.1435,
      address: '5 Parkway, Camden Town, London NW1 7PG',
    },
    {
      name: 'KOKO',
      slug: 'koko',
      lat: 51.5358,
      lng: -0.1387,
      address: '1A Camden High St, London NW1 7JE',
    },
    {
      name: 'The Roundhouse',
      slug: 'roundhouse',
      lat: 51.5429,
      lng: -0.1516,
      address: 'Chalk Farm Rd, London NW1 8EH',
    },
    {
      name: 'Dingwalls',
      slug: 'dingwalls',
      lat: 51.5416,
      lng: -0.1467,
      address: 'Middle Yard, Camden Lock, London NW1 8AB',
    },
  ]

  const insertedVenues = await db
    .insert(venues)
    .values(
      venueData.map((v) => ({
        ...v,
        status: 'live' as const,
        geofence_radius_m: 40,
      })),
    )
    .returning()

  // One Guinness reward per venue
  const rewardValues = insertedVenues.map((v) => ({
    venue_id: v.id,
    sponsor_id: diageo.id,
    sku_label: 'Pint of Guinness',
    window_start: '17:00',
    window_end: '23:00',
    // Mon–Sat = 1+2+4+8+16+32 = 63
    days_mask: 63,
    daily_cap: 50,
    unit_cost_pence: 650,
  }))

  const insertedRewards = await db
    .insert(rewards)
    .values(rewardValues)
    .returning()

  // Route
  const [route] = await db
    .insert(routes)
    .values({
      name: 'Hidden Camden Launch Route',
      status: 'live',
      paywall_after_stop: 2,
    })
    .returning()

  if (!route) throw new Error('Failed to insert route')

  // Route stops — each stop gets the reward that belongs to its venue
  const rewardByVenue = Object.fromEntries(insertedRewards.map((r) => [r.venue_id, r.id]))
  const stopValues = insertedVenues.map((v, i) => ({
    route_id: route.id,
    venue_id: v.id,
    reward_id: rewardByVenue[v.id]!,
    position: i + 1,
    is_free: i < 2, // stops 1 and 2 are free
  }))

  await db.insert(routeStops).values(stopValues)

  console.log(`Seeded: ${insertedVenues.length} venues, ${insertedRewards.length} rewards, 1 route with ${stopValues.length} stops`)
  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
