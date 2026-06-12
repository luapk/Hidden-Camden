/**
 * Dwell state machine.
 *
 * The geofence unlock requires the user to be continuously inside the fence
 * for `dwellMs` before triggering. Leaving the fence resets the timer.
 * Once triggered, the tracker stays triggered until reset().
 *
 * Pure logic, driven by a stream of (inside, now) updates so it is fully
 * testable with fake timestamps.
 */

export interface DwellState {
  /** 0..1 progress towards the dwell threshold. 1 once triggered. */
  dwellProgress: number
  /** True once the user has dwelt inside the fence for dwellMs. Latches. */
  triggered: boolean
}

export interface DwellTracker {
  update(inside: boolean, now: number): DwellState
  reset(): void
}

export function createDwellTracker(dwellMs: number): DwellTracker {
  let enteredAt: number | null = null
  let triggered = false

  return {
    update(inside: boolean, now: number): DwellState {
      if (triggered) {
        return { dwellProgress: 1, triggered: true }
      }

      if (!inside) {
        enteredAt = null
        return { dwellProgress: 0, triggered: false }
      }

      if (enteredAt === null) {
        enteredAt = now
      }

      const elapsed = now - enteredAt
      const dwellProgress = Math.max(0, Math.min(1, elapsed / dwellMs))

      if (elapsed >= dwellMs) {
        triggered = true
        return { dwellProgress: 1, triggered: true }
      }

      return { dwellProgress, triggered: false }
    },

    reset() {
      enteredAt = null
      triggered = false
    },
  }
}
