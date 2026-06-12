import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = (await request.json()) as { days?: number }
  const days = body.days
  if (!Number.isInteger(days) || (days as number) < 1 || (days as number) > 30)
    return NextResponse.json({ error: 'days must be an integer between 1 and 30.' }, { status: 400 })

  const existing = await db.query.vouchers.findFirst({ where: eq(vouchers.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Voucher not found.' }, { status: 404 })

  const newExpiry = new Date(existing.expires_at.getTime() + (days as number) * 86_400_000)

  const [updated] = await db
    .update(vouchers)
    .set({ expires_at: newExpiry })
    .where(eq(vouchers.id, params.id))
    .returning()

  return NextResponse.json(updated)
}
