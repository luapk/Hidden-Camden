import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { authOptions } from '@/lib/auth'

export type AdminContext = { email: string }
export type AdminError = { error: string; status: number }

export const ADMIN_COOKIE = 'cc_admin'

export function isAdminError(r: AdminContext | AdminError): r is AdminError {
  return 'error' in r
}

// Derives a cookie token from the shared admin password. The raw password
// never lands in the cookie, only this HMAC of it.
export function adminTokenFor(password: string): string {
  return createHmac('sha256', password).update('camden-admin').digest('hex')
}

// Simple password gate: a valid signed cookie means an admin is in.
// Avoids the full magic-link + database session flow.
function passwordCookieValid(): boolean {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false

  const token = cookies().get(ADMIN_COOKIE)?.value
  if (!token) return false

  const expected = adminTokenFor(password)
  if (token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function requireAdmin(): Promise<AdminContext | AdminError> {
  // Password gate first — the simple path.
  if (passwordCookieValid()) {
    return { email: 'admin' }
  }

  // Fall back to NextAuth magic-link session + allow-list.
  type SessionShape = { user?: { email?: string | null } } | null
  let session: SessionShape = null
  try {
    session = (await getServerSession(authOptions)) as SessionShape
  } catch {
    // NextAuth not configured in this environment
  }

  if (!session?.user?.email) {
    return { error: 'Authentication required.', status: 401 }
  }

  const allowed = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (!allowed.includes(session.user.email)) {
    return { error: 'Not authorised.', status: 403 }
  }

  return { email: session.user.email }
}
