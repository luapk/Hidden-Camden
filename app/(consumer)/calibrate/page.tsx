'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { haversineDistance } from '@/lib/geo'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const CALIB_KEY = 'cc-calib'

// Camden Town tube — default map centre
const CAMDEN_LAT = 51.5394
const CAMDEN_LNG = -0.1429

type Override = { fenceLat: number; fenceLng: number }
type CalibData = Record<number, Override>

type GpsFix = {
  lat: number
  lng: number
  accuracy: number
  ts: number
}

function loadCalib(): CalibData {
  try {
    const raw = localStorage.getItem(CALIB_KEY)
    return raw ? (JSON.parse(raw) as CalibData) : {}
  } catch {
    return {}
  }
}

function saveCalib(data: CalibData): void {
  try {
    localStorage.setItem(CALIB_KEY, JSON.stringify(data))
  } catch {}
}

function effectiveFence(stop: TourStop, overrides: CalibData): { lat: number; lng: number } {
  const ov = overrides[stop.position]
  if (ov) return { lat: ov.fenceLat, lng: ov.fenceLng }
  return { lat: stop.fenceLat ?? stop.lat, lng: stop.fenceLng ?? stop.lng }
}

function accuracyColour(m: number): string {
  if (m <= 20) return '#84CC16'
  if (m <= 50) return '#C9933C'
  return '#D8432F'
}

function exportLines(overrides: CalibData): string {
  const lines: string[] = []
  for (const stop of LAUNCH_ROUTE) {
    const ov = overrides[stop.position]
    if (!ov) continue
    lines.push(
      `// Stop ${stop.position}: ${stop.name}`,
      `fenceLat: ${ov.fenceLat.toFixed(5)},`,
      `fenceLng: ${ov.fenceLng.toFixed(5)},`,
      '',
    )
  }
  return lines.join('\n').trimEnd()
}

