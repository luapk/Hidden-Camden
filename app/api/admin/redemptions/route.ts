import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, gte, isNotNull, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redemptions, vouchers, rewards, sponsors, venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const { searchParams } = new URL(request.url)
  const venueId = searchParams.get('venueId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const conditions: SQL<unknown>[] = [isNotNull(redemptions.torn_at)]
  if (venueId) conditions.push(eq(redemptions.venue_id, venueId))
  if (dateFrom) conditions.push(gte(redemptions.torn_at, new Date(dateFrom)))
  if (dateTo) conditions.push(lte(redemptions.torn_at, new Date(dateTo)))

  const rows = await db
    .select({
      id: redemptions.id,
      torn_at: redemptions.torn_at,
      code: redemptions.code,
      billed: redemptions.billed,
      in_geofence: redemptions.in_geofence,
      venue_name: venues.name,
      sku_label: rewards.sku_label,
      sponsor_name: sponsors.name,
    })
    .from(redemptions)
    .innerJoin(venues, eq(redemptions.venue_id, venues.id))
    .innerJoin(vouchers, eq(redemptions.voucher_id, vouchers.id))
    .innerJoin(rewards, eq(vouchers.reward_id, rewards.id))
    .innerJoin(sponsors, eq(rewards.sponsor_id, sponsors.id))
    .where(and(...conditions))
    .orderBy(desc(redemptions.torn_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json(rows)
}
