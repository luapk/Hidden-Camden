export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  // @lat,lng (most common share format)
  let m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  // ?q=lat,lng or &q=lat,lng
  m = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  // /lat%2Clng (URL-encoded comma)
  m = url.match(/\/(-?\d+\.?\d*)%2C(-?\d+\.?\d*)/i)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  return null
}
