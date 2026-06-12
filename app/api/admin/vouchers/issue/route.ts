import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers, rewards, routeStops } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = (await request.json()) as {
    user_id?: string
    reward_id?: string
    route_stop_id?: string
  }

  if (!body.user_id?.trim())
    return NextResponse.json({ error: 'user_id is required.' }, { status: 400 })
  if (!body.reward_id)
    return NextResponse.json({ error: 'reward_id is required.' }, { status: 400 })
  if (!body.route_stop_id)
    return NextResponse.json({ error: 'route_stop_id is required.' }, { status: 400 })

  const reward = await db.query.rewards.findFirst({ where: eq(rewards.id, body.reward_id) })
  if (!reward) return NextResponse.json({ error: 'Reward not found.' }, { status: 404 })

  const stop = await db.query.routeStops.findFirst({
    where: eq(routeStops.id, body.route_stop_id),
  })
  if (!stop) return NextResponse.json({ error: 'Route stop not found.' }, { status: 404 })

  const expiresAt = new Date(Date.now() + reward.expiry_days * 86_400_000)

  const [voucher] = await db
    .insert(vouchers)
    .values({
      user_id: body.user_id,
      reward_id: body.reward_id,
      route_stop_id: body.route_stop_id,
      expires_at: expiresAt,
      status: 'banked',
      device_hash: 'admin-issued',
    })
    .returning()

  return NextResponse.json(voucher, { status: 201 })
}
