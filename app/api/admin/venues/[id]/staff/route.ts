import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { staffUsers, venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const rows = await db.query.staffUsers.findMany({ where: eq(staffUsers.venue_id, params.id) })
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

  const body = (await request.json()) as { email?: string; role?: string }

  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })

  const email = body.email.toLowerCase().trim()
  const role = (body.role === 'manager' ? 'manager' : 'bar') as 'manager' | 'bar'

  // Check if this email belongs to another venue
  const existing = await db.query.staffUsers.findFirst({ where: eq(staffUsers.email, email) })
  if (existing && existing.venue_id !== params.id) {
    return NextResponse.json(
      { error: 'This email is already a staff member at another venue.' },
      { status: 409 },
    )
  }

  let staffUser
  if (existing) {
    ;[staffUser] = await db
      .update(staffUsers)
      .set({ role, venue_id: params.id })
      .where(eq(staffUsers.email, email))
      .returning()
  } else {
    ;[staffUser] = await db
      .insert(staffUsers)
      .values({ venue_id: params.id, email, role })
      .returning()
  }

  const magicLinkUrl = `/api/auth/signin/email?email=${encodeURIComponent(email)}`
  return NextResponse.json({ ...staffUser, magicLinkUrl }, { status: 201 })
}
