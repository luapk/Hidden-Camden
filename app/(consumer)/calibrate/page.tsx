'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { Marker, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { haversineDistance } from '@/lib/geo'
import { LAUNCH_ROUTE, type TourStop } from '@/lib/tour/launchRoute'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const FENCE_KEY = 'cc-calib'
const PIN_KEY = 'cc-calib-pins'

const CAMDEN_LAT = 51.5394
const CAMDEN_LNG = -0.1429

type FenceOverride = { fenceLat: number; fenceLng: number }
type PinOverride = { lat: number; lng: number }
type FenceData = Record<number, FenceOverride>
type PinData = Record<number, PinOverride>

type GpsFix = { lat: number; lng: number; accuracy: number; ts: number }

// ── persistence ──────────────────────────────────────────────────────────────

function load<T>(key: string): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : ({} as T)
  } catch {
    return {} as T
  }
}
function save(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── derived helpers ───────────────────────────────────────────────────────────

function effectiveFence(stop: TourStop, fences: FenceData): { lat: number; lng: number } {
  const ov = fences[stop.position]
  if (ov) return { lat: ov.fenceLat, lng: ov.fenceLng }
  return { lat: stop.fenceLat ?? stop.lat, lng: stop.fenceLng ?? stop.lng }
}

function effectivePin(stop: TourStop, pins: PinData): { lat: number; lng: number } {
  return pins[stop.position] ?? { lat: stop.lat, lng: stop.lng }
}

function accuracyColour(m: number): string {
  if (m <= 20) return '#84CC16'
  if (m <= 50) return '#C9933C'
  return '#D8432F'
}

// ── export ────────────────────────────────────────────────────────────────────

function buildExport(fences: FenceData, pins: PinData): string {
  const lines: string[] = []
  for (const stop of LAUNCH_ROUTE) {
    const fence = fences[stop.position]
    const pin = pins[stop.position]
    if (!fence && !pin) continue
    lines.push(`// Stop ${stop.position}: ${stop.name}`)
    if (pin) {
      lines.push(`lat: ${pin.lat.toFixed(5)},`)
      lines.push(`lng: ${pin.lng.toFixed(5)},`)
    }
    if (fence) {
      lines.push(`fenceLat: ${fence.fenceLat.toFixed(5)},`)
      lines.push(`fenceLng: ${fence.fenceLng.toFixed(5)},`)
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

// ── component ─────────────────────────────────────────────────────────────────

export default function CalibratePage() {
  const [fix, setFix] = useState<GpsFix | null>(null)
  const [watching, setWatching] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [fences, setFences] = useState<FenceData>({})
  const [pins, setPins] = useState<PinData>({})
  // which stop is waiting for a map tap to set its pin (null = not in pin mode)
  const [pinTarget, setPinTarget] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const watchId = useRef<number | null>(null)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    setFences(load<FenceData>(FENCE_KEY))
    setPins(load<PinData>(PIN_KEY))
  }, [])

  useEffect(() => {
    if (!fix || !mapRef.current || pinTarget !== null) return
    mapRef.current.flyTo({ center: [fix.lng, fix.lat], speed: 1.2, essential: false })
  }, [fix, pinTarget])

  // ── GPS ──────────────────────────────────────────────────────────────────────

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported.'); return }
    setWatching(true); setGpsError(null)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, ts: pos.timestamp })
        setGpsError(null)
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000 },
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (watchId.current !== null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null }
    setWatching(false)
  }, [])

  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current) }, [])

  // ── fence (GPS) ───────────────────────────────────────────────────────────────

  const setFenceHere = useCallback((stop: TourStop) => {
    if (!fix) return
    const next = { ...fences, [stop.position]: { fenceLat: fix.lat, fenceLng: fix.lng } }
    setFences(next); save(FENCE_KEY, next)
  }, [fix, fences])

  const clearFence = useCallback((position: number) => {
    const next = { ...fences }; delete next[position]
    setFences(next); save(FENCE_KEY, next)
  }, [fences])

  // ── pin (map tap) ─────────────────────────────────────────────────────────────

  const onMapClick = useCallback((e: MapLayerMouseEvent) => {
    if (pinTarget === null) return
    const { lat, lng } = e.lngLat
    const next = { ...pins, [pinTarget]: { lat, lng } }
    setPins(next); save(PIN_KEY, next)
    setPinTarget(null)
  }, [pinTarget, pins])

  const clearPin = useCallback((position: number) => {
    const next = { ...pins }; delete next[position]
    setPins(next); save(PIN_KEY, next)
  }, [pins])

  // ── export ────────────────────────────────────────────────────────────────────

  const copyExport = useCallback(async () => {
    const text = buildExport(fences, pins)
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [fences, pins])

  const hasChanges = Object.keys(fences).length > 0 || Object.keys(pins).length > 0
  const ageS = fix ? Math.round((Date.now() - fix.ts) / 1000) : null

  return (
    <main className="min-h-screen bg-ink pb-8 text-paper">
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">

        {/* Header */}
        <div>
          <h1 className="font-display text-xl uppercase tracking-[0.08em]">GPS Calibration</h1>
          <p className="mt-0.5 font-mono text-[10px] text-smoke">
            Two separate jobs: tap the map to place the pin. Stand at the venue to set the fence.
          </p>
        </div>

        {/* GPS status */}
        <div className="rounded-lg bg-[#1e1a17] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">GPS fix</span>
            <button
              onClick={watching ? stopWatch : startWatch}
              className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                watching ? 'bg-camden/20 text-camden' : 'bg-paper/10 text-paper hover:bg-paper/20'
              }`}
            >
              {watching ? 'Stop' : 'Start GPS'}
            </button>
          </div>
          {gpsError && <p className="mt-2 font-mono text-[11px] text-camden">{gpsError}</p>}
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
                <div className="font-mono text-[14px]" style={{ color: accuracyColour(fix.accuracy) }}>
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
        <div className={`overflow-hidden rounded-lg ${pinTarget !== null ? 'h-80 ring-2 ring-brass' : 'h-64'}`}>
          {pinTarget !== null && (
            <div className="flex items-center justify-between bg-brass/20 px-3 py-1.5">
              <span className="font-mono text-[10px] text-brass">
                Tap the map to place pin for Stop {pinTarget}
              </span>
              <button
                onClick={() => setPinTarget(null)}
                className="font-mono text-[10px] text-smoke hover:text-paper"
              >
                Cancel
              </button>
            </div>
          )}
          <Map
            ref={mapRef}
            initialViewState={{ latitude: CAMDEN_LAT, longitude: CAMDEN_LNG, zoom: 16 }}
            style={{ width: '100%', height: pinTarget !== null ? 'calc(100% - 32px)' : '100%' }}
            mapStyle={MAP_STYLE}
            cursor={pinTarget !== null ? 'crosshair' : 'grab'}
            onClick={onMapClick}
          >
            {/* GPS dot */}
            {fix && (
              <Marker latitude={fix.lat} longitude={fix.lng}>
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </Marker>
            )}
            {/* Map pins (lat/lng) */}
            {LAUNCH_ROUTE.map((stop) => {
              const pos = effectivePin(stop, pins)
              const isPinSet = !!pins[stop.position]
              return (
                <Marker key={`pin-${stop.position}`} latitude={pos.lat} longitude={pos.lng}>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 font-mono text-[9px] font-bold ${
                      isPinSet
                        ? 'border-brass bg-[#1e1a17] text-brass'
                        : 'border-paper/30 bg-[#1e1a17] text-paper/50'
                    }`}
                  >
                    {stop.position}
                  </div>
                </Marker>
              )
            })}
            {/* Fence centres */}
            {LAUNCH_ROUTE.map((stop) => {
              const pos = effectiveFence(stop, fences)
              const isFenceSet = !!fences[stop.position]
              return (
                <Marker key={`fence-${stop.position}`} latitude={pos.lat} longitude={pos.lng}>
                  <div
                    className={`flex h-3 w-3 items-center justify-center rounded-full border font-mono text-[7px] font-bold ${
                      isFenceSet
                        ? 'border-[#84CC16] bg-[#84CC16]/20 text-[#84CC16]'
                        : 'border-smoke/30 bg-transparent text-smoke/30'
                    }`}
                  />
                </Marker>
              )
            })}
          </Map>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 font-mono text-[9px] text-smoke">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-brass bg-[#1e1a17]" />
            pin (map)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-[#84CC16] bg-[#84CC16]/20" />
            fence (GPS)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
            you (GPS)
          </span>
        </div>

        {/* Stop list */}
        <div className="space-y-2">
          {LAUNCH_ROUTE.map((stop) => {
            const fencePos = effectiveFence(stop, fences)
            const pinPos = effectivePin(stop, pins)
            const dist = fix
              ? Math.round(haversineDistance(fix.lat, fix.lng, fencePos.lat, fencePos.lng))
              : null
            const isFenceSet = !!fences[stop.position]
            const isPinSet = !!pins[stop.position]
            const insideFence = dist !== null && dist <= stop.radiusM
            const isActivePinTarget = pinTarget === stop.position

            return (
              <div
                key={stop.position}
                className={`rounded-lg bg-[#1e1a17] p-3 transition-colors ${isActivePinTarget ? 'ring-2 ring-brass' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9px] text-smoke">{stop.position}</span>
                      <span className="font-display text-[13px] uppercase tracking-[0.06em] leading-tight">
                        {stop.name}
                      </span>
                    </div>

                    {/* Pin row */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-brass w-8">pin</span>
                      <span className="font-mono text-[10px] text-smoke">
                        {pinPos.lat.toFixed(5)}, {pinPos.lng.toFixed(5)}
                        {isPinSet && <span className="ml-1.5 text-brass">✓</span>}
                      </span>
                    </div>

                    {/* Fence row */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#84CC16] w-8">fence</span>
                      <span className="font-mono text-[10px] text-smoke">
                        {fencePos.lat.toFixed(5)}, {fencePos.lng.toFixed(5)}
                        {isFenceSet && <span className="ml-1.5 text-[#84CC16]">✓</span>}
                      </span>
                    </div>

                    {dist !== null && (
                      <div
                        className="mt-1 font-mono text-[10px]"
                        style={{ color: insideFence ? '#84CC16' : dist < stop.radiusM * 2 ? '#C9933C' : '#8A8077' }}
                      >
                        {insideFence ? 'INSIDE FENCE' : `${dist} m to fence`} · r = {stop.radiusM} m
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 flex-col gap-1">
                    {/* Pin button */}
                    <button
                      onClick={() => setPinTarget(isActivePinTarget ? null : stop.position)}
                      className={`rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                        isActivePinTarget
                          ? 'bg-brass text-ink'
                          : 'bg-brass/20 text-brass hover:bg-brass/30'
                      }`}
                    >
                      {isActivePinTarget ? 'Tap map' : 'Set pin'}
                    </button>

                    {/* Fence button */}
                    <button
                      onClick={() => setFenceHere(stop)}
                      disabled={!fix}
                      className="rounded bg-[#84CC16]/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#84CC16] disabled:opacity-30 hover:bg-[#84CC16]/25 transition-colors"
                    >
                      Set fence
                    </button>

                    {/* Clear buttons */}
                    {(isPinSet || isFenceSet) && (
                      <button
                        onClick={() => { if (isPinSet) clearPin(stop.position); if (isFenceSet) clearFence(stop.position) }}
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
        {hasChanges && (
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
              lat/lng = map pin position. fenceLat/fenceLng = geofence centre.
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-[#84CC16]">
              {buildExport(fences, pins)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg border border-paper/10 p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">How to use</div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-brass">Map pin (street address)</div>
          <ol className="space-y-1 font-mono text-[10px] text-smoke">
            <li>1. Zoom the map to the venue street on the accurate map tiles.</li>
            <li>2. Tap <span className="text-brass">Set pin</span> — the map expands with a crosshair cursor.</li>
            <li>3. Tap the exact entrance on the map. Done.</li>
          </ol>
          <div className="mb-2 mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#84CC16]">Geofence (GPS calibration)</div>
          <ol className="space-y-1 font-mono text-[10px] text-smoke">
            <li>1. Stand at the venue entrance. Start GPS.</li>
            <li>2. Wait for accuracy ≤ 20 m (green). 30–50 m (amber) is workable.</li>
            <li>3. Tap <span className="text-[#84CC16]">Set fence</span> on that stop.</li>
          </ol>
          <p className="mt-2 font-mono text-[9px] text-smoke/60">
            Both are saved in localStorage and survive refreshes.
          </p>
        </div>

      </div>
    </main>
  )
}
