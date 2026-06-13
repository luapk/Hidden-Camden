import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AdminContext = { email: string }
export type AdminError = { error: string; status: number }

export function isAdminError(r: AdminContext | AdminError): r is AdminError {
  return 'error' in r
}

export async function requireAdmin(): Promise<AdminContext | AdminError> {
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
