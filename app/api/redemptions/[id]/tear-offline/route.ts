import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redemptions, vouchers } from '@/lib/db/schema'

interface OfflineTearBody {
  voucherId: string
  code: string
  deviceTimestamp: string // ISO 8601
  hmac: string
}

/**
 * Compute HMAC-SHA-256 with the given key and data.
 * Uses the Web Crypto API available in Node 18+ and edge runtimes.
 */
async function computeHmac(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return Buffer.from(signature).toString('hex')
}

/**
 * Offline tear: client queues a signed payload while offline, syncs when connected.
 * Server verifies HMAC(key=code, data=voucherId+deviceTimestamp) and checks the
 * code was valid at deviceTimestamp (i.e. within the 60s window from code_issued_at).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: OfflineTearBody
  try {
    body = (await request.json()) as OfflineTearBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { voucherId, code, deviceTimestamp, hmac } = body

  if (!voucherId || !code || !deviceTimestamp || !hmac) {
    return NextResponse.json(
      { error: 'voucherId, code, deviceTimestamp, and hmac are required.' },
      { status: 400 },
    )
  }

  const redemptionId = params.id

  // 1. Load the redemption
  const redemptionRow = await db.query.redemptions.findFirst({
    where: eq(redemptions.id, redemptionId),
  })

  if (!redemptionRow) {
    return NextResponse.json({ error: 'Redemption not found.' }, { status: 404 })
  }

  // 2. Idempotency
  if (redemptionRow.torn_at !== null) {
    return NextResponse.json({ tornAt: redemptionRow.torn_at.toISOString() }, { status: 200 })
  }

  // 3. Verify the code matches
  if (redemptionRow.code !== code) {
    return NextResponse.json({ error: 'Code mismatch.' }, { status: 403 })
  }

  // 4. Verify HMAC(key=code, data=voucherId+deviceTimestamp)
  const expectedHmac = await computeHmac(code, voucherId + deviceTimestamp)
  if (expectedHmac !== hmac) {
    return NextResponse.json({ error: 'HMAC verification failed.' }, { status: 403 })
  }

  // 5. Verify the code was valid at deviceTimestamp
  const deviceTime = new Date(deviceTimestamp)
  if (isNaN(deviceTime.getTime())) {
    return NextResponse.json({ error: 'Invalid deviceTimestamp.' }, { status: 400 })
  }

  if (
    deviceTime < redemptionRow.code_issued_at ||
    deviceTime > redemptionRow.code_expires_at
  ) {
    return NextResponse.json(
      { error: 'Code was not valid at the time of the offline tear.' },
      { status: 410 },
    )
  }

  // 6. Apply the tear
  const tornAt = new Date()
  await db.transaction(async (tx) => {
    await tx
      .update(redemptions)
      .set({
        torn_at: tornAt,
        torn_by: session.user!.email ?? null,
        billed: true,
      })
      .where(eq(redemptions.id, redemptionId))

    await tx
      .update(vouchers)
      .set({ status: 'redeemed' })
      .where(eq(vouchers.id, voucherId))
  })

  return NextResponse.json({ tornAt: tornAt.toISOString() }, { status: 200 })
}
