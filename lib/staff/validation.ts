/** "HH:MM", 24-hour clock. */
export const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && HHMM_REGEX.test(value)
}

/** Daily cap must be a positive integer. */
export function isValidDailyCap(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  )
}

/** Staff PIN must be exactly 4 digits. */
export const PIN_REGEX = /^\d{4}$/

export function isValidPin(value: unknown): value is string {
  return typeof value === 'string' && PIN_REGEX.test(value)
}
