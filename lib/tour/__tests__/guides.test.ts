import { describe, it, expect } from 'vitest'
import {
  GUIDES,
  HOST_ID,
  assignedGuide,
  getGuide,
  monogram,
  narratorFor,
  resolveAudioUrl,
} from '../guides'
import { LAUNCH_ROUTE } from '../launchRoute'

describe('GUIDES registry', () => {
  it('has exactly one host, DJ Sammie Star, and it is live', () => {
    const hosts = GUIDES.filter((g) => g.role === 'host')
    expect(hosts.map((g) => g.id)).toEqual([HOST_ID])
    expect(getGuide(HOST_ID).name).toBe('DJ Sammie Star')
    expect(getGuide(HOST_ID).status).toBe('live')
  })

  it('getGuide falls back to the host for unknown ids', () => {
    expect(getGuide('nope' as never).id).toBe(HOST_ID)
  })

  it('every guest owns at least one stop on the route', () => {
    for (const g of GUIDES.filter((x) => x.role === 'guest')) {
      expect(
        LAUNCH_ROUTE.some((s) => s.voice === g.id),
        `${g.name} has no stop`,
      ).toBe(true)
    }
  })
})

describe('the cast on the route', () => {
  const byName = (n: string) => LAUNCH_ROUTE.find((s) => s.name.includes(n))!

  it('maps guests to their venues', () => {
    expect(assignedGuide(byName('Dublin Castle')).id).toBe('suggs')
    expect(assignedGuide(byName('Hawley Arms')).id).toBe('yungblud')
    expect(assignedGuide(byName('Barfly')).id).toBe('carl-barat')
    expect(assignedGuide(byName('Marathon')).id).toBe('camden-cat')
    expect(assignedGuide(byName('Roundhouse')).id).toBe('little-simz')
  })

  it('stops without a guest belong to the host', () => {
    expect(assignedGuide(byName('Jazz Café')).id).toBe(HOST_ID)
  })
})

describe('narratorFor', () => {
  it('falls back to the host while a guest is not yet recorded', () => {
    expect(narratorFor({ voice: 'suggs' }, 'en').id).toBe(HOST_ID)
  })

  it('always uses the host outside English', () => {
    expect(narratorFor({ voice: 'sammie' }, 'es').id).toBe(HOST_ID)
  })
})

describe('resolveAudioUrl', () => {
  const url = 'https://cdn.example.com/audio/stop-01.mp3'

  it('returns null for null input', () => {
    expect(resolveAudioUrl(null, 'en', 'sammie')).toBeNull()
  })

  it('leaves the host URL untouched in English', () => {
    expect(resolveAudioUrl(url, 'en', HOST_ID)).toBe(url)
  })

  it('maps a guest onto their audio directory in English', () => {
    expect(resolveAudioUrl(url, 'en', 'suggs')).toBe(
      'https://cdn.example.com/audio/guides/suggs/stop-01.mp3',
    )
  })

  it('ignores the guest outside English', () => {
    expect(resolveAudioUrl(url, 'es', 'suggs')).toBe(
      'https://cdn.example.com/audio/es/stop-01.mp3',
    )
  })
})

describe('monogram', () => {
  it('drops a leading "The" and takes two initials', () => {
    expect(monogram('The Camden Cat')).toBe('CC')
    expect(monogram('Little Simz')).toBe('LS')
    expect(monogram('Suggs')).toBe('S')
  })
})
