import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { rewards, staffUsers } from '@/lib/db/schema'
import type { StaffUser, Venue } from '@/lib/db/schema'

export interface StaffContext {
  staffUser: StaffUser
  venue: Venue
}

export type StaffAuthResult =
  | { ok: true; staffUser: StaffUser }
  | { ok: false; status: 401 | 403; message: string }

async function sessionEmail(): Promise<string | null> {
  try {
    const session = await getServerSession()
    return session?.user?.email ?? null
  } catch {
    // Auth not configured (e.g. local dev without NEXTAUTH_SECRET)
    return null
  }
}

/**
 * Loads the signed-in staff user and their venue for /staff pages.
 * Returns null when there is no session or no staff account for the email.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const email = await sessionEmail()
  if (!email) return null

  const staffUser = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.email, email),
    with: { venue: true },
  })
  if (!staffUser) return null

  const { venue, ...rest } = staffUser
  return { staffUser: rest, venue }
}

/**
 * Authorization gate for staff API routes.
 *
 * session email -> staff_users lookup -> role must be 'manager' -> the
 * reward/venue being modified must belong to that staff user's venue.
 * Venues must never touch other venues' data.
 */
export async function requireManager(scope?: {
  rewardId?: string
  venueId?: string
}): Promise<StaffAuthResult> {
  const email = await sessionEmail()
  if (!email) {
    return { ok: false, status: 401, message: 'Authentication required.' }
  }

  const staffUser = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.email, email),
  })
  if (!staffUser) {
    return {
      ok: false,
      status: 403,
      message: 'No staff account for this email.',
    }
  }

  if (staffUser.role !== 'manager') {
    return { ok: false, status: 403, message: 'Manager access required.' }
  }

  if (scope?.venueId && scope.venueId !== staffUser.venue_id) {
    return {
      ok: false,
      status: 403,
      message: 'This venue is not yours to manage.',
    }
  }

  if (scope?.rewardId) {
    const reward = await db.query.rewards.findFirst({
      where: eq(rewards.id, scope.rewardId),
    })
    if (!reward || reward.venue_id !== staffUser.venue_id) {
      return {
        ok: false,
        status: 403,
        message: 'This reward is not yours to manage.',
      }
    }
  }

  return { ok: true, staffUser }
}
