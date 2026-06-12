import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sponsors } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const rows = await db.query.sponsors.findMany()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = (await request.json()) as { name?: string; billing_ref?: string }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!body.billing_ref?.trim())
    return NextResponse.json({ error: 'billing_ref is required.' }, { status: 400 })

  const [sponsor] = await db
    .insert(sponsors)
    .values({ name: body.name.trim(), billing_ref: body.billing_ref.trim() })
    .returning()

  return NextResponse.json(sponsor, { status: 201 })
}
