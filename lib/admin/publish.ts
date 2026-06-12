import { haversineDistance } from '@/lib/geo'

export type PublishStopInput = {
  position: number
  audio_url: string | null
  transcript: string | null
  venue: { lat: number; lng: number; geofence_radius_m: number; status: string }
  reward: { kill_switch: boolean }
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateRouteForPublish(stops: PublishStopInput[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const stop of stops) {
    const label = `Stop ${stop.position}`
    if (!stop.audio_url) errors.push(`${label}: audio file required.`)
    if (!stop.transcript) errors.push(`${label}: transcript required.`)
    if (stop.venue.status !== 'live') errors.push(`${label}: venue must be live before publishing.`)
    if (stop.reward.kill_switch) errors.push(`${label}: reward kill switch is on.`)
  }

  const sorted = [...stops].sort((a, b) => a.position - b.position)
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const dist = haversineDistance(a.venue.lat, a.venue.lng, b.venue.lat, b.venue.lng)
    const combined = a.venue.geofence_radius_m + b.venue.geofence_radius_m
    if (dist < combined) {
      warnings.push(
        `Stops ${a.position} and ${b.position}: geofences overlap by ${Math.round(combined - dist)}m. Camden is dense — advisory only.`,
      )
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
