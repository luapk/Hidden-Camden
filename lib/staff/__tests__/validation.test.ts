import { describe, it, expect } from 'vitest'
import { isValidDailyCap, isValidPin, isValidTime } from '../validation'

describe('isValidTime', () => {
  it('accepts valid HH:MM times', () => {
    expect(isValidTime('00:00')).toBe(true)
    expect(isValidTime('09:30')).toBe(true)
    expect(isValidTime('17:00')).toBe(true)
    expect(isValidTime('23:59')).toBe(true)
  })

  it('rejects out-of-range hours and minutes', () => {
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('25:10')).toBe(false)
    expect(isValidTime('12:60')).toBe(false)
  })

  it('rejects malformed strings', () => {
    expect(isValidTime('9:30')).toBe(false)
    expect(isValidTime('0930')).toBe(false)
    expect(isValidTime('17:00:00')).toBe(false)
    expect(isValidTime('')).toBe(false)
    expect(isValidTime('noon')).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isValidTime(1700)).toBe(false)
    expect(isValidTime(null)).toBe(false)
    expect(isValidTime(undefined)).toBe(false)
  })
})

describe('isValidDailyCap', () => {
  it('accepts positive integers', () => {
    expect(isValidDailyCap(1)).toBe(true)
    expect(isValidDailyCap(40)).toBe(true)
    expect(isValidDailyCap(500)).toBe(true)
  })

  it('rejects zero and negatives', () => {
    expect(isValidDailyCap(0)).toBe(false)
    expect(isValidDailyCap(-5)).toBe(false)
  })

  it('rejects non-integers', () => {
    expect(isValidDailyCap(2.5)).toBe(false)
    expect(isValidDailyCap(NaN)).toBe(false)
    expect(isValidDailyCap(Infinity)).toBe(false)
  })

  it('rejects non-numbers', () => {
    expect(isValidDailyCap('40')).toBe(false)
    expect(isValidDailyCap(null)).toBe(false)
    expect(isValidDailyCap(undefined)).toBe(false)
  })
})

describe('isValidPin', () => {
  it('accepts exactly 4 digits', () => {
    expect(isValidPin('0000')).toBe(true)
    expect(isValidPin('1234')).toBe(true)
    expect(isValidPin('9999')).toBe(true)
  })

  it('rejects wrong lengths', () => {
    expect(isValidPin('123')).toBe(false)
    expect(isValidPin('12345')).toBe(false)
    expect(isValidPin('')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isValidPin('12a4')).toBe(false)
    expect(isValidPin('12 4')).toBe(false)
    expect(isValidPin('-123')).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isValidPin(1234)).toBe(false)
    expect(isValidPin(null)).toBe(false)
    expect(isValidPin(undefined)).toBe(false)
  })
})
