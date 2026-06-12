import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redemptions, vouchers, venues } from '@/lib/db/schema'

export type TearResult =
  | { ok: true; tornAt: Date }
  | { ok: false; status: number; message: string }

export async function tearRedemption(
  redemptionId: string,
  staffUserId?: string,
  venuePin?: string,
): Promise<TearResult> {
  // 1. Load redemption + voucher + venue in a transaction so we can update atomically
  return await db.transaction(async (tx) => {
    const redemptionRow = await tx.query.redemptions.findFirst({
      where: eq(redemptions.id, redemptionId),
      with: {
        voucher: true,
        venue: true,
      },
    })

    if (!redemptionRow) {
      return { ok: false, status: 404, message: 'Redemption not found.' }
    }

    const venue = redemptionRow.venue

    // 2. Idempotency: already torn → return success without re-billing
    if (redemptionRow.torn_at !== null) {
      return { ok: true, tornAt: redemptionRow.torn_at }
    }

    // 3. Code must not be expired
    const now = new Date()
    if (redemptionRow.code_expires_at < now) {
      return {
        ok: false,
        status: 410,
        message: 'This code has expired. Ask the customer to generate a new one.',
      }
    }

    // 4. Staff PIN check (if required by venue)
    if (venue.staff_pin_required) {
      if (!venuePin) {
        return {
          ok: false,
          status: 403,
          message: 'A staff PIN is required to tear this voucher.',
        }
      }
      if (venuePin !== venue.staff_pin) {
        return {
          ok: false,
          status: 403,
          message: 'Incorrect staff PIN.',
        }
      }
    }

    // 5. Tear: set torn_at, torn_by, billed = true
    const tornAt = now
    await tx
      .update(redemptions)
      .set({
        torn_at: tornAt,
        torn_by: staffUserId ?? null,
        billed: true,
      })
      .where(
        and(
          eq(redemptions.id, redemptionId),
          isNull(redemptions.torn_at), // guard against race condition
        ),
      )

    // 6. Flip voucher to redeemed
    await tx
      .update(vouchers)
      .set({ status: 'redeemed' })
      .where(eq(vouchers.id, redemptionRow.voucher_id))

    return { ok: true, tornAt }
  })
}
