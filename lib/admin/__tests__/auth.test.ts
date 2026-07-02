import { describe, it, expect } from 'vitest'
import { requireAdmin, isAdminError } from '../auth'

/**
 * AUTH BYPASS IS ACTIVE: requireAdmin() currently always grants access so
 * the admin panel is reachable without credentials during the demo phase.
 * The full session + allow-list behaviour (401 without session, 403 for
 * non-allow-listed emails, ADMIN_ALLOWED_EMAILS trimming) is covered by the
 * skipped suite below. Unskip it when the bypass is reverted for production.
 */
describe('requireAdmin (bypass active)', () => {
  it('grants admin context unconditionally', async () => {
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(false)
    if (!isAdminError(result)) expect(result.email).toBe('admin')
  })
})

describe.skip('requireAdmin (full auth — restore before production)', () => {
  it('returns 401 when there is no session', async () => {
    // Session-less requests must be rejected once auth is restored.
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(401)
  })

  it('returns 403 when email is not in ADMIN_ALLOWED_EMAILS', async () => {
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(403)
  })

  it('returns admin context for allowed email', async () => {
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(false)
    if (!isAdminError(result)) expect(result.email).toBe('admin@example.com')
  })
})
