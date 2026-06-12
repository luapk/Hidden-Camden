import { describe, it, expect } from 'vitest'
import { validateRouteForPublish, type PublishStopInput } from '../publish'

function makeStop(overrides: Partial<PublishStopInput> = {}): PublishStopInput {
  return {
    position: 1,
    audio_url: 'https://cdn.example.com/stop1.mp3',
    transcript: 'The story of this place...',
    venue: { lat: 51.539, lng: -0.143, geofence_radius_m: 40, status: 'live' },
    reward: { kill_switch: false },
    ...overrides,
  }
}

describe('validateRouteForPublish', () => {
  it('returns valid for a clean single stop', () => {
    const result = validateRouteForPublish([makeStop()])
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('errors when audio_url is missing', () => {
    const result = validateRouteForPublish([makeStop({ audio_url: null })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('audio'))).toBe(true)
  })

  it('errors when transcript is missing', () => {
    const result = validateRouteForPublish([makeStop({ transcript: null })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('transcript'))).toBe(true)
  })

  it('errors when venue is not live', () => {
    const result = validateRouteForPublish([makeStop({ venue: { lat: 51.539, lng: -0.143, geofence_radius_m: 40, status: 'draft' } })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('live'))).toBe(true)
  })

  it('errors when reward kill_switch is on', () => {
    const result = validateRouteForPublish([makeStop({ reward: { kill_switch: true } })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('kill switch'))).toBe(true)
  })

  it('warns (does not error) when adjacent geofences overlap', () => {
    // Two stops 30m apart with 20m radius each — combined 40m > 30m distance
    const stop1 = makeStop({ position: 1, venue: { lat: 51.5390, lng: -0.1430, geofence_radius_m: 20, status: 'live' } })
    const stop2 = makeStop({ position: 2, venue: { lat: 51.5392, lng: -0.1430, geofence_radius_m: 20, status: 'live' } })
    const result = validateRouteForPublish([stop1, stop2])
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('no warning when adjacent geofences do not overlap', () => {
    // Two stops ~200m apart with 40m radius each — well clear
    const stop1 = makeStop({ position: 1, venue: { lat: 51.5390, lng: -0.1430, geofence_radius_m: 40, status: 'live' } })
    const stop2 = makeStop({ position: 2, venue: { lat: 51.5408, lng: -0.1430, geofence_radius_m: 40, status: 'live' } })
    const result = validateRouteForPublish([stop1, stop2])
    expect(result.warnings).toHaveLength(0)
  })

  it('includes position label in errors', () => {
    const result = validateRouteForPublish([makeStop({ position: 3, audio_url: null })])
    expect(result.errors[0]).toContain('Stop 3')
  })
})
