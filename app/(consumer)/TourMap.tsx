'use client'

import { useCallback, useMemo, useRef } from 'react'
import {
  Layer,
  Map,
  Marker,
  Source,
  type MapRef,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Check, Crosshair, FlagCheckered, LockSimple } from '@phosphor-icons/react'
import { START_POINT, type TourStop } from '@/lib/tour/launchRoute'
import type { GeoPosition } from '@/lib/geo/useGeofence'

export interface TourMapProps {
  stops: TourStop[]
  userPosition: GeoPosition | null
  unlockedStops: number[]
  bankedStops: number[]
  nextPosition: number | null
  onSelectStop: (stop: TourStop) => void
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const ACID = '#CCFF00'

export default function TourMap({
  stops,
  userPosition,
  unlockedStops,
  bankedStops,
  nextPosition,
  onSelectStop,
}: TourMapProps) {
  const mapRef = useRef<MapRef>(null)

  const sorted = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops],
  )

  const bounds = useMemo(() => {
    const lats = [START_POINT.lat, ...sorted.map((s) => s.lat)]
    const lngs = [START_POINT.lng, ...sorted.map((s) => s.lng)]
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ] as [[number, number], [number, number]]
  }, [sorted])

  const routeLine = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [START_POINT.lng, START_POINT.lat] as [number, number],
          ...sorted.map((s) => [s.lng, s.lat] as [number, number]),
        ],
      },
    }),
    [sorted],
  )

  const recenter = () => {
    if (!userPosition) return
    mapRef.current?.flyTo({
      center: [userPosition.lng, userPosition.lat],
      zoom: 16,
      duration: 1200,
    })
  }

  // Mute the stock Carto labels and road contrast so the basemap recedes
  // and the acid route reads as the brightest thing on the canvas.
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    try {
      const layers = map.getStyle()?.layers ?? []
      for (const layer of layers) {
        try {
          if (layer.type === 'symbol') {
            map.setPaintProperty(layer.id, 'text-color', '#6A6A6F')
            map.setPaintProperty(layer.id, 'text-halo-color', '#000000')
          } else if (
            layer.type === 'line' &&
            /road|street|highway|motorway|bridge|tunnel/i.test(layer.id)
          ) {
            map.setPaintProperty(layer.id, 'line-opacity', 0.5)
          }
        } catch {
          // Layer ids and paint props vary by style version. Skip silently.
        }
      }
    } catch {
      // Style not ready or shape changed. The stock dark style still works.
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{
          bounds,
          fitBoundsOptions: { padding: 56 },
        }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        onLoad={handleLoad}
      >
        <Source id="cc-route" type="geojson" data={routeLine}>
          {/* Glow underlay */}
          <Layer
            id="cc-route-glow"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': ACID,
              'line-width': 10,
              'line-opacity': 0.12,
            }}
          />
          <Layer
            id="cc-route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': ACID,
              'line-width': 3,
            }}
          />
        </Source>

        {/* Start: outside Camden Town tube. */}
        <Marker
          longitude={START_POINT.lng}
          latitude={START_POINT.lat}
          anchor="center"
        >
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-black text-label-1">
              <FlagCheckered size={16} weight="fill" color="#F0E6D2" />
            </span>
            <span className="mt-1 rounded-full bg-black/60 px-2 py-0.5 font-grotesk text-[8px] uppercase tracking-[0.2em] text-label-2 backdrop-blur-sm">
              Start
            </span>
          </div>
        </Marker>

        {sorted.map((stop) => {
          const banked = bankedStops.includes(stop.position)
          const unlocked = unlockedStops.includes(stop.position)
          const isNext = stop.position === nextPosition
          const locked = !banked && !unlocked && !isNext

          return (
            <Marker
              key={stop.position}
              longitude={stop.lng}
              latitude={stop.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                onSelectStop(stop)
              }}
            >
              <button
                aria-label={`Stop ${stop.position}: ${stop.name}`}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full font-grotesk text-[13px] font-bold ${
                  banked
                    ? 'bg-acid text-black shadow-[0_0_24px_rgba(204,255,0,0.35)]'
                    : unlocked
                      ? 'border-2 border-acid bg-acid/25 text-acid shadow-[0_0_18px_rgba(204,255,0,0.2)]'
                      : isNext
                        ? 'cc-next-ring border-2 border-acid bg-black text-acid shadow-[0_0_24px_rgba(204,255,0,0.25)]'
                        : 'border-2 border-white/20 bg-black text-label-2'
                }`}
              >
                {banked ? (
                  <Check size={15} weight="bold" />
                ) : locked ? (
                  <LockSimple size={13} weight="bold" />
                ) : (
                  stop.position
                )}
              </button>
            </Marker>
          )
        })}

        {userPosition && (
          <Marker
            longitude={userPosition.lng}
            latitude={userPosition.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center">
              <span
                className="absolute rounded-full bg-acid/10"
                style={{
                  width: Math.min(120, Math.max(28, userPosition.accuracy)),
                  height: Math.min(120, Math.max(28, userPosition.accuracy)),
                }}
              />
              <span className="cc-user-dot" />
            </div>
          </Marker>
        )}
      </Map>

      <button
        onClick={recenter}
        disabled={!userPosition}
        aria-label="Recenter on your location"
        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-xl disabled:opacity-40"
      >
        <Crosshair size={22} weight="bold" color={ACID} />
      </button>
    </div>
  )
}
