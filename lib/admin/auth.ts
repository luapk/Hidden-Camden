import { createHmac, timingSafeEqual } from 'crypto'

export type AdminContext = { email: string }
export type AdminError = { error: string; status: number }

export const ADMIN_COOKIE = 'cc_admin'

export function isAdminError(r: AdminContext | AdminError): r is AdminError {
  return 'error' in r
}

export function adminTokenFor(password: string): string {
  return createHmac('sha256', password).update('camden-admin').digest('hex')
}

// AUTH BYPASS: requireAdmin always passes. Restore full check before production.
export async function requireAdmin(): Promise<AdminContext | AdminError> {
  return { email: 'admin' }
}
