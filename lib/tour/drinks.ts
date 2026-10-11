/**
 * Rewards are not tied to venues. The tour earns two free Wolfie's drinks,
 * banked off progress rather than any one bar: the first once the third
 * stop's story has been heard, the second at the finale (the last stop).
 *
 * Wolfie's is Rod Stewart's rock 'n' roll blended Scotch. The serve (neat,
 * rocks, or long with a mixer) is part of the sponsor deal.
 */

export const WOLFIES = {
  name: "Wolfie's",
  /** White script, for dark surfaces. */
  logoWhite: '/brand/wolfies-white.png',
  /** Black script, for acid and paper surfaces. */
  logoBlack: '/brand/wolfies-black.png',
  logoAspect: 1028 / 714,
  blurb: "Rod Stewart's rock 'n' roll blended Scotch.",
  serve: 'Neat, on the rocks, or long with a mixer.',
} as const

export const DRINK_EXPIRY_DAYS = 7

/** The stop whose story earns the first drink. */
export const FIRST_DRINK_STOP = 3

export type DrinkId = 1 | 2

export interface DrinkMilestone {
  id: DrinkId
  /** Position of the stop that earns it. */
  stop: number
}

/** Drink 1 after stop 3; drink 2 at the finale, whatever its position. */
export function drinkMilestones(positions: number[]): DrinkMilestone[] {
  if (positions.length === 0) return []
  const last = Math.max(...positions)
  return [
    { id: 1, stop: Math.min(FIRST_DRINK_STOP, last) },
    { id: 2, stop: last },
  ]
}

/** The drink this stop earns, if any. */
export function drinkForStop(position: number, positions: number[]): DrinkMilestone | null {
  return drinkMilestones(positions).find((d) => d.stop === position) ?? null
}

/** Drinks earned so far, given the stops whose stories have been heard. */
export function drinksEarned(bankedStops: number[], positions: number[]): DrinkMilestone[] {
  return drinkMilestones(positions).filter((d) => bankedStops.includes(d.stop))
}

/** The next drink still to earn and how many stops away it is, or null. */
export function nextDrink(
  bankedStops: number[],
  positions: number[],
): { drink: DrinkMilestone; stopsAway: number } | null {
  const pending = drinkMilestones(positions).find((d) => !bankedStops.includes(d.stop))
  if (!pending) return null
  const stopsAway = positions.filter(
    (p) => p <= pending.stop && !bankedStops.includes(p),
  ).length
  return { drink: pending, stopsAway }
}
