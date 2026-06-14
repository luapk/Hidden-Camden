'use client'

import { useEffect, useRef, useState } from 'react'
import { haversineDistance } from './index'
import { createDwellTracker } from './dwell'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy: number
}

export type GeoPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'

export interface WatchPositionResult {
  position: GeoPosition | null
  error: string | null
  permissionState: GeoPermissionState
}

/**
 * Wraps navigator.geolocation.watchPosition. High accuracy, 10s timeout.
 * Cleans up the watch on unmount.
 */
export function useWatchPosition(): WatchPositionResult {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] =
    useState<GeoPermissionState>('unknown')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation is not available on this device.')
      setPermissionState('denied')
      return
    }

    let cancelled = false

    // Best effort: reflect the permission state if the API exists.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (cancelled) return
          setPermissionState(status.state as GeoPermissionState)
          status.onchange = () => {
            if (!cancelled) setPermissionState(status.state as GeoPermissionState)
          }
        })
        .catch(() => {
          /* permission introspection unsupported; watchPosition will tell us */
        })
    }

    const watchId = navigator.geolocation.watchPosition(
      (fix) => {
        if (cancelled) return
        setPosition({
          lat: fix.coords.latitude,
          lng: fix.coords.longitude,
          accuracy: fix.coords.accuracy,
        })
        setError(null)
        setPermissionState('granted')
      },
      (err) => {
        if (cancelled) return
        setError(err.message)
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied')
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 2_000 },
    )

    return () => {
      cancelled = true
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { position, error, permissionState }
}

export interface GeofenceTarget {
  lat: number
  lng: number
  radiusM: number
}

export interface GeofenceResult {
  position: GeoPosition | null
  error: string | null
  permissionState: GeoPermissionState
  /** Metres from the target centre, null until we have a fix and a target. */
  distanceM: number | null
  inside: boolean
  /** 0..1 progress through the dwell window. */
  dwellProgress: number
  /** Flips true after dwellMs continuously inside the fence. Latches. */
  triggered: boolean
  /**
   * True when the current fix is too imprecise to trust for unlocking. The UI
   * uses this to say "improving GPS" instead of showing a misleading distance.
   */
  lowAccuracy: boolean
}

/**
 * A fix worse than this (metres of reported accuracy) is too vague to unlock
 * a 30m fence: we keep showing distance but never count it as "inside", so a
 * wild fix can't trip a stop. Real urban fixes settle well under this.
 */
export const ACCURACY_GATE_M = 80

/**
 * Watches the user's position against a geofence target. `triggered` flips
 * true only after the user has been continuously inside the fence for
 * dwellMs; leaving the fence resets the timer.
 *
 * Pass `override` to feed a simulated position (dev affordance) instead of
 * the real watcher fix.
 */
export function useGeofence(
  target: GeofenceTarget | null,
  dwellMs = 8_000,
  override: GeoPosition | null = null,
): GeofenceResult {
  const watch = useWatchPosition()
  const position = override ?? watch.position

  const targetLat = target?.lat
  const targetLng = target?.lng
  const targetRadiusM = target?.radiusM

  const distanceM =
    position && targetLat !== undefined && targetLng !== undefined
      ? haversineDistance(position.lat, position.lng, targetLat, targetLng)
      : null

  // A simulated override carries accuracy 5; real fixes carry the device's
  // reported accuracy. Anything vaguer than the gate is shown but never
  // counts toward unlocking.
  const lowAccuracy =
    position !== null && position.accuracy > ACCURACY_GATE_M

  const inside =
    distanceM !== null &&
    targetRadiusM !== undefined &&
    distanceM <= targetRadiusM &&
    !lowAccuracy

  const insideRef = useRef(inside)
  insideRef.current = inside

  // requireApproach: you must be seen outside the fence before the dwell can
  // start, so one overlapping fix can't unlock the next stop the moment the
  // previous one unlocks. Stops only ever unlock in order, on arrival.
  const trackerRef = useRef(
    createDwellTracker(dwellMs, { requireApproach: true }),
  )
  const [dwell, setDwell] = useState({ dwellProgress: 0, triggered: false })

  // Fresh tracker whenever the target (or dwell window) changes.
  useEffect(() => {
    trackerRef.current = createDwellTracker(dwellMs, { requireApproach: true })
    setDwell({ dwellProgress: 0, triggered: false })
  }, [targetLat, targetLng, targetRadiusM, dwellMs])

  // Tick the dwell state machine so progress animates between GPS fixes.
  useEffect(() => {
    if (targetLat === undefined) return
    const id = setInterval(() => {
      const next = trackerRef.current.update(insideRef.current, Date.now())
      setDwell((prev) =>
        prev.dwellProgress === next.dwellProgress &&
        prev.triggered === next.triggered
          ? prev
          : next,
      )
    }, 200)
    return () => clearInterval(id)
  }, [targetLat, targetLng, targetRadiusM])

  return {
    position,
    error: watch.error,
    permissionState: watch.permissionState,
    distanceM,
    inside,
    dwellProgress: dwell.dwellProgress,
    triggered: dwell.triggered,
    lowAccuracy,
  }
}
