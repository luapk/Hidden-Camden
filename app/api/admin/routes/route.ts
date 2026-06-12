import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routes } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const rows = await db.query.routes.findMany({
    with: { routeStops: { columns: { id: true } } },
  })

  return NextResponse.json(
    rows.map((r) => ({ ...r, stopCount: r.routeStops.length, routeStops: undefined })),
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = (await request.json()) as { name?: string; paywall_after_stop?: number }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  const [route] = await db
    .insert(routes)
    .values({ name: body.name.trim(), paywall_after_stop: body.paywall_after_stop ?? 2 })
    .returning()

  return NextResponse.json(route, { status: 201 })
}
