import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { staffUsers, venues } from '@/lib/db/schema'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'

const bodySchema = z.object({
  email: z.string().email(),
  venueSlug: z.string(),
  role: z.enum(['manager', 'bar']).default('manager'),
})

export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const parse = bodySchema.safeParse(await req.json())
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
  }

  const { email, venueSlug, role } = parse.data

  const venue = await db.query.venues.findFirst({
    where: eq(venues.slug, venueSlug),
  })
  if (!venue) {
    return NextResponse.json({ error: `Venue "${venueSlug}" not found.` }, { status: 404 })
  }

  const [user] = await db
    .insert(staffUsers)
    .values({ email, venue_id: venue.id, role })
    .onConflictDoUpdate({
      target: staffUsers.email,
      set: { venue_id: venue.id, role },
    })
    .returning()

  return NextResponse.json({ ok: true, staffUser: user })
}

export async function GET() {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const users = await db.query.staffUsers.findMany({
    with: { venue: true },
    orderBy: (t, { asc }) => [asc(t.email)],
  })
  return NextResponse.json(users)
}
