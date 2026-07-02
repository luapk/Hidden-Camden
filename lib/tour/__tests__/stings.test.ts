import { describe, it, expect } from 'vitest'
import { arrivalSting, bankSting } from '../stings'

describe('stings', () => {
  it('arrival plays the stop\'s own riff', () => {
    expect(arrivalSting(1)).toBe('/sounds/stop-01.mp3')
    expect(arrivalSting(7)).toBe('/sounds/stop-07.mp3')
  })

  it('bank riff comes from the same shelf', () => {
    for (let p = 1; p <= 7; p++) {
      expect(bankSting(p)).toMatch(/^\/sounds\/stop-0[1-7]\.mp3$/)
    }
  })

  it('bank riff never matches the arrival riff for the same stop', () => {
    for (let p = 1; p <= 7; p++) {
      expect(bankSting(p)).not.toBe(arrivalSting(p))
    }
  })
})
