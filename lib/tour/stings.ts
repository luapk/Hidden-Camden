/**
 * Guitar stings. One short riff per stop lives in /public/sounds/ as
 * stop-01.mp3 … stop-07.mp3, with reward.wav as the generic fallback.
 *
 * Arrival at a stop plays that stop's own sting. Banking the voucher plays
 * a different sting from the same shelf, offset so the two moments never
 * share a sound at any stop.
 */

const STING_COUNT = 7

function stingSrc(n: number): string {
  return `/sounds/stop-${String(n).padStart(2, '0')}.mp3`
}

/** The stop's own riff, played on arrival/unlock. */
export function arrivalSting(position: number): string {
  return stingSrc(((position - 1) % STING_COUNT) + 1)
}

/**
 * The bank-moment riff: three stops along, wrapping. Offset 3 and 7 are
 * coprime, so this never equals the arrival sting for the same stop.
 */
export function bankSting(position: number): string {
  return stingSrc(((position + 2) % STING_COUNT) + 1)
}

/** The riff that counts the tour in at the start gate takeover. */
export function startSting(): string {
  return stingSrc(2)
}

/** Fire-and-forget playback with the generic reward fallback. */
export function playSting(url: string, volume = 0.7): void {
  const audio = new Audio(url)
  audio.volume = volume
  audio.onerror = () => {
    const fallback = new Audio('/sounds/reward.wav')
    fallback.volume = volume
    fallback.play().catch(() => {})
  }
  audio.play().catch(() => {})
}
