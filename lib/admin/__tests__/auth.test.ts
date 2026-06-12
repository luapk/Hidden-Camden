import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

import { getServerSession } from 'next-auth'
import { requireAdmin, isAdminError } from '../auth'

const mockGetServerSession = vi.mocked(getServerSession)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMIN_ALLOWED_EMAILS = 'admin@example.com,other@example.com'
})

describe('requireAdmin', () => {
  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(401)
  })

  it('returns 401 when getServerSession throws', async () => {
    mockGetServerSession.mockRejectedValue(new Error('NextAuth not configured'))
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(401)
  })

  it('returns 401 when session has no email', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} } as never)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(401)
  })

  it('returns 403 when email is not in ADMIN_ALLOWED_EMAILS', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'stranger@example.com' } } as never)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(403)
  })

  it('returns 403 when ADMIN_ALLOWED_EMAILS is not set', async () => {
    delete process.env.ADMIN_ALLOWED_EMAILS
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@example.com' } } as never)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(true)
    if (isAdminError(result)) expect(result.status).toBe(403)
  })

  it('returns admin context for allowed email', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@example.com' } } as never)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(false)
    if (!isAdminError(result)) expect(result.email).toBe('admin@example.com')
  })

  it('trims spaces in ADMIN_ALLOWED_EMAILS', async () => {
    process.env.ADMIN_ALLOWED_EMAILS = ' admin@example.com , padded@example.com '
    mockGetServerSession.mockResolvedValue({ user: { email: 'padded@example.com' } } as never)
    const result = await requireAdmin()
    expect(isAdminError(result)).toBe(false)
  })
})
