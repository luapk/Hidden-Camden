import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, params.id),
    with: { rewards: { with: { sponsor: true } }, staffUsers: true },
  })

  if (!venue) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
  return NextResponse.json(venue)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const existing = await db.query.venues.findFirst({ where: eq(venues.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })

  const body = (await request.json()) as Partial<typeof existing>

  if (body.name !== undefined && !body.name?.trim())
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
  if (body.slug !== undefined && !body.slug?.trim())
    return NextResponse.json({ error: 'Slug cannot be empty.' }, { status: 400 })
  if (body.lat !== undefined && typeof body.lat !== 'number')
    return NextResponse.json({ error: 'lat must be a number.' }, { status: 400 })
  if (body.lng !== undefined && typeof body.lng !== 'number')
    return NextResponse.json({ error: 'lng must be a number.' }, { status: 400 })
  if (
    body.geofence_radius_m !== undefined &&
    (body.geofence_radius_m < 25 || body.geofence_radius_m > 80)
  )
    return NextResponse.json({ error: 'Geofence radius must be 25–80m.' }, { status: 400 })

  const allowed = ['name', 'slug', 'address', 'lat', 'lng', 'geofence_radius_m', 'status', 'staff_pin_required', 'staff_pin'] as const
  const updates: Partial<typeof existing> = {}
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key]
  }

  const [updated] = await db.update(venues).set(updates).where(eq(venues.id, params.id)).returning()
  return NextResponse.json(updated)
}
