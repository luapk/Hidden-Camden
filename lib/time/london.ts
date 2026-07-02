/**
 * Europe/London wall-clock helpers.
 *
 * Every venue on the tour is in Camden, so redemption windows, days masks,
 * and "today" boundaries all mean London time, not server UTC. During BST
 * the two differ by an hour: a 17:00–23:00 window evaluated in UTC would
 * open and shut an hour late, and daily caps would reset at 1am.
 */

const TZ = 'Europe/London'

export interface LondonWallClock {
  /** 0 = Monday … 6 = Sunday, matching the rewards days_mask bit order. */
  dayIndexMon0: number
  /** Minutes since London midnight. */
  minutesOfDay: number
}

const WEEKDAY_TO_MON0: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

export function londonWallClock(now: Date): LondonWallClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const dayIndexMon0 = WEEKDAY_TO_MON0[get('weekday')] ?? 0
  const minutesOfDay = Number(get('hour')) * 60 + Number(get('minute'))

  return { dayIndexMon0, minutesOfDay }
}

/**
 * The instant London's calendar day containing `now` began, as a UTC Date.
 * In winter (GMT) this is UTC midnight; in summer (BST) it is 23:00 UTC the
 * previous day.
 */
export function startOfLondonDay(now: Date): Date {
  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const get = (type: string) =>
    Number(dateParts.find((p) => p.type === type)?.value ?? 0)

  const utcMidnight = Date.UTC(get('year'), get('month') - 1, get('day'))

  // If London reads 01:00 at that UTC instant we are in BST and London's
  // midnight was an hour before UTC midnight.
  const hourAtUtcMidnight = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(utcMidnight)),
  )

  return new Date(utcMidnight - hourAtUtcMidnight * 3_600_000)
}

/** "HH:MM" in London time, for staff-facing feeds. */
export function londonHHMM(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d)
}
