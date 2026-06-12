import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { routes, routeStops } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const route = await db.query.routes.findFirst({
    where: eq(routes.id, params.id),
    with: {
      routeStops: {
        orderBy: [asc(routeStops.position)],
        with: { venue: true, reward: { with: { sponsor: true } } as { with: { sponsor: true } } },
      },
    },
  })

  if (!route) return NextResponse.json({ error: 'Route not found.' }, { status: 404 })
  return NextResponse.json(route)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const existing = await db.query.routes.findFirst({ where: eq(routes.id, params.id) })
  if (!existing) return NextResponse.json({ error: 'Route not found.' }, { status: 404 })

  const body = (await request.json()) as { name?: string; paywall_after_stop?: number }

  if (body.name !== undefined && !body.name.trim())
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })

  const updates: Partial<typeof existing> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.paywall_after_stop !== undefined) updates.paywall_after_stop = body.paywall_after_stop

  const [updated] = await db.update(routes).set(updates).where(eq(routes.id, params.id)).returning()
  return NextResponse.json(updated)
}
