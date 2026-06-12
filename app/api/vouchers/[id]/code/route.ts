import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { mintRedemptionCode } from '@/lib/vouchers/mintCode'

interface CodeRequestBody {
  lat: number
  lng: number
  deviceHash: string
  mockLocation?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: CodeRequestBody
  try {
    body = (await request.json()) as CodeRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { lat, lng, deviceHash, mockLocation } = body

  if (typeof lat !== 'number' || typeof lng !== 'number' || typeof deviceHash !== 'string') {
    return NextResponse.json({ error: 'lat, lng, and deviceHash are required.' }, { status: 400 })
  }

  // Reject mock/spoofed location
  if (mockLocation === true) {
    return NextResponse.json(
      { error: 'Location data is not reliable.' },
      { status: 403 },
    )
  }

  // Use the user's email as their userId (NextAuth default)
  const userId = session.user.email
  const voucherId = params.id

  const result = await mintRedemptionCode(voucherId, userId, lat, lng, deviceHash)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return NextResponse.json(
    {
      redemptionId: result.redemptionId,
      code: result.code,
      codeExpiresAt: result.codeExpiresAt.toISOString(),
    },
    { status: 200 },
  )
}
