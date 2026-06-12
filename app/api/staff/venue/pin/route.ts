import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { requireManager } from '@/lib/staff/auth'
import { isValidPin } from '@/lib/staff/validation'

interface PinBody {
  required: boolean
  pin?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: PinBody
  try {
    body = (await request.json()) as PinBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof body.required !== 'boolean') {
    return NextResponse.json(
      { error: 'required must be true or false.' },
      { status: 400 },
    )
  }

  if (body.required && !isValidPin(body.pin)) {
    return NextResponse.json(
      { error: 'PIN must be exactly 4 digits.' },
      { status: 400 },
    )
  }

  const auth = await requireManager()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  // Managers can only ever modify their own venue.
  await db
    .update(venues)
    .set(
      body.required
        ? { staff_pin_required: true, staff_pin: body.pin }
        : { staff_pin_required: false },
    )
    .where(eq(venues.id, auth.staffUser.venue_id))

  return NextResponse.json({ required: body.required }, { status: 200 })
}
