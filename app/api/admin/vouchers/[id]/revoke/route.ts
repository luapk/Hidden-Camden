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

  const body = (await request.json()) as { reason?: string }
  if (!body.reason?.trim())
    return NextResponse.json({ error: 'Reason is required.' }, { status: 400 })

  const existing = await db.query.vouchers.findFirst({ where: eq(vouchers.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Voucher not found.' }, { status: 404 })

  const [updated] = await db
    .update(vouchers)
    .set({ status: 'revoked' })
    .where(eq(vouchers.id, params.id))
    .returning()

  return NextResponse.json(updated)
}
