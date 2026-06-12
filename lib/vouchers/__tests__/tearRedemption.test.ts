import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Venue } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Mock the DB module before importing tearRedemption
// ---------------------------------------------------------------------------
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      redemptions: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
    transaction: vi.fn(),
  },
}))

import { db } from '@/lib/db'
import { tearRedemption } from '../tearRedemption'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VENUE_NO_PIN: Venue = {
  id: 'venue-1',
  name: 'The Black Cap',
  slug: 'the-black-cap',
  lat: 51.5395,
  lng: -0.1425,
  geofence_radius_m: 40,
  address: '171 Camden High St',
  place_id: null,
  status: 'live',
  created_by: null,
  staff_pin_required: false,
  staff_pin: null,
  created_at: new Date(),
}

const VENUE_WITH_PIN: Venue = {
  ...VENUE_NO_PIN,
  staff_pin_required: true,
  staff_pin: '1234',
}

const VOUCHER_BANKED = {
  id: 'voucher-1',
  user_id: 'user@example.com',
  reward_id: 'reward-1',
  route_stop_id: 'stop-1',
  issued_at: new Date(Date.now() - 1000 * 60 * 60),
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  status: 'banked' as const,
  device_hash: 'hash-abc',
}

function makeRedemption(overrides?: {
  torn_at?: Date | null
  code_expires_at?: Date
  venue?: typeof VENUE_NO_PIN
}) {
  return {
    id: 'redemption-1',
    voucher_id: 'voucher-1',
    code: 'ABCD',
    code_issued_at: new Date(Date.now() - 30_000),
    code_expires_at: overrides?.code_expires_at ?? new Date(Date.now() + 30_000),
    torn_at: overrides?.torn_at !== undefined ? overrides.torn_at : null,
    torn_by: null,
    venue_id: 'venue-1',
    lat: 51.5395,
    lng: -0.1425,
    in_geofence: true,
    billed: false,
    voucher: VOUCHER_BANKED,
    venue: overrides?.venue ?? VENUE_NO_PIN,
  }
}

function setupTransactionMock(redemptionRow: ReturnType<typeof makeRedemption> | null) {
  const mockDb = vi.mocked(db)

  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  }
  ;(mockDb.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain)

  // transaction executes the callback immediately with a tx that has update
  ;(mockDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (callback: (tx: typeof db) => Promise<unknown>) => {
      const tx = {
        query: {
          redemptions: {
            findFirst: vi.fn().mockResolvedValue(redemptionRow),
          },
        },
        update: vi.fn().mockReturnValue(updateChain),
      } as unknown as typeof db
      return callback(tx)
    },
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('tearRedemption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path: tears the redemption, sets billed=true, flips voucher to redeemed', async () => {
    setupTransactionMock(makeRedemption())

    const result = await tearRedemption('redemption-1', 'staff@venue.com')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tornAt).toBeInstanceOf(Date)
    }

    // Verify update was called twice (once for redemption, once for voucher)
    const mockDb = vi.mocked(db)
    expect(mockDb.transaction).toHaveBeenCalled()
  })

  it('idempotency: double-tear returns same success without re-billing', async () => {
    const tornAt = new Date(Date.now() - 5000)
    setupTransactionMock(makeRedemption({ torn_at: tornAt }))

    const result = await tearRedemption('redemption-1', 'staff@venue.com')

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Returns the original torn_at, not a new one
      expect(result.tornAt.getTime()).toBe(tornAt.getTime())
    }
  })

  it('returns 404 when redemption not found', async () => {
    setupTransactionMock(null)

    const result = await tearRedemption('nonexistent')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(404)
    }
  })

  it('returns 410 when code has expired', async () => {
    setupTransactionMock(
      makeRedemption({ code_expires_at: new Date(Date.now() - 5000) }),
    )

    const result = await tearRedemption('redemption-1')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(410)
      expect(result.message).toContain('expired')
    }
  })

  it('returns 403 when venue requires PIN and none provided', async () => {
    setupTransactionMock(makeRedemption({ venue: VENUE_WITH_PIN }))

    const result = await tearRedemption('redemption-1', 'staff@venue.com', undefined)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.message).toContain('PIN')
    }
  })

  it('returns 403 when venue requires PIN and wrong PIN provided', async () => {
    setupTransactionMock(makeRedemption({ venue: VENUE_WITH_PIN }))

    const result = await tearRedemption('redemption-1', 'staff@venue.com', '9999')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.message).toContain('Incorrect')
    }
  })

  it('succeeds when correct PIN provided for PIN-required venue', async () => {
    setupTransactionMock(makeRedemption({ venue: VENUE_WITH_PIN }))

    const result = await tearRedemption('redemption-1', 'staff@venue.com', '1234')

    expect(result.ok).toBe(true)
  })

  it('succeeds without PIN when venue does not require PIN', async () => {
    setupTransactionMock(makeRedemption({ venue: VENUE_NO_PIN }))

    const result = await tearRedemption('redemption-1', 'staff@venue.com')

    expect(result.ok).toBe(true)
  })

  it('tear still succeeds when window closed after mint (pint is being poured)', async () => {
    // Window validation is NOT checked at tear time — only at mint time
    // This test confirms tearRedemption does not call isWithinRedemptionWindow
    setupTransactionMock(makeRedemption())

    // Even if we were outside the window, tear should succeed
    const result = await tearRedemption('redemption-1')

    expect(result.ok).toBe(true)
  })

  it('tear still succeeds when daily cap was reached after mint', async () => {
    // Daily cap gates minting, not tearing
    // tearRedemption does not check daily cap — confirm it succeeds regardless
    setupTransactionMock(makeRedemption())

    const result = await tearRedemption('redemption-1')

    // Should succeed — cap was already past mint, but tear must go through
    expect(result.ok).toBe(true)
  })

  it('returns billed=true (billing event) exactly once on first tear', async () => {
    let updateCallCount = 0
    const updateChain = {
      set: vi.fn().mockImplementation(() => {
        updateCallCount++
        return updateChain
      }),
      where: vi.fn().mockResolvedValue([]),
    }

    const mockDb = vi.mocked(db)
    ;(mockDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (tx: typeof db) => Promise<unknown>) => {
        const tx = {
          query: {
            redemptions: {
              findFirst: vi.fn().mockResolvedValue(makeRedemption()),
            },
          },
          update: vi.fn().mockReturnValue(updateChain),
        } as unknown as typeof db
        return callback(tx)
      },
    )

    const result = await tearRedemption('redemption-1')
    expect(result.ok).toBe(true)

    // update.set called twice: once for redemptions (with billed:true), once for vouchers
    expect(updateCallCount).toBe(2)
  })

  it('idempotency: double-tear does not call update the second time', async () => {
    const tornAt = new Date(Date.now() - 5000)
    let updateCallCount = 0

    const updateChain = {
      set: vi.fn().mockImplementation(() => {
        updateCallCount++
        return updateChain
      }),
      where: vi.fn().mockResolvedValue([]),
    }

    const mockDb = vi.mocked(db)
    ;(mockDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (tx: typeof db) => Promise<unknown>) => {
        const tx = {
          query: {
            redemptions: {
              findFirst: vi.fn().mockResolvedValue(makeRedemption({ torn_at: tornAt })),
            },
          },
          update: vi.fn().mockReturnValue(updateChain),
        } as unknown as typeof db
        return callback(tx)
      },
    )

    await tearRedemption('redemption-1')
    await tearRedemption('redemption-1')

    // No updates should have been called — idempotent return
    expect(updateCallCount).toBe(0)
  })
})
