import { db } from '@/lib/db'
import { venues, rewards, sponsors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import VenueEditor from './VenueEditor'
import VenueRewards from './VenueRewards'
import VenueStaff from './VenueStaff'
import type { Reward, Sponsor, StaffUser } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function VenuePage({ params }: { params: { id: string } }) {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, params.id),
    with: {
      rewards: { with: { sponsor: true } },
      staffUsers: true,
    },
  })

  if (!venue) notFound()

  const allSponsors = await db.query.sponsors.findMany()

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          {venue.name}
        </h1>
        <VenueEditor venue={venue} />
      </div>

      <hr className="border-smoke/30" />

      <VenueRewards
        venueId={venue.id}
        rewards={venue.rewards as (Reward & { sponsor: Sponsor })[]}
        sponsors={allSponsors}
      />

      <hr className="border-smoke/30" />

      <VenueStaff venueId={venue.id} staff={venue.staffUsers as StaffUser[]} />
    </div>
  )
}
