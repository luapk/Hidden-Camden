'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { START_POINT, LAUNCH_ROUTE } from '@/lib/tour/launchRoute'

/**
 * A photoreal 3D flythrough of the route, on Google's Photorealistic 3D Maps
 * (the same 3D tiles as Google Earth). The camera swoops from Camden Town
 * tube along the ten venues to the Roundhouse in ~14 seconds, with the route
 * drawn as a line and each stop pinned.
 *
 * Needs a Google Maps JavaScript API key with the Map Tiles API /
 * Photorealistic 3D Maps enabled, in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 *
 * The maps3d classes are alpha; we keep them loosely typed (no extra deps).
 */

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// The whole route is one continuous, eased camera path (no per-venue stops).
const DURATION_MS = 60000
// Hold on the opening shot first so the photoreal tiles stream in before the
// camera starts moving.
const START_DELAY_MS = 3500
// Proven route-flyover framing: an elevated oblique so the streets ahead and
// the surrounding context stay visible, with a FIXED heading so the camera
// never rotates. Rotation-to-face-travel is what makes a low chase-cam
// disorientating; here the route simply tracks beneath a steady angle.
const OVERVIEW_RANGE = 450 // camera distance, metres (elevated oblique)
const TILT = 52 // constant oblique angle

type LL = { lat: number; lng: number }

// Waypoints: the tube, then every stop in order.
const WAYPOINTS: { lat: number; lng: number; name: string }[] = [
  { lat: START_POINT.lat, lng: START_POINT.lng, name: 'Camden Town tube' },
  ...[...LAUNCH_ROUTE]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
]

function bearing(a: LL, b: LL): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLon = toRad(b.lng - a.lng)
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// One fixed viewing direction (the overall tube → Roundhouse bearing) so the
// camera tracks the route without ever spinning.
const FIXED_HEADING = bearing(WAYPOINTS[0], WAYPOINTS[WAYPOINTS.length - 1])

// Smooth acceleration in and deceleration out across the whole flight.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// 1D Catmull-Rom interpolation.
function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

// A smooth point on the route for progress u in 0..1 (Catmull-Rom through the
// waypoints, so the corners at each venue round off rather than jerk).
function pathAt(u: number): LL {
  const n = WAYPOINTS.length - 1
  const scaled = Math.max(0, Math.min(1, u)) * n
  const i = Math.min(Math.floor(scaled), n - 1)
  const localT = scaled - i
  const p0 = WAYPOINTS[Math.max(0, i - 1)]
  const p1 = WAYPOINTS[i]
  const p2 = WAYPOINTS[i + 1]
  const p3 = WAYPOINTS[Math.min(n, i + 2)]
  return {
    lat: cr(p0.lat, p1.lat, p2.lat, p3.lat, localT),
    lng: cr(p0.lng, p1.lng, p2.lng, p3.lng, localT),
  }
}

// Install Google's official inline bootstrap loader once. This is what
// defines google.maps.importLibrary (the classic <script> tag does not), and
// it lazy-loads the requested libraries (here, maps3d) on first import.
function installMapsLoader(key: string): void {
  // eslint-disable-next-line
  const w = window as any
  if (w.google?.maps?.importLibrary) return
  ;((g: any) => {
    let h: any, a: any, k: string
    const c = 'google'
    const l = 'importLibrary'
    const q = '__ib__'
    const m = document
    const b = w[c] || (w[c] = {})
    const d = b.maps || (b.maps = {})
    const r = new Set<string>()
    const e = new URLSearchParams()
    const u = () =>
      h ||
      (h = new Promise<void>((f, n) => {
        a = m.createElement('script')
        e.set('libraries', Array.from(r).join(','))
        for (k in g) {
          e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k])
        }
        e.set('callback', c + '.maps.' + q)
        a.src = 'https://maps.' + c + 'apis.com/maps/api/js?' + e
        d[q] = f
        a.onerror = () => (h = n(new Error('Google Maps could not load.')))
        m.head.append(a)
      }))
    if (!d[l]) {
      d[l] = (f: string, ...n: unknown[]) => r.add(f) && u().then(() => d[l](f, ...n))
    }
  })({ key, v: 'alpha' })
}

