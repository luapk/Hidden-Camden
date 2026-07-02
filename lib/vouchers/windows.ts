import { londonWallClock } from '@/lib/time/london'

/**
 * Returns true if `now` falls within the reward's redemption window.
 *
 * Windows are venue wall-clock times, and every venue is in Camden, so the
 * comparison happens in Europe/London — not server UTC. During BST the two
 * differ by an hour.
 *
 * Days mapping: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
 */
const DAY_BITS = [1, 2, 4, 8, 16, 32, 64] as const // index 0=Mon … 6=Sun

export function isWithinRedemptionWindow(
  now: Date,
  windowStart: string, // "HH:MM"
  windowEnd: string,   // "HH:MM"
  daysMask: number,
): boolean {
  const { dayIndexMon0, minutesOfDay } = londonWallClock(now)

  const dayBit = DAY_BITS[dayIndexMon0]
  if ((daysMask & dayBit) === 0) return false

  const [startH, startM] = windowStart.split(':').map(Number) as [number, number]
  const [endH, endM] = windowEnd.split(':').map(Number) as [number, number]
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return minutesOfDay >= startMinutes && minutesOfDay < endMinutes
}
