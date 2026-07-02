import { describe, it, expect } from 'vitest'
import { londonWallClock, startOfLondonDay, londonHHMM } from '../london'

describe('londonWallClock', () => {
  it('matches UTC in winter (GMT)', () => {
    // Wed 15 Jan 2026, 18:30 UTC = 18:30 London
    const now = new Date('2026-01-14T18:30:00Z')
    const wc = londonWallClock(now)
    expect(wc.dayIndexMon0).toBe(2) // Wednesday
    expect(wc.minutesOfDay).toBe(18 * 60 + 30)
  })

  it('runs an hour ahead of UTC in summer (BST)', () => {
    // Wed 1 Jul 2026, 18:30 UTC = 19:30 London
    const now = new Date('2026-07-01T18:30:00Z')
    const wc = londonWallClock(now)
    expect(wc.dayIndexMon0).toBe(2)
    expect(wc.minutesOfDay).toBe(19 * 60 + 30)
  })

  it('rolls the weekday over at London midnight, not UTC midnight', () => {
    // 23:30 UTC on Tue 30 Jun is 00:30 London on Wed 1 Jul
    const now = new Date('2026-06-30T23:30:00Z')
    const wc = londonWallClock(now)
    expect(wc.dayIndexMon0).toBe(2) // already Wednesday in London
    expect(wc.minutesOfDay).toBe(30)
  })
})

describe('startOfLondonDay', () => {
  it('is UTC midnight in winter', () => {
    const now = new Date('2026-01-14T18:30:00Z')
    expect(startOfLondonDay(now).toISOString()).toBe('2026-01-14T00:00:00.000Z')
  })

  it('is 23:00 UTC the previous day in summer', () => {
    const now = new Date('2026-07-01T18:30:00Z')
    expect(startOfLondonDay(now).toISOString()).toBe('2026-06-30T23:00:00.000Z')
  })

  it('handles the post-UTC-midnight, pre-London-midnight BST hour', () => {
    // 23:30 UTC on 30 Jun is 00:30 London on 1 Jul; London's day started
    // at 23:00 UTC on 30 Jun.
    const now = new Date('2026-06-30T23:30:00Z')
    expect(startOfLondonDay(now).toISOString()).toBe('2026-06-30T23:00:00.000Z')
  })
})

describe('londonHHMM', () => {
  it('formats BST wall-clock time', () => {
    expect(londonHHMM(new Date('2026-07-01T18:30:00Z'))).toBe('19:30')
  })
  it('formats GMT wall-clock time', () => {
    expect(londonHHMM(new Date('2026-01-14T18:30:00Z'))).toBe('18:30')
  })
})
