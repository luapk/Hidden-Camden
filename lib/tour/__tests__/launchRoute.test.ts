import { describe, expect, it } from 'vitest'
import { LAUNCH_ROUTE } from '../launchRoute'

// Camden bounding box
const LAT_MIN = 51.53
const LAT_MAX = 51.55
const LNG_MIN = -0.16
const LNG_MAX = -0.13

describe('LAUNCH_ROUTE', () => {
  it('has exactly 11 stops', () => {
    expect(LAUNCH_ROUTE).toHaveLength(11)
  })

  it('has unique positions 1..11', () => {
    const positions = LAUNCH_ROUTE.map((s) => s.position).sort((a, b) => a - b)
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('slots the Marathon in between Barfly and the Roundhouse finale', () => {
    const at = (n: number) => LAUNCH_ROUTE.find((s) => s.position === n)!.name
    expect(at(9)).toBe('Barfly')
    expect(at(10)).toBe('The Marathon')
    expect(at(11)).toBe('Roundhouse')
  })

  it('never reuses an audio file across stops', () => {
    const files = LAUNCH_ROUTE.flatMap((s) => [s.audioUrl, s.linkAudioUrl])
      .filter(Boolean)
      .map((u) => u!.split('?')[0])
    expect(new Set(files).size).toBe(files.length)
  })

  it('keeps every stop inside the Camden bounding box', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.lat, `${stop.name} lat`).toBeGreaterThanOrEqual(LAT_MIN)
      expect(stop.lat, `${stop.name} lat`).toBeLessThanOrEqual(LAT_MAX)
      expect(stop.lng, `${stop.name} lng`).toBeGreaterThanOrEqual(LNG_MIN)
      expect(stop.lng, `${stop.name} lng`).toBeLessThanOrEqual(LNG_MAX)
    }
  })

  it('has no paywall: every stop is free', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.isFree, `${stop.name} isFree`).toBe(true)
    }
  })

  it('ties no reward to a venue (drinks are progress-based)', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.rewardLabel, `${stop.name} rewardLabel`).toBeUndefined()
    }
  })

  it('gives every stop an accent and an image', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.accent, `${stop.name} accent`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(stop.image, `${stop.name} image`).toMatch(
        /^https:\/\/images\.unsplash\.com\//,
      )
    }
  })

  it('gives every stop a sensible geofence (25–60m), a runtime, and a transcript snippet', () => {
    for (const stop of LAUNCH_ROUTE) {
      expect(stop.radiusM, `${stop.name} radiusM`).toBeGreaterThanOrEqual(25)
      expect(stop.radiusM, `${stop.name} radiusM`).toBeLessThanOrEqual(60)
      expect(stop.runtimeS).toBeGreaterThan(0)
      expect(stop.transcript.length).toBeGreaterThan(40)
    }
  })

  it('keeps user-facing strings free of em dashes and exclamation marks', () => {
    for (const stop of LAUNCH_ROUTE) {
      const userFacing = [
        stop.name,
        stop.subtitle,
        stop.transcript,
      ].join(' ')
      expect(userFacing).not.toMatch(/—/)
      expect(userFacing).not.toMatch(/!/)
    }
  })
})
