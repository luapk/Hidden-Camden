import { and, eq, gt, sql, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers, rewards, venues, redemptions, redemptionDenials } from '@/lib/db/schema'
import { isWithinGeofence } from '@/lib/geo'
import { isWithinRedemptionWindow } from './windows'
import { mintCode as generateCode } from './codeAlphabet'

export type MintResult =
  | { ok: true; redemptionId: string; code: string; codeExpiresAt: Date }
  | { ok: false; status: number; message: string }

const RATE_LIMIT_CODES_PER_HOUR = 5
const CODE_TTL_SECONDS = 60

async function logDenial(
  voucherId: string | null,
  userId: string,
  reason: string,
  lat: number | null,
  lng: number | null,
  deviceHash: string | null,
): Promise<void> {
  await db.insert(redemptionDenials).values({
    voucher_id: voucherId ?? undefined,
    user_id: userId,
    reason,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    device_hash: deviceHash ?? undefined,
  })
}

export async function mintRedemptionCode(
  voucherId: string,
  userId: string,
  lat: number,
  lng: number,
  deviceHash: string,
): Promise<MintResult> {
  // 1. Load voucher + reward + venue
  const voucherRow = await db.query.vouchers.findFirst({
    where: eq(vouchers.id, voucherId),
    with: {
      reward: {
        with: {
          venue: true,
        },
      },
    },
  })

  if (!voucherRow) {
    return { ok: false, status: 404, message: 'Voucher not found.' }
  }

  // Ensure voucher belongs to this user
  if (voucherRow.user_id !== userId) {
    return { ok: false, status: 403, message: 'This voucher does not belong to you.' }
  }

  const reward = voucherRow.reward
  const venue = reward.venue

  // 2a. Voucher must be banked
  if (voucherRow.status !== 'banked') {
    const reason = `voucher_status_${voucherRow.status}`
    await logDenial(voucherId, userId, reason, lat, lng, deviceHash)
    if (voucherRow.status === 'expired') {
      return {
        ok: false,
        status: 410,
        message: "This one's expired. The tour bank keeps drinks for 7 days.",
      }
    }
    return { ok: false, status: 403, message: 'This voucher cannot be redeemed.' }
  }

  // 2b. Not expired
  const now = new Date()
  if (voucherRow.expires_at < now) {
    await logDenial(voucherId, userId, 'voucher_expired', lat, lng, deviceHash)
    return {
      ok: false,
      status: 410,
      message: "This one's expired. The tour bank keeps drinks for 7 days.",
    }
  }

  // 2c. Window + days_mask
  if (
    !isWithinRedemptionWindow(now, reward.window_start, reward.window_end, reward.days_mask)
  ) {
    await logDenial(voucherId, userId, 'outside_window', lat, lng, deviceHash)
    return {
      ok: false,
      status: 403,
      message: `This drink is only available during the redemption window. Check back during opening hours.`,
    }
  }

  // 2d. Kill switch
  if (reward.kill_switch) {
    await logDenial(voucherId, userId, 'kill_switch', lat, lng, deviceHash)
    return {
      ok: false,
      status: 403,
      message: 'Redemptions are currently paused at this venue. Try again shortly.',
    }
  }

  // 2e. Daily cap
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)

  const [capResult] = await db
    .select({ cnt: count() })
    .from(redemptions)
    .innerJoin(vouchers, eq(redemptions.voucher_id, vouchers.id))
    .where(
      and(
        eq(vouchers.reward_id, reward.id),
        gt(redemptions.torn_at, todayStart),
        sql`${redemptions.torn_at} IS NOT NULL`,
      ),
    )

  const todayTorn = capResult?.cnt ?? 0
  if (todayTorn >= reward.daily_cap) {
    await logDenial(voucherId, userId, 'daily_cap_reached', lat, lng, deviceHash)
    return {
      ok: false,
      status: 429,
      message: "Today's allocation for this drink has been claimed. Check back tomorrow.",
    }
  }

  // 2f. Geofence check
  const inFence = isWithinGeofence(
    { lat, lng },
    { lat: venue.lat, lng: venue.lng },
    venue.geofence_radius_m,
  )
  if (!inFence) {
    await logDenial(voucherId, userId, 'outside_geofence', lat, lng, deviceHash)
    return {
      ok: false,
      status: 403,
      message: 'You need to be at the venue to redeem this drink.',
    }
  }

  // 3. Rate limit: max RATE_LIMIT_CODES_PER_HOUR codes per voucher per hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const [rateResult] = await db
    .select({ cnt: count() })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.voucher_id, voucherId),
        gt(redemptions.code_issued_at, oneHourAgo),
      ),
    )

  const codesThisHour = rateResult?.cnt ?? 0
  if (codesThisHour >= RATE_LIMIT_CODES_PER_HOUR) {
    await logDenial(voucherId, userId, 'rate_limit', lat, lng, deviceHash)
    return {
      ok: false,
      status: 429,
      message: 'Too many code requests. Wait a moment and try again.',
    }
  }

  // 4. Mint code
  const code = generateCode()
  const codeIssuedAt = now
  const codeExpiresAt = new Date(now.getTime() + CODE_TTL_SECONDS * 1000)

  const [inserted] = await db
    .insert(redemptions)
    .values({
      voucher_id: voucherId,
      code,
      code_issued_at: codeIssuedAt,
      code_expires_at: codeExpiresAt,
      venue_id: venue.id,
      lat,
      lng,
      in_geofence: true,
    })
    .returning({ id: redemptions.id })

  return {
    ok: true,
    redemptionId: inserted.id,
    code,
    codeExpiresAt,
  }
}
