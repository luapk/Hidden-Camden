import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { tearRedemption } from '@/lib/vouchers/tearRedemption'

interface TearRequestBody {
  venuePin?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: TearRequestBody = {}
  try {
    body = (await request.json()) as TearRequestBody
  } catch {
    // Body is optional for tear — continue without it
  }

  const redemptionId = params.id
  const staffUserId = session.user.email
  const venuePin = body.venuePin

  const result = await tearRedemption(redemptionId, staffUserId, venuePin)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return NextResponse.json({ tornAt: result.tornAt.toISOString() }, { status: 200 })
}
