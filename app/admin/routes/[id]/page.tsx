import { db } from '@/lib/db'
import { routes, routeStops, venues } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import RouteBuilder from './RouteBuilder'

export const dynamic = 'force-dynamic'

export default async function RoutePage({ params }: { params: { id: string } }) {
  const [route, allVenues, stops] = await Promise.all([
    db.query.routes.findFirst({ where: eq(routes.id, params.id) }),
    db.query.venues.findMany(),
    db.query.routeStops.findMany({
      where: eq(routeStops.route_id, params.id),
      orderBy: [asc(routeStops.position)],
      with: { venue: true, reward: { with: { sponsor: true } } },
    }),
  ])

  if (!route) notFound()

  return (
    <div className="max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {route.name}
      </h1>
      <RouteBuilder route={route} venues={allVenues} initialStops={stops as unknown as Parameters<typeof RouteBuilder>[0]['initialStops']} />
    </div>
  )
}
