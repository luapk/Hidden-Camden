/**
 * Returns true if `now` falls within the reward's redemption window.
 *
 * Days mapping (JS Date.getDay() is 0=Sun, 1=Mon … 6=Sat):
 *   Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
 *
 * To get the bit index from JS day: (date.getDay() + 6) % 7
 *   Sun → (0+6)%7 = 6  → bit 64 ✓
 *   Mon → (1+6)%7 = 0  → bit 1  ✓
 */
const DAY_BITS = [1, 2, 4, 8, 16, 32, 64] as const // index 0=Mon … 6=Sun

export function isWithinRedemptionWindow(
  now: Date,
  windowStart: string, // "HH:MM"
  windowEnd: string,   // "HH:MM"
  daysMask: number,
): boolean {
  // Check day-of-week
  const jsDayIndex = now.getUTCDay() // 0=Sun
  const maskIndex = (jsDayIndex + 6) % 7 // 0=Mon … 6=Sun
  const dayBit = DAY_BITS[maskIndex]
  if ((daysMask & dayBit) === 0) return false

  // Check time-of-day (UTC for now; venue local time in a future iteration)
  const hours = now.getUTCHours()
  const minutes = now.getUTCMinutes()
  const nowMinutes = hours * 60 + minutes

  const [startH, startM] = windowStart.split(':').map(Number) as [number, number]
  const [endH, endM] = windowEnd.split(':').map(Number) as [number, number]
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return nowMinutes >= startMinutes && nowMinutes < endMinutes
}
