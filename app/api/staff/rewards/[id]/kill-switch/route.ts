import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rewards } from '@/lib/db/schema'
import { requireManager } from '@/lib/staff/auth'

interface KillSwitchBody {
  on: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  let body: KillSwitchBody
  try {
    body = (await request.json()) as KillSwitchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof body.on !== 'boolean') {
    return NextResponse.json({ error: 'on must be true or false.' }, { status: 400 })
  }

  const auth = await requireManager({ rewardId: params.id })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  await db
    .update(rewards)
    .set({ kill_switch: body.on })
    .where(eq(rewards.id, params.id))

  return NextResponse.json({ killSwitch: body.on }, { status: 200 })
}