export default function CalibratePage() {
  const [fix, setFix] = useState<GpsFix | null>(null)
  const [watching, setWatching] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<CalibData>({})
  const [copied, setCopied] = useState(false)
  const watchId = useRef<number | null>(null)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    setOverrides(loadCalib())
  }, [])

  // Pan map to new fix, but only if user hasn't zoomed/panned away recently
  useEffect(() => {
    if (!fix || !mapRef.current) return
    mapRef.current.flyTo({ center: [fix.lng, fix.lat], speed: 1.2, essential: false })
  }, [fix])

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser.')
      return
    }
    setWatching(true)
    setGpsError(null)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp,
        })
        setGpsError(null)
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000 },
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setWatching(false)
  }, [])

  // Clear watch on unmount
  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    },
    [],
  )

  const setFenceHere = useCallback(
    (stop: TourStop) => {
      if (!fix) return
      const next: CalibData = {
        ...overrides,
        [stop.position]: { fenceLat: fix.lat, fenceLng: fix.lng },
      }
      setOverrides(next)
      saveCalib(next)
    },
    [fix, overrides],
  )

  const clearOverride = useCallback(
    (position: number) => {
      const next = { ...overrides }
      delete next[position]
      setOverrides(next)
      saveCalib(next)
    },
    [overrides],
  )

  const copyExport = useCallback(async () => {
    const text = exportLines(overrides)
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [overrides])

  const hasOverrides = Object.keys(overrides).length > 0
  const ageS = fix ? Math.round((Date.now() - fix.ts) / 1000) : null

  return (
    <main className="min-h-screen bg-ink pb-8 text-paper">
      <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">

        {/* Header */}
        <div>
          <h1 className="font-display text-xl uppercase tracking-[0.08em]">GPS Calibration</h1>
          <p className="mt-0.5 font-mono text-[10px] text-smoke">
            Stand at each venue entrance. Start GPS. Set fence here. Export.
          </p>
        </div>

        {/* GPS status */}
        <div className="rounded-lg bg-[#1e1a17] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">GPS fix</span>
            <button
              onClick={watching ? stopWatch : startWatch}
              className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                watching
                  ? 'bg-camden/20 text-camden'
                  : 'bg-paper/10 text-paper hover:bg-paper/20'
              }`}
            >
              {watching ? 'Stop' : 'Start GPS'}
            </button>
          </div>

          {gpsError && (
            <p className="mt-2 font-mono text-[11px] text-camden">{gpsError}</p>
          )}

          {fix ? (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-smoke">Lat</div>
                <div className="font-mono text-[14px] tabular-nums">{fix.lat.toFixed(6)}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-smoke">Lng</div>
                <div className="font-mono text-[14px] tabular-nums">{fix.lng.toFixed(6)}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-smoke">Accuracy</div>
                <div
                  className="font-mono text-[14px]"
                  style={{ color: accuracyColour(fix.accuracy) }}
                >
                  ±{Math.round(fix.accuracy)} m
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-smoke">Age</div>
                <div className={`font-mono text-[14px] ${ageS !== null && ageS > 10 ? 'text-camden' : ''}`}>
                  {ageS}s ago
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 font-mono text-[11px] text-smoke">
              {watching ? 'Waiting for fix…' : 'Tap Start GPS to begin.'}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="h-64 overflow-hidden rounded-lg">
          <Map
            ref={mapRef}
            initialViewState={{ latitude: CAMDEN_LAT, longitude: CAMDEN_LNG, zoom: 15.5 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE}
          >
            {/* Current position dot */}
            {fix && (
              <Marker latitude={fix.lat} longitude={fix.lng}>
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </Marker>
            )}

            {/* Stop fence markers */}
            {LAUNCH_ROUTE.map((stop) => {
              const pos = effectiveFence(stop, overrides)
              const isCalibrated = !!overrides[stop.position]
              return (
                <Marker key={stop.position} latitude={pos.lat} longitude={pos.lng}>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 font-mono text-[9px] font-bold ${
                      isCalibrated
                        ? 'border-[#84CC16] bg-[#1e1a17] text-[#84CC16]'
                        : 'border-camden bg-[#1e1a17] text-camden'
                    }`}
                  >
                    {stop.position}
                  </div>
                </Marker>
              )
            })}
          </Map>
        </div>

        {/* Legend */}
        <div className="flex gap-4 font-mono text-[9px] text-smoke">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-camden bg-[#1e1a17]" />
            original
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-[#84CC16] bg-[#1e1a17]" />
            calibrated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
            you
          </span>
        </div>

        {/* Stop list */}
        <div className="space-y-2">
          {LAUNCH_ROUTE.map((stop) => {
            const fencePos = effectiveFence(stop, overrides)
            const dist = fix
              ? Math.round(haversineDistance(fix.lat, fix.lng, fencePos.lat, fencePos.lng))
              : null
            const isCalibrated = !!overrides[stop.position]
            const insideFence = dist !== null && dist <= stop.radiusM

            return (
              <div key={stop.position} className="rounded-lg bg-[#1e1a17] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9px] text-smoke">{stop.position}</span>
                      <span className="font-display text-[13px] uppercase tracking-[0.06em] leading-tight">
                        {stop.name}
                      </span>
                      {isCalibrated && (
                        <span className="rounded bg-[#84CC16]/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#84CC16]">
                          calibrated
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 font-mono text-[10px] text-smoke">
                      fence {fencePos.lat.toFixed(5)}, {fencePos.lng.toFixed(5)}
                    </div>

                    {isCalibrated && (
                      <div className="font-mono text-[9px] text-smoke/60">
                        original {(stop.fenceLat ?? stop.lat).toFixed(5)}, {(stop.fenceLng ?? stop.lng).toFixed(5)}
                      </div>
                    )}

                    {dist !== null && (
                      <div
                        className="mt-1 font-mono text-[10px]"
                        style={{ color: insideFence ? '#84CC16' : dist < stop.radiusM * 2 ? '#C9933C' : '#8A8077' }}
                      >
                        {insideFence ? 'INSIDE FENCE' : `${dist} m away`}
                        {' · '}r = {stop.radiusM} m
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => setFenceHere(stop)}
                      disabled={!fix}
                      className="rounded bg-brass/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-brass disabled:opacity-30 hover:bg-brass/30 transition-colors"
                    >
                      Set here
                    </button>
                    {isCalibrated && (
                      <button
                        onClick={() => clearOverride(stop.position)}
                        className="rounded bg-camden/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-camden hover:bg-camden/25 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Export */}
        {hasOverrides && (
          <div className="rounded-lg bg-[#1e1a17] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
                Export to launchRoute.ts
              </span>
              <button
                onClick={copyExport}
                className="rounded bg-paper/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-paper hover:bg-paper/20 transition-colors"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <p className="mt-1 font-mono text-[9px] text-smoke">
              Paste fenceLat/fenceLng into each matching stop in launchRoute.ts
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-[#84CC16]">
              {exportLines(overrides)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg border border-paper/10 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke mb-2">How to use</div>
          <ol className="space-y-1.5 font-mono text-[10px] text-smoke">
            <li>1. Walk to the entrance of a venue.</li>
            <li>2. Wait for accuracy ≤ 20 m (green). 30–50 m (amber) is workable.</li>
            <li>3. Tap <span className="text-brass">Set here</span> on that stop.</li>
            <li>4. Repeat for all venues, then tap <span className="text-paper">Copy</span> and paste into launchRoute.ts.</li>
          </ol>
          <p className="mt-2 font-mono text-[9px] text-smoke/60">
            Calibrations are saved in localStorage and survive page refreshes.
          </p>
        </div>

      </div>
    </main>
  )
}
