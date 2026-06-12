import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { routes, routeStops } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

type StopInput = {
  venue_id: string
  reward_id: string
  position: number
  audio_url?: string
  transcript?: string
  runtime_s?: number
  link_audio_url?: string
  is_free?: boolean
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const route = await db.query.routes.findFirst({ where: eq(routes.id, params.id) })
  if (!route) return NextResponse.json({ error: 'Route not found.' }, { status: 404 })

  if (route.status === 'live') {
    return NextResponse.json(
      { error: 'Cannot edit a live route. Set it back to draft first.' },
      { status: 409 },
    )
  }

  const body = (await request.json()) as { stops: StopInput[] }
  if (!Array.isArray(body.stops))
    return NextResponse.json({ error: 'stops must be an array.' }, { status: 400 })

  const inserted = await db.transaction(async (tx) => {
    await tx.delete(routeStops).where(eq(routeStops.route_id, params.id))
    if (body.stops.length === 0) return []
    return tx
      .insert(routeStops)
      .values(
        body.stops.map((s) => ({
          route_id: params.id,
          venue_id: s.venue_id,
          reward_id: s.reward_id,
          position: s.position,
          audio_url: s.audio_url ?? null,
          transcript: s.transcript ?? null,
          runtime_s: s.runtime_s ?? null,
          link_audio_url: s.link_audio_url ?? null,
          is_free: s.is_free ?? false,
        })),
      )
      .returning()
  })

  return NextResponse.json(inserted)
}
