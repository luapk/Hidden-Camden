import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { routes, routeStops, routeVersions } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import { validateRouteForPublish, type PublishStopInput } from '@/lib/admin/publish'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const route = await db.query.routes.findFirst({
    where: eq(routes.id, params.id),
    with: {
      routeStops: {
        orderBy: [asc(routeStops.position)],
        with: { venue: true, reward: true },
      },
    },
  })

  if (!route) return NextResponse.json({ error: 'Route not found.' }, { status: 404 })

  if (route.routeStops.length === 0) {
    return NextResponse.json({ errors: ['Route has no stops.'], warnings: [] }, { status: 422 })
  }

  const stopInputs: PublishStopInput[] = route.routeStops.map((s) => ({
    position: s.position,
    audio_url: s.audio_url,
    transcript: s.transcript,
    venue: {
      lat: s.venue.lat,
      lng: s.venue.lng,
      geofence_radius_m: s.venue.geofence_radius_m,
      status: s.venue.status,
    },
    reward: { kill_switch: s.reward.kill_switch },
  }))

  const validation = validateRouteForPublish(stopInputs)
  if (!validation.valid) {
    return NextResponse.json(
      { errors: validation.errors, warnings: validation.warnings },
      { status: 422 },
    )
  }

  await db.transaction(async (tx) => {
    await tx.insert(routeVersions).values({
      route_id: params.id,
      paywall_after_stop: route.paywall_after_stop,
      stops_snapshot: JSON.stringify(route.routeStops),
    })
    await tx.update(routes).set({ status: 'live' }).where(eq(routes.id, params.id))
  })

  return NextResponse.json({ warnings: validation.warnings })
}
