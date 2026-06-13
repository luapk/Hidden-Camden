import { describe, expect, it } from 'vitest'
import { LAUNCH_ROUTE } from '../launchRoute'

// Camden bounding box
const LAT_MIN = 51.53
const LAT_MAX = 51.55
const LNG_MIN = -0.16
const LNG_MAX = -0.13

describe('LAUNCH_ROUTE', () => {
  it('has exactly 7 stops', () => {
    expect(LAUNCH_ROUTE).toHaveLength(7)
  })

  it('has unique positions 1..7', () => {
    const positions = LAUNCH_ROUTE.map((s) => s.position).sort((a, b) => a - b)
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('keeps every stop inside the Camden bounding box', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.lat, `${stop.name} lat`).toBeGreaterThanOrEqual(LAT_MIN)
      expect(stop.lat, `${stop.name} lat`).toBeLessThanOrEqual(LAT_MAX)
      expect(stop.lng, `${stop.name} lng`).toBeGreaterThanOrEqual(LNG_MIN)
      expect(stop.lng, `${stop.name} lng`).toBeLessThanOrEqual(LNG_MAX)
    }
  })

  it('marks stops 1 and 2 free and the rest paid', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.isFree, `${stop.name} isFree`).toBe(stop.position <= 2)
    }
  })

  it('gives every stop an accent, an image, and a reward label', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.accent, `${stop.name} accent`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(stop.image, `${stop.name} image`).toMatch(
        /^https:\/\/images\.unsplash\.com\//,
      )
      expect(stop.rewardLabel.length, `${stop.name} rewardLabel`).toBeGreaterThan(0)
    }
  })

  it('gives every stop a 30m geofence, a runtime, and a transcript snippet', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.radiusM).toBe(30)
      expect(stop.runtimeS).toBeGreaterThan(0)
      expect(stop.transcript.length).toBeGreaterThan(40)
    }
  })

  it('keeps user-facing strings free of em dashes and exclamation marks', () => {
    for (const stop of LAUNCH_ROUTE) {
      const userFacing = [
        stop.name,
        stop.subtitle,
        stop.rewardLabel,
        stop.rewardWindow,
        stop.transcript,
      ].join(' ')
      expect(userFacing).not.toMatch(/—/)
      expect(userFacing).not.toMatch(/!/)
    }
  })
})
