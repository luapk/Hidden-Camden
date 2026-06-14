/**
 * Dwell state machine.
 *
 * The geofence unlock requires the user to be continuously inside the fence
 * for `dwellMs` before triggering. Leaving the fence resets the timer.
 * Once triggered, the tracker stays triggered until reset().
 *
 * Pure logic, driven by a stream of (inside, now) updates so it is fully
 * testable with fake timestamps.
 *
 * `requireApproach` makes the tracker refuse to count until it has seen the
 * user at least once OUTSIDE the fence. This stops a single noisy fix that
 * already reads "inside" the next stop from cascade-unlocking it the instant
 * the previous stop unlocks: you have to actually arrive from outside.
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

export interface DwellOptions {
  /** Require one observation outside the fence before the timer can start. */
  requireApproach?: boolean
}

export function createDwellTracker(
  dwellMs: number,
  options: DwellOptions = {},
): DwellTracker {
  const requireApproach = options.requireApproach ?? false
  let enteredAt: number | null = null
  let triggered = false
  // When approach is required, we start disarmed and only arm once we have
  // seen the user outside the fence.
  let armed = !requireApproach

  return {
    update(inside: boolean, now: number): DwellState {
      if (triggered) {
        return { dwellProgress: 1, triggered: true }
      }

      if (!inside) {
        enteredAt = null
        armed = true
        return { dwellProgress: 0, triggered: false }
      }

      // Inside, but we have never seen them outside yet: hold at zero until
      // they approach the fence properly.
      if (!armed) {
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
      armed = !requireApproach
    },
  }
}
