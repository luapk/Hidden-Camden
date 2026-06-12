import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock next-auth and the DB module before importing the code under test
// ---------------------------------------------------------------------------
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      staffUsers: {
        findFirst: vi.fn(),
      },
      rewards: {
        findFirst: vi.fn(),
      },
    },
  },
}))

import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { getStaffContext, requireManager } from '../auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MANAGER = {
  id: 'staff-1',
  venue_id: 'venue-1',
  email: 'manager@venue.com',
  role: 'manager' as const,
  created_at: new Date(),
}

const BAR_STAFF = {
  ...MANAGER,
  id: 'staff-2',
  email: 'bar@venue.com',
  role: 'bar' as const,
}

const OWN_REWARD = {
  id: 'reward-1',
  venue_id: 'venue-1',
  sponsor_id: 'sponsor-1',
  sku_label: 'Pint of Guinness',
  window_start: '17:00',
  window_end: '23:00',
  days_mask: 127,
  daily_cap: 50,
  kill_switch: false,
  expiry_days: 7,
  unit_cost_pence: 450,
}

const FOREIGN_REWARD = {
  ...OWN_REWARD,
  id: 'reward-2',
  venue_id: 'venue-other',
}

const mockedSession = vi.mocked(getServerSession)
const mockedStaffFindFirst = vi.mocked(db.query.staffUsers.findFirst)
const mockedRewardFindFirst = vi.mocked(db.query.rewards.findFirst)

function signIn(email: string) {
  mockedSession.mockResolvedValue({ user: { email } })
}

// ---------------------------------------------------------------------------
// requireManager
// ---------------------------------------------------------------------------
describe('requireManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when there is no session', async () => {
    mockedSession.mockResolvedValue(null)

    const result = await requireManager()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(401)
    }
    expect(mockedStaffFindFirst).not.toHaveBeenCalled()
  })

  it('returns 401 when getServerSession throws (auth not configured)', async () => {
    mockedSession.mockRejectedValue(new Error('no NEXTAUTH_SECRET'))

    const result = await requireManager()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(401)
    }
  })

  it('returns 403 when the email has no staff account', async () => {
    signIn('stranger@example.com')
    mockedStaffFindFirst.mockResolvedValue(undefined)

    const result = await requireManager()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 403 for bar-role staff', async () => {
    signIn(BAR_STAFF.email)
    mockedStaffFindFirst.mockResolvedValue(BAR_STAFF)

    const result = await requireManager()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.message).toContain('Manager')
    }
  })

  it('returns 403 when a manager passes a foreign venue id', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)

    const result = await requireManager({ venueId: 'venue-other' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 403 when a manager passes a reward owned by another venue', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)
    mockedRewardFindFirst.mockResolvedValue(FOREIGN_REWARD)

    const result = await requireManager({ rewardId: FOREIGN_REWARD.id })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('returns 403 when the reward does not exist', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)
    mockedRewardFindFirst.mockResolvedValue(undefined)

    const result = await requireManager({ rewardId: 'nonexistent' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it('happy path: manager with no scope returns the staff user', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)

    const result = await requireManager()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.staffUser.id).toBe(MANAGER.id)
      expect(result.staffUser.venue_id).toBe(MANAGER.venue_id)
    }
  })

  it('happy path: manager with own venue id passes', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)

    const result = await requireManager({ venueId: MANAGER.venue_id })

    expect(result.ok).toBe(true)
  })

  it('happy path: manager with a reward from their own venue passes', async () => {
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue(MANAGER)
    mockedRewardFindFirst.mockResolvedValue(OWN_REWARD)

    const result = await requireManager({ rewardId: OWN_REWARD.id })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.staffUser.id).toBe(MANAGER.id)
    }
  })
})

// ---------------------------------------------------------------------------
// getStaffContext
// ---------------------------------------------------------------------------
describe('getStaffContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when there is no session', async () => {
    mockedSession.mockResolvedValue(null)

    expect(await getStaffContext()).toBeNull()
  })

  it('returns null when the email has no staff account', async () => {
    signIn('stranger@example.com')
    mockedStaffFindFirst.mockResolvedValue(undefined)

    expect(await getStaffContext()).toBeNull()
  })

  it('returns the staff user and their venue', async () => {
    const venue = { id: 'venue-1', name: 'The Black Cap' }
    signIn(MANAGER.email)
    mockedStaffFindFirst.mockResolvedValue({
      ...MANAGER,
      venue,
    } as never)

    const ctx = await getStaffContext()

    expect(ctx).not.toBeNull()
    expect(ctx?.staffUser.id).toBe(MANAGER.id)
    expect(ctx?.venue.id).toBe('venue-1')
  })
})
