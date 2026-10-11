import { describe, expect, it } from 'vitest'
import { drinkForStop, drinkMilestones, drinksEarned, nextDrink } from '../drinks'

const ROUTE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

describe('drinkMilestones', () => {
  it('earns drink 1 at stop 3 and drink 2 at the finale', () => {
    expect(drinkMilestones(ROUTE)).toEqual([
      { id: 1, stop: 3 },
      { id: 2, stop: 11 },
    ])
  })

  it('has no drinks for an empty route', () => {
    expect(drinkMilestones([])).toEqual([])
  })
})

describe('drinkForStop', () => {
  it('only stops 3 and the finale earn a drink', () => {
    expect(drinkForStop(3, ROUTE)?.id).toBe(1)
    expect(drinkForStop(11, ROUTE)?.id).toBe(2)
    expect(drinkForStop(6, ROUTE)).toBeNull()
    expect(drinkForStop(1, ROUTE)).toBeNull()
  })
})

describe('drinksEarned', () => {
  it('counts only milestone stops that have been heard', () => {
    expect(drinksEarned([1, 2], ROUTE)).toHaveLength(0)
    expect(drinksEarned([1, 2, 3], ROUTE).map((d) => d.id)).toEqual([1])
    expect(drinksEarned(ROUTE, ROUTE).map((d) => d.id)).toEqual([1, 2])
  })
})

describe('nextDrink', () => {
  it('counts the stops left to the next drink', () => {
    expect(nextDrink([], ROUTE)).toEqual({ drink: { id: 1, stop: 3 }, stopsAway: 3 })
    expect(nextDrink([1, 2], ROUTE)?.stopsAway).toBe(1)
    expect(nextDrink([1, 2, 3], ROUTE)).toEqual({ drink: { id: 2, stop: 11 }, stopsAway: 8 })
  })

  it('is null once both drinks are earned', () => {
    expect(nextDrink(ROUTE, ROUTE)).toBeNull()
  })
})
