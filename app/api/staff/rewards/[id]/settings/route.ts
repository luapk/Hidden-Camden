import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rewards } from '@/lib/db/schema'
import { requireManager } from '@/lib/staff/auth'
import { isValidDailyCap, isValidTime } from '@/lib/staff/validation'

interface SettingsBody {
  windowStart: string
  windowEnd: string
  dailyCap: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  let body: SettingsBody
  try {
    body = (await request.json()) as SettingsBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!isValidTime(body.windowStart) || !isValidTime(body.windowEnd)) {
    return NextResponse.json(
      { error: 'Window times must be HH:MM, 24 hour clock.' },
      { status: 400 },
    )
  }

  if (!isValidDailyCap(body.dailyCap)) {
    return NextResponse.json(
      { error: 'Daily cap must be a whole number above zero.' },
      { status: 400 },
    )
  }

  const auth = await requireManager({ rewardId: params.id })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  await db
    .update(rewards)
    .set({
      window_start: body.windowStart,
      window_end: body.windowEnd,
      daily_cap: body.dailyCap,
    })
    .where(eq(rewards.id, params.id))

  return NextResponse.json(
    {
      windowStart: body.windowStart,
      windowEnd: body.windowEnd,
      dailyCap: body.dailyCap,
    },
    { status: 200 },
  )
}
