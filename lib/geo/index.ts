const EARTH_RADIUS_M = 6_371_000

/**
 * Haversine formula — returns the great-circle distance in metres between
 * two points on Earth.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_M * c
}

/**
 * Returns true if the given point is within radiusM metres of centre.
 */
export function isWithinGeofence(
  point: { lat: number; lng: number },
  centre: { lat: number; lng: number },
  radiusM: number,
): boolean {
  return haversineDistance(point.lat, point.lng, centre.lat, centre.lng) <= radiusM
}
