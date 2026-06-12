import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rewards, vouchers } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import { isValidTime, isValidDailyCap } from '@/lib/staff/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const existing = await db.query.rewards.findFirst({ where: eq(rewards.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Reward not found.' }, { status: 404 })

  const body = (await request.json()) as Partial<typeof existing>

  if (body.window_start !== undefined && !isValidTime(body.window_start))
    return NextResponse.json({ error: 'window_start must be HH:MM.' }, { status: 400 })
  if (body.window_end !== undefined && !isValidTime(body.window_end))
    return NextResponse.json({ error: 'window_end must be HH:MM.' }, { status: 400 })
  if (body.daily_cap !== undefined && !isValidDailyCap(String(body.daily_cap)))
    return NextResponse.json({ error: 'daily_cap must be a positive integer.' }, { status: 400 })
  if (body.days_mask !== undefined && (body.days_mask < 1 || body.days_mask > 127))
    return NextResponse.json({ error: 'days_mask must be 1–127.' }, { status: 400 })
  if (body.unit_cost_pence !== undefined && body.unit_cost_pence < 1)
    return NextResponse.json({ error: 'unit_cost_pence must be positive.' }, { status: 400 })

  const allowed = ['sku_label', 'window_start', 'window_end', 'days_mask', 'daily_cap', 'unit_cost_pence', 'kill_switch', 'expiry_days'] as const
  const updates: Partial<typeof existing> = {}
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key]
  }

  const [updated] = await db.update(rewards).set(updates).where(eq(rewards.id, params.id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const existing = await db.query.rewards.findFirst({ where: eq(rewards.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Reward not found.' }, { status: 404 })

  const active = await db.query.vouchers.findFirst({
    where: and(
      eq(vouchers.reward_id, params.id),
      inArray(vouchers.status, ['banked', 'redeemed']),
    ),
  })

  if (active) {
    return NextResponse.json(
      { error: 'Vouchers exist for this reward. Revoke them before deleting.' },
      { status: 409 },
    )
  }

  await db.delete(rewards).where(eq(rewards.id, params.id))
  return NextResponse.json({ ok: true })
}