export default function RouteFlythrough() {
  const holderRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    KEY ? 'loading' : 'error',
  )
  const [error, setError] = useState<string | null>(
    KEY ? null : 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the 3D preview.',
  )
  const [flying, setFlying] = useState(false)

  // One continuous camera path, driven per frame with a global ease-in-out.
  const runFlight = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setFlying(true)
    const start = performance.now()
    let lastFrame = 0
    const frame = (now: number) => {
      const raw = Math.min(1, (now - start) / DURATION_MS)
      // Throttle camera writes to ~30fps so mobile GPUs aren't overloaded.
      if (now - lastFrame >= 33 || raw >= 1) {
        lastFrame = now
        const u = easeInOutCubic(raw)
        const here = pathAt(u)
        // Track the point beneath a fixed angle: no rotation, no zoom.
        map.center = { lat: here.lat, lng: here.lng, altitude: 0 }
        map.heading = FIXED_HEADING
        map.tilt = TILT
        map.range = OVERVIEW_RANGE
      }
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        rafRef.current = null
        setFlying(false)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!KEY) return
    let cancelled = false
    let map: any = null

    ;(async () => {
      try {
        installMapsLoader(KEY)
        if (cancelled) return
        const g = (window as any).google
        const { Map3DElement, Marker3DElement, AltitudeMode } =
          await g.maps.importLibrary('maps3d')
        if (cancelled || !holderRef.current) return

        // Satellite mode: pure photoreal 3D tiles, no basemap road or place
        // labels. Frame on the path's first point so the flight starts with
        // no jump.
        map = new Map3DElement({
          center: { lat: WAYPOINTS[0].lat, lng: WAYPOINTS[0].lng, altitude: 0 },
          range: OVERVIEW_RANGE,
          tilt: TILT,
          heading: FIXED_HEADING,
          mode: 'SATELLITE',
        })
        map.style.width = '100%'
        map.style.height = '100%'
        holderRef.current.appendChild(map)
        mapRef.current = map

        // The only labels on the map: a pin per stop, named (skip the tube).
        WAYPOINTS.slice(1).forEach((w) => {
          const marker = new Marker3DElement({
            position: { lat: w.lat, lng: w.lng, altitude: 0 },
            altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
            label: w.name,
          })
          map.append(marker)
        })

        // Keep the loading cover up while the tiles stream, then reveal the
        // map and start the flight.
        window.setTimeout(() => {
          if (cancelled) return
          setStatus('ready')
          runFlight()
        }, START_DELAY_MS)
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setError(
          e instanceof Error
            ? `${e.message} Check the key has Map Tiles / Photorealistic 3D Maps enabled.`
            : 'Could not start the 3D preview.',
        )
      }
    })()

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (map && map.parentElement) map.parentElement.removeChild(map)
    }
  }, [runFlight])

  return (
    <div className="fixed inset-0 bg-night-1">
      <div ref={holderRef} className="absolute inset-0" />

      {/* Title + controls overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div>
          <div className="font-grotesk text-[10px] font-bold uppercase tracking-[0.3em] text-acid">
            The route
          </div>
          <div className="mt-1 font-jost text-[22px] font-bold uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Camden Town → Roundhouse
          </div>
        </div>
        <Link
          href="/"
          className="pointer-events-auto rounded-full border border-white/25 bg-black/50 px-3 py-1.5 font-grotesk text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur"
        >
          Close
        </Link>
      </div>

      {status === 'ready' && (
        <button
          onClick={runFlight}
          disabled={flying}
          className="absolute bottom-[max(env(safe-area-inset-bottom),20px)] left-1/2 -translate-x-1/2 rounded-full bg-acid px-6 py-3 font-jost text-[14px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_28px_rgba(204,255,0,0.35)] disabled:opacity-60"
        >
          {flying ? 'Flying the route…' : 'Replay flythrough'}
        </button>
      )}

      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-1 p-8 text-center">
          <div className="max-w-xs">
            {status === 'loading' && (
              <p className="font-grotesk text-[12px] uppercase tracking-[0.2em] text-label-3">
                Loading the 3D route…
              </p>
            )}
            {status === 'error' && (
              <>
                <p className="font-jost text-[18px] font-bold uppercase tracking-tight text-label-1">
                  3D preview unavailable
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-label-2">
                  {error}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
