import { describe, it, expect } from 'vitest'
import { GUIDES, DEFAULT_GUIDE_ID, getGuide, resolveAudioUrl } from '../guides'

describe('GUIDES registry', () => {
  it('includes the default guide and it is live', () => {
    const def = GUIDES.find((g) => g.id === DEFAULT_GUIDE_ID)
    expect(def).toBeDefined()
    expect(def?.status).toBe('live')
  })

  it('includes DJ Sammie Star as a live guide', () => {
    const sammie = GUIDES.find((g) => g.id === 'sammie')
    expect(sammie?.status).toBe('live')
    expect(sammie?.name).toBe('DJ Sammie Star')
  })

  it('lists the coming-soon guides', () => {
    const soon = GUIDES.filter((g) => g.status === 'coming-soon').map((g) => g.id)
    expect(soon).toEqual(
      expect.arrayContaining(['suggs', 'yungblud', 'carl-barat']),
    )
  })

  it('getGuide falls back to the default for unknown ids', () => {
    expect(getGuide('nope' as never).id).toBe(GUIDES[0].id)
  })
})

describe('resolveAudioUrl', () => {
  const url = 'https://cdn.example.com/audio/stop-01.mp3'

  it('returns null for null input', () => {
    expect(resolveAudioUrl(null, 'en', 'sammie')).toBeNull()
  })

  it('leaves the default guide URL untouched in English', () => {
    expect(resolveAudioUrl(url, 'en', DEFAULT_GUIDE_ID)).toBe(url)
  })

  it('maps a guide onto its audio directory in English', () => {
    expect(resolveAudioUrl(url, 'en', 'sammie')).toBe(
      'https://cdn.example.com/audio/guides/sammie/stop-01.mp3',
    )
  })

  it('ignores the guide outside English: guides narrate in English only', () => {
    expect(resolveAudioUrl(url, 'es', 'sammie')).toBe(
      'https://cdn.example.com/audio/es/stop-01.mp3',
    )
  })
})
