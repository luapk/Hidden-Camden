import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const rows = await db.query.venues.findMany({
    with: { rewards: { columns: { id: true } } },
    orderBy: [desc(venues.created_at)],
  })

  return NextResponse.json(
    rows.map((v) => ({ ...v, rewardsCount: v.rewards.length, rewards: undefined })),
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = (await request.json()) as {
    name?: string
    slug?: string
    address?: string
    lat?: number
    lng?: number
    geofence_radius_m?: number
    status?: string
  }

  const { name, slug, address, lat, lng, geofence_radius_m = 40, status = 'draft' } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required.' }, { status: 400 })
  if (!address?.trim()) return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return NextResponse.json({ error: 'lat and lng must be numbers.' }, { status: 400 })
  if (geofence_radius_m < 25 || geofence_radius_m > 80)
    return NextResponse.json({ error: 'Geofence radius must be 25–80m.' }, { status: 400 })

  const [venue] = await db
    .insert(venues)
    .values({ name, slug, address, lat, lng, geofence_radius_m, status: status as 'draft' | 'live' | 'paused' })
    .returning()

  return NextResponse.json(venue, { status: 201 })
}
