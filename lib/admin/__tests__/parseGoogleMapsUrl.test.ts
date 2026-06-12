import { describe, it, expect } from 'vitest'
import { parseGoogleMapsUrl } from '../parseGoogleMapsUrl'

describe('parseGoogleMapsUrl', () => {
  it('parses @lat,lng share format', () => {
    const result = parseGoogleMapsUrl('https://www.google.com/maps/@51.5395,-0.1425,17z')
    expect(result).toEqual({ lat: 51.5395, lng: -0.1425 })
  })

  it('parses ?q=lat,lng format', () => {
    const result = parseGoogleMapsUrl('https://maps.google.com/maps?q=51.5395,-0.1425')
    expect(result).toEqual({ lat: 51.5395, lng: -0.1425 })
  })

  it('parses &q=lat,lng format', () => {
    const result = parseGoogleMapsUrl('https://maps.google.com/maps?z=17&q=51.5395,-0.1425')
    expect(result).toEqual({ lat: 51.5395, lng: -0.1425 })
  })

  it('parses URL-encoded %2C format', () => {
    const result = parseGoogleMapsUrl('https://maps.google.com/maps/search/51.5395%2C-0.1425')
    expect(result).toEqual({ lat: 51.5395, lng: -0.1425 })
  })

  it('handles negative coordinates', () => {
    const result = parseGoogleMapsUrl('https://www.google.com/maps/@-33.8688,151.2093,14z')
    expect(result).toEqual({ lat: -33.8688, lng: 151.2093 })
  })

  it('returns null for garbage input', () => {
    expect(parseGoogleMapsUrl('not a url')).toBeNull()
    expect(parseGoogleMapsUrl('')).toBeNull()
    expect(parseGoogleMapsUrl('https://example.com')).toBeNull()
  })
})
