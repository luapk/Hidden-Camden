'use client'

import { useMemo, useRef } from 'react'
import {
  Layer,
  Map,
  Marker,
  Source,
  type MapRef,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CheckCircle, Crosshair, LockSimple } from '@phosphor-icons/react'
import type { TourStop } from '@/lib/tour/launchRoute'
import type { GeoPosition } from '@/lib/geo/useGeofence'

export interface TourMapProps {
  stops: TourStop[]
  userPosition: GeoPosition | null
  unlockedStops: number[]
  bankedStops: number[]
  nextPosition: number | null
  onSelectStop: (stop: TourStop) => void
}

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const LOCKED_GREY = '#9CA3AF'

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
    const lats = sorted.map((s) => s.lat)
    const lngs = sorted.map((s) => s.lng)
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
        coordinates: sorted.map((s) => [s.lng, s.lat]),
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
      >
        <Source id="cc-route" type="geojson" data={routeLine}>
          <Layer
            id="cc-route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': '#D8432F',
              'line-width': 4,
              'line-opacity': 0.7,
            }}
          />
        </Source>

        {sorted.map((stop) => {
          const banked = bankedStops.includes(stop.position)
          const unlocked = unlockedStops.includes(stop.position)
          const isNext = stop.position === nextPosition
          const locked = !banked && !unlocked && !isNext
          const background = locked ? LOCKED_GREY : stop.accent

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
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-display text-[13px] text-white shadow-md"
                style={{ backgroundColor: background }}
              >
                {banked ? (
                  <CheckCircle size={17} weight="fill" />
                ) : locked ? (
                  <LockSimple size={14} weight="bold" />
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
                className="absolute rounded-full bg-electric/10"
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
        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-lg disabled:opacity-40"
      >
        <Crosshair size={22} weight="bold" color="#2563EB" />
      </button>
    </div>
  )
}
