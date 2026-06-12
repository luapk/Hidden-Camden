/** No ambiguous glyphs (0/O, 1/I/L, 5/S, 8/B, 6/G, 2/Z, 4/A) */
export const CODE_ALPHABET = 'ACDEFHJKMNPRTWXY' // 16 chars
export const CODE_LENGTH = 4

/**
 * Mints a cryptographically random CODE_LENGTH code from CODE_ALPHABET.
 * Uses crypto.getRandomValues which is available in Node 19+ and edge runtimes.
 */
export function mintCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join('')
}
