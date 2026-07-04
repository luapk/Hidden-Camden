import { describe, expect, it } from 'vitest'
import { CULTURE_ROUTE } from '../cultureRoute'

// Camden bounding box
const LAT_MIN = 51.53
const LAT_MAX = 51.55
const LNG_MIN = -0.16
const LNG_MAX = -0.13

describe('CULTURE_ROUTE', () => {
  it('has exactly 10 stops with unique positions 1..10', () => {
    expect(CULTURE_ROUTE).toHaveLength(10)
    const positions = CULTURE_ROUTE.map((s) => s.position).sort((a, b) => a - b)
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('keeps every stop inside the Camden bounding box', () => {
    for (const stop of CULTURE_ROUTE) {
      expect(stop.lat, `${stop.name} lat`).toBeGreaterThanOrEqual(LAT_MIN)
      expect(stop.lat, `${stop.name} lat`).toBeLessThanOrEqual(LAT_MAX)
      expect(stop.lng, `${stop.name} lng`).toBeGreaterThanOrEqual(LNG_MIN)
      expect(stop.lng, `${stop.name} lng`).toBeLessThanOrEqual(LNG_MAX)
    }
  })

  it('marks stops 1 and 2 free and the rest paid', () => {
    for (const stop of CULTURE_ROUTE) {
      expect(stop.isFree, `${stop.name} isFree`).toBe(stop.position <= 2)
    }
  })

  it('pulls a real transcript from the script pack for every stop', () => {
    for (const stop of CULTURE_ROUTE) {
      expect(stop.transcript.length, `${stop.name} transcript`).toBeGreaterThan(100)
    }
  })

  it('gives every stop culture-prefixed narration and link audio except the last', () => {
    for (const stop of CULTURE_ROUTE) {
      expect(stop.audioUrl, `${stop.name} audioUrl`).toContain('/audio/culture-stop-')
      if (stop.position < 10) {
        expect(stop.linkAudioUrl, `${stop.name} link`).toContain('/audio/culture-link-')
      } else {
        expect(stop.linkAudioUrl).toBeNull()
      }
    }
  })

  it('gives every stop a sensible geofence (25-60m) and a reward', () => {
    for (const stop of CULTURE_ROUTE) {
      expect(stop.radiusM, `${stop.name} radiusM`).toBeGreaterThanOrEqual(25)
      expect(stop.radiusM, `${stop.name} radiusM`).toBeLessThanOrEqual(60)
      expect(stop.rewardLabel.length, `${stop.name} rewardLabel`).toBeGreaterThan(0)
    }
  })

  it('keeps user-facing strings free of em dashes and exclamation marks', () => {
    for (const stop of CULTURE_ROUTE) {
      const userFacing = [
        stop.name,
        stop.subtitle,
        stop.rewardLabel,
        stop.rewardWindow,
        stop.transcript,
      ].join(' ')
      expect(userFacing, stop.name).not.toMatch(/—/)
      expect(userFacing, stop.name).not.toMatch(/!/)
    }
  })
})
