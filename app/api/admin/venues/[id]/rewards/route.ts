import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rewards, sponsors, venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import { isValidTime, isValidDailyCap } from '@/lib/staff/validation'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const rows = await db.query.rewards.findMany({
    where: eq(rewards.venue_id, params.id),
    with: { sponsor: true },
  })
  return NextResponse.json(rows)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const venue = await db.query.venues.findFirst({ where: eq(venues.id, params.id) })
  if (!venue) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })

  const body = (await request.json()) as {
    sku_label?: string
    sponsor_id?: string
    window_start?: string
    window_end?: string
    days_mask?: number
    daily_cap?: number
    unit_cost_pence?: number
    expiry_days?: number
  }

  if (!body.sku_label?.trim())
    return NextResponse.json({ error: 'sku_label is required.' }, { status: 400 })
  if (!body.sponsor_id)
    return NextResponse.json({ error: 'sponsor_id is required.' }, { status: 400 })

  const sponsor = await db.query.sponsors.findFirst({ where: eq(sponsors.id, body.sponsor_id) })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found.' }, { status: 400 })

  if (!isValidTime(body.window_start ?? ''))
    return NextResponse.json({ error: 'window_start must be HH:MM.' }, { status: 400 })
  if (!isValidTime(body.window_end ?? ''))
    return NextResponse.json({ error: 'window_end must be HH:MM.' }, { status: 400 })

  const days_mask = body.days_mask ?? 0
  if (!Number.isInteger(days_mask) || days_mask < 1 || days_mask > 127)
    return NextResponse.json({ error: 'days_mask must be 1–127.' }, { status: 400 })

  if (!isValidDailyCap(String(body.daily_cap)))
    return NextResponse.json({ error: 'daily_cap must be a positive integer.' }, { status: 400 })
  if (!body.unit_cost_pence || body.unit_cost_pence < 1)
    return NextResponse.json({ error: 'unit_cost_pence must be a positive integer.' }, { status: 400 })

  const [reward] = await db
    .insert(rewards)
    .values({
      venue_id: params.id,
      sponsor_id: body.sponsor_id,
      sku_label: body.sku_label,
      window_start: body.window_start!,
      window_end: body.window_end!,
      days_mask,
      daily_cap: body.daily_cap!,
      unit_cost_pence: body.unit_cost_pence,
      expiry_days: body.expiry_days ?? 7,
    })
    .returning()

  return NextResponse.json(reward, { status: 201 })
}
