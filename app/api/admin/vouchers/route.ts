import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers, rewards, venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const venueId = searchParams.get('venueId')
  const status = searchParams.get('status')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const conditions: SQL<unknown>[] = []
  if (userId) conditions.push(eq(vouchers.user_id, userId))
  if (venueId) conditions.push(eq(rewards.venue_id, venueId))
  if (status) conditions.push(eq(vouchers.status, status as 'banked' | 'redeemed' | 'expired' | 'revoked'))
  if (dateFrom) conditions.push(gte(vouchers.issued_at, new Date(dateFrom)))
  if (dateTo) conditions.push(lte(vouchers.issued_at, new Date(dateTo)))

  const rows = await db
    .select({
      id: vouchers.id,
      user_id: vouchers.user_id,
      status: vouchers.status,
      issued_at: vouchers.issued_at,
      expires_at: vouchers.expires_at,
      sku_label: rewards.sku_label,
      venue_name: venues.name,
      venue_id: venues.id,
    })
    .from(vouchers)
    .innerJoin(rewards, eq(vouchers.reward_id, rewards.id))
    .innerJoin(venues, eq(rewards.venue_id, venues.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(vouchers.issued_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json(rows)
}
