'use client'

import { useCallback, useEffect, useState } from 'react'

// The crawl keeps the original key so nobody's progress is lost; other
// tours get their own bucket. Progress is fully independent per tour.
function storageKeyFor(tourId: string): string {
  return tourId === 'crawl' ? 'cc-tour' : `cc-tour-${tourId}`
}

export interface TourProgress {
  unlockedStops: number[]
  bankedStops: number[]
  currentStop: number
  /** True once the user has been within 50m of Camden Town tube. */
  tourStarted: boolean
}

const DEFAULT_PROGRESS: TourProgress = {
  unlockedStops: [],
  bankedStops: [],
  currentStop: 1,
  tourStarted: false,
}

function load(storageKey: string): TourProgress {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return DEFAULT_PROGRESS
    const parsed = JSON.parse(raw) as Partial<TourProgress>
    return {
      unlockedStops: Array.isArray(parsed.unlockedStops)
        ? parsed.unlockedStops
        : [],
      bankedStops: Array.isArray(parsed.bankedStops) ? parsed.bankedStops : [],
      currentStop:
        typeof parsed.currentStop === 'number' ? parsed.currentStop : 1,
      tourStarted: parsed.tourStarted === true,
    }
  } catch {
    return DEFAULT_PROGRESS
  }
}

export interface UseTourProgress extends TourProgress {
  /** False until the localStorage read has happened on the client. */
  hydrated: boolean
  unlockStop: (n: number) => void
  bankStop: (n: number) => void
  startTour: () => void
  reset: () => void
}

/**
 * localStorage-backed tour progress, one bucket per tour.
 * The whole tour is open: no paywall. A stop is 'banked' once its story has
 * been heard (halfway, finished, or closed); drinks are earned off that.
 */
export function useTourProgress(tourId: string = 'crawl'): UseTourProgress {
  const storageKey = storageKeyFor(tourId)
  const [progress, setProgress] = useState<TourProgress>(DEFAULT_PROGRESS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProgress(load(storageKey))
    setHydrated(true)
  }, [storageKey])

  const save = useCallback(
    (updater: (p: TourProgress) => TourProgress) => {
      setProgress((prev) => {
        const next = updater(prev)
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          /* private mode or full storage: progress survives in memory */
        }
        return next
      })
    },
    [storageKey],
  )

  const unlockStop = useCallback(
    (n: number) =>
      save((p) =>
        p.unlockedStops.includes(n)
          ? p
          : {
              ...p,
              unlockedStops: [...p.unlockedStops, n].sort((a, b) => a - b),
              currentStop: Math.max(p.currentStop, n),
            },
      ),
    [save],
  )

  const bankStop = useCallback(
    (n: number) =>
      save((p) => ({
        ...p,
        unlockedStops: p.unlockedStops.includes(n)
          ? p.unlockedStops
          : [...p.unlockedStops, n].sort((a, b) => a - b),
        bankedStops: p.bankedStops.includes(n)
          ? p.bankedStops
          : [...p.bankedStops, n].sort((a, b) => a - b),
        currentStop: Math.max(p.currentStop, n + 1),
      })),
    [save],
  )

  const startTour = useCallback(
    () => save((p) => ({ ...p, tourStarted: true })),
    [save],
  )

  const reset = useCallback(() => save(() => DEFAULT_PROGRESS), [save])

  return { ...progress, hydrated, unlockStop, bankStop, startTour, reset }
}
