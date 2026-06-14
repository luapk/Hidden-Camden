import { describe, expect, it } from 'vitest'
import { createDwellTracker } from '../dwell'

const DWELL = 8_000

describe('createDwellTracker', () => {
  it('triggers after staying inside for dwellMs', () => {
    const tracker = createDwellTracker(DWELL)

    expect(tracker.update(true, 0)).toEqual({ dwellProgress: 0, triggered: false })

    const mid = tracker.update(true, 4_000)
    expect(mid.triggered).toBe(false)
    expect(mid.dwellProgress).toBeCloseTo(0.5)

    const done = tracker.update(true, 8_000)
    expect(done).toEqual({ dwellProgress: 1, triggered: true })
  })

  it('resets when the user leaves the fence before dwellMs', () => {
    const tracker = createDwellTracker(DWELL)

    tracker.update(true, 0)
    const at5s = tracker.update(true, 5_000)
    expect(at5s.dwellProgress).toBeCloseTo(0.625)
    expect(at5s.triggered).toBe(false)

    const left = tracker.update(false, 5_500)
    expect(left).toEqual({ dwellProgress: 0, triggered: false })
  })

  it('starts a fresh timer when the user re-enters', () => {
    const tracker = createDwellTracker(DWELL)

    tracker.update(true, 0)
    tracker.update(true, 5_000)
    tracker.update(false, 6_000)

    // Re-enter at 7s: progress restarts from zero.
    const reentered = tracker.update(true, 7_000)
    expect(reentered.dwellProgress).toBe(0)
    expect(reentered.triggered).toBe(false)

    // 7s into the fresh window: not yet.
    const almost = tracker.update(true, 14_000)
    expect(almost.triggered).toBe(false)
    expect(almost.dwellProgress).toBeCloseTo(7_000 / DWELL)

    // Full dwell from re-entry: triggers.
    const done = tracker.update(true, 15_000)
    expect(done).toEqual({ dwellProgress: 1, triggered: true })
  })

  it('stays triggered once triggered, even after leaving', () => {
    const tracker = createDwellTracker(DWELL)

    tracker.update(true, 0)
    expect(tracker.update(true, 8_000).triggered).toBe(true)

    // Leaving the fence does not un-trigger.
    expect(tracker.update(false, 9_000)).toEqual({
      dwellProgress: 1,
      triggered: true,
    })
    expect(tracker.update(true, 10_000)).toEqual({
      dwellProgress: 1,
      triggered: true,
    })
  })

  it('reset() clears the latch and the timer', () => {
    const tracker = createDwellTracker(DWELL)

    tracker.update(true, 0)
    expect(tracker.update(true, 8_000).triggered).toBe(true)

    tracker.reset()
    expect(tracker.update(true, 20_000)).toEqual({
      dwellProgress: 0,
      triggered: false,
    })
    expect(tracker.update(true, 28_000).triggered).toBe(true)
  })

  it('clamps progress and never exceeds 1', () => {
    const tracker = createDwellTracker(DWELL)
    tracker.update(true, 0)
    const over = tracker.update(true, 50_000)
    expect(over.dwellProgress).toBe(1)
    expect(over.triggered).toBe(true)
  })

  describe('requireApproach', () => {
    it('refuses to count while the user starts inside the fence', () => {
      const tracker = createDwellTracker(DWELL, { requireApproach: true })

      // Already inside on the first fix (e.g. fences overlap): held at zero.
      expect(tracker.update(true, 0)).toEqual({ dwellProgress: 0, triggered: false })
      expect(tracker.update(true, 8_000)).toEqual({ dwellProgress: 0, triggered: false })
      expect(tracker.update(true, 20_000)).toEqual({ dwellProgress: 0, triggered: false })
    })

    it('arms once seen outside, then counts a normal dwell on re-entry', () => {
      const tracker = createDwellTracker(DWELL, { requireApproach: true })

      tracker.update(true, 0) // disarmed, no progress
      tracker.update(false, 1_000) // steps outside: now armed

      expect(tracker.update(true, 2_000).dwellProgress).toBe(0)
      const mid = tracker.update(true, 6_000)
      expect(mid.dwellProgress).toBeCloseTo(0.5)
      expect(tracker.update(true, 10_000)).toEqual({ dwellProgress: 1, triggered: true })
    })

    it('arms immediately when the user is already outside the fence', () => {
      const tracker = createDwellTracker(DWELL, { requireApproach: true })

      tracker.update(false, 0) // outside on first fix: armed
      tracker.update(true, 1_000)
      expect(tracker.update(true, 9_000)).toEqual({ dwellProgress: 1, triggered: true })
    })

    it('re-disarms after reset()', () => {
      const tracker = createDwellTracker(DWELL, { requireApproach: true })

      tracker.update(false, 0)
      tracker.update(true, 1_000)
      expect(tracker.update(true, 9_000).triggered).toBe(true)

      tracker.reset()
      // Inside without first being seen outside again: held at zero.
      expect(tracker.update(true, 9_000)).toEqual({ dwellProgress: 0, triggered: false })
      expect(tracker.update(true, 18_000)).toEqual({ dwellProgress: 0, triggered: false })
    })
  })
})
