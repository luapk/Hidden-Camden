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
const SEGMENT_MS = 1200 // per hop; 11 waypoints ≈ 13.2s, plus a short settle

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
  const camsRef = useRef<any[]>([])
  const stepRef = useRef(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    KEY ? 'loading' : 'error',
  )
  const [error, setError] = useState<string | null>(
    KEY ? null : 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the 3D preview.',
  )
  const [flying, setFlying] = useState(false)

  const runFlight = useCallback(() => {
    const map = mapRef.current
    const cams = camsRef.current
    if (!map || cams.length === 0) return
    stepRef.current = 0
    setFlying(true)
    map.flyCameraTo({ endCamera: cams[0], durationMillis: SEGMENT_MS })
  }, [])

  useEffect(() => {
    if (!KEY) return
    let cancelled = false
    let map: any = null
    let onEnd: (() => void) | null = null

    ;(async () => {
      try {
        installMapsLoader(KEY)
        if (cancelled) return
        const g = (window as any).google
        const { Map3DElement, Marker3DElement, Polyline3DElement, AltitudeMode } =
          await g.maps.importLibrary('maps3d')
        if (cancelled || !holderRef.current) return

        // Establishing shot: high over the start, looking toward stop 1.
        map = new Map3DElement({
          center: { ...WAYPOINTS[0], altitude: 0 },
          range: 1400,
          tilt: 40,
          heading: bearing(WAYPOINTS[0], WAYPOINTS[1]),
          mode: 'HYBRID',
        })
        map.style.width = '100%'
        map.style.height = '100%'
        holderRef.current.appendChild(map)
        mapRef.current = map

        // The route line, clamped to the ground.
        const line = new Polyline3DElement({
          altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
          strokeColor: '#CCFF00',
          strokeWidth: 8,
          coordinates: WAYPOINTS.map((w) => ({ lat: w.lat, lng: w.lng })),
        })
        map.append(line)

        // A pin per stop (skip the tube), numbered.
        WAYPOINTS.slice(1).forEach((w, i) => {
          const marker = new Marker3DElement({
            position: { lat: w.lat, lng: w.lng, altitude: 0 },
            altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
            label: String(i + 1),
          })
          map.append(marker)
        })

        // Low, route-following camera at each waypoint, then a settle pull-up.
        const cams: any[] = WAYPOINTS.map((w, i) => ({
          center: { lat: w.lat, lng: w.lng, altitude: 0 },
          range: 230,
          tilt: 62,
          heading: bearing(WAYPOINTS[Math.max(0, i - 1)], w),
        }))
        cams.push({
          center: { ...WAYPOINTS[WAYPOINTS.length - 1], altitude: 0 },
          range: 600,
          tilt: 45,
          heading: bearing(
            WAYPOINTS[WAYPOINTS.length - 2],
            WAYPOINTS[WAYPOINTS.length - 1],
          ),
        })
        camsRef.current = cams

        // Chain the hops on each animation end.
        onEnd = () => {
          stepRef.current += 1
          if (stepRef.current >= cams.length) {
            setFlying(false)
            return
          }
          const last = stepRef.current === cams.length - 1
          map.flyCameraTo({
            endCamera: cams[stepRef.current],
            durationMillis: last ? 1400 : SEGMENT_MS,
          })
        }
        map.addEventListener('gmp-animationend', onEnd)

        setStatus('ready')
        // Kick off after a beat so the tiles start streaming.
        window.setTimeout(() => {
          if (!cancelled) runFlight()
        }, 900)
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
      if (map && onEnd) map.removeEventListener('gmp-animationend', onEnd)
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
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
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
