import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MintResult } from '../mintCode'

// ---------------------------------------------------------------------------
// Mock the DB module before importing mintRedemptionCode
// ---------------------------------------------------------------------------
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      vouchers: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}))

// We also need to stub isWithinGeofence and isWithinRedemptionWindow
vi.mock('@/lib/geo', () => ({
  isWithinGeofence: vi.fn().mockReturnValue(true),
}))

vi.mock('../windows', () => ({
  isWithinRedemptionWindow: vi.fn().mockReturnValue(true),
}))

vi.mock('../codeAlphabet', () => ({
  mintCode: vi.fn().mockReturnValue('ABCD'),
  CODE_ALPHABET: 'ACDEFHJKMNPRTWXY',
  CODE_LENGTH: 4,
}))

import { db } from '@/lib/db'
import { isWithinGeofence } from '@/lib/geo'
import { isWithinRedemptionWindow } from '../windows'
import { mintRedemptionCode } from '../mintCode'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VENUE = {
  id: 'venue-1',
  name: 'The Black Cap',
  slug: 'the-black-cap',
  lat: 51.5395,
  lng: -0.1425,
  geofence_radius_m: 40,
  address: '171 Camden High St',
  place_id: null,
  status: 'live' as const,
  created_by: null,
  staff_pin_required: false,
  staff_pin: null,
  created_at: new Date(),
}

const SPONSOR = {
  id: 'sponsor-1',
  name: 'Diageo',
  billing_ref: 'DIAGEO-2024',
}

const REWARD = {
  id: 'reward-1',
  venue_id: 'venue-1',
  sponsor_id: 'sponsor-1',
  sku_label: 'Pint of Guinness',
  window_start: '17:00',
  window_end: '23:00',
  days_mask: 127, // all days
  daily_cap: 50,
  kill_switch: false,
  expiry_days: 7,
  unit_cost_pence: 450,
  venue: VENUE,
}

const VOUCHER_BANKED = {
  id: 'voucher-1',
  user_id: 'user@example.com',
  reward_id: 'reward-1',
  route_stop_id: 'stop-1',
  issued_at: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
  status: 'banked' as const,
  device_hash: 'hash-abc',
  reward: REWARD,
}

function makeDbMock(voucherOverride?: Partial<typeof VOUCHER_BANKED> | null) {
  const mockDb = vi.mocked(db)

  // findFirst returns voucher
  ;(mockDb.query.vouchers.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
    voucherOverride === null ? null : { ...VOUCHER_BANKED, ...voucherOverride },
  )

  // select().from().innerJoin().where() chain for cap count → returns [{ cnt: 0 }]
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
  }
  ;(mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain)

  // insert().values().returning() → returns [{ id: 'redemption-1' }]
  const insertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'redemption-1' }]),
  }
  ;(mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain)

  return { selectChain }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('mintRedemptionCode', () => {
  const userId = 'user@example.com'
  const lat = 51.5395
  const lng = -0.1425
  const deviceHash = 'hash-abc'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isWithinGeofence).mockReturnValue(true)
    vi.mocked(isWithinRedemptionWindow).mockReturnValue(true)
  })

  it('happy path: returns code and redemptionId', async () => {
    makeDbMock()

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.code).toBe('ABCD')
      expect(result.redemptionId).toBe('redemption-1')
      expect(result.codeExpiresAt).toBeInstanceOf(Date)
      // Expiry should be ~60s in the future
      const diff = result.codeExpiresAt.getTime() - Date.now()
      expect(diff).toBeGreaterThan(55_000)
      expect(diff).toBeLessThan(65_000)
    }
  })

  it('returns 404 when voucher not found', async () => {
    makeDbMock(null)

    const result = await mintRedemptionCode('nonexistent', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(404)
    }
  })

  it('returns 403 when voucher belongs to different user', async () => {
    makeDbMock({ user_id: 'other@example.com' })

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 403 when voucher status is not banked (redeemed)', async () => {
    makeDbMock({ status: 'redeemed' as typeof VOUCHER_BANKED.status })

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 410 with expiry message when voucher status is expired', async () => {
    makeDbMock({ status: 'expired' as typeof VOUCHER_BANKED.status })

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(410)
      expect(result.message).toContain('expired')
      expect(result.message).toContain('7 days')
    }
  })

  it('returns 410 with expiry message when voucher expires_at is in the past', async () => {
    makeDbMock({ expires_at: new Date(Date.now() - 1000) })

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(410)
      expect(result.message).toContain('expired')
    }
  })

  it('returns 403 when outside redemption window', async () => {
    makeDbMock()
    vi.mocked(isWithinRedemptionWindow).mockReturnValue(false)

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 403 when kill switch is on', async () => {
    makeDbMock({ reward: { ...REWARD, kill_switch: true } })

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.message).toContain('paused')
    }
  })

  it('returns 429 when daily cap is reached', async () => {
    const mockDb = vi.mocked(db)
    ;(mockDb.query.vouchers.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      VOUCHER_BANKED,
    )

    // First select (cap check) returns cap=50, limit=50
    const capChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ cnt: 50 }]),
    }
    // Second select (rate limit check) returns 0
    const rateChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
    }
    ;(mockDb.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(capChain)
      .mockReturnValueOnce(rateChain)

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(429)
      expect(result.message).toContain('allocation')
    }
  })

  it('returns 403 when outside geofence', async () => {
    makeDbMock()
    vi.mocked(isWithinGeofence).mockReturnValue(false)

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.message).toContain('venue')
    }
  })

  it('returns 429 when rate limit of 5 codes/hour is reached', async () => {
    const mockDb = vi.mocked(db)
    ;(mockDb.query.vouchers.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      VOUCHER_BANKED,
    )

    // Cap check returns 0 (cap not hit)
    const capChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
    }
    // Rate limit check returns 5 (at limit)
    const rateChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ cnt: 5 }]),
    }
    ;(mockDb.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(capChain)
      .mockReturnValueOnce(rateChain)

    const result = await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(429)
      expect(result.message).toContain('Too many')
    }
  })

  it('logs a denial for each rejection', async () => {
    makeDbMock()
    vi.mocked(isWithinGeofence).mockReturnValue(false)

    await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)

    const mockDb = vi.mocked(db)
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('logs denial when kill switch is on', async () => {
    makeDbMock({ reward: { ...REWARD, kill_switch: true } })

    await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)

    const mockDb = vi.mocked(db)
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('logs denial when outside window', async () => {
    makeDbMock()
    vi.mocked(isWithinRedemptionWindow).mockReturnValue(false)

    await mintRedemptionCode('voucher-1', userId, lat, lng, deviceHash)

    const mockDb = vi.mocked(db)
    expect(mockDb.insert).toHaveBeenCalled()
  })
})
