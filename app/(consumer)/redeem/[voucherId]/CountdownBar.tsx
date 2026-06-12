'use client'

import { useEffect, useState } from 'react'

const CODE_TTL_MS = 60_000

/**
 * Drains from full to empty between mint and codeExpiresAt.
 * The bar is theatre; the server expiry is law. When the client clock
 * hits zero we tell the parent so it can offer a fresh code.
 */
export default function CountdownBar({
  expiresAt,
  onExpired,
}: {
  expiresAt: number // epoch ms
  onExpired: () => void
}) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAt - Date.now()),
  )

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()))
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    if (remainingMs <= 0) onExpired()
  }, [remainingMs, onExpired])

  const pct = Math.min(100, (remainingMs / CODE_TTL_MS) * 100)
  const secs = Math.ceil(remainingMs / 1000)

  return (
    <div>
      <div className="my-3 h-2 overflow-hidden rounded bg-[#d8c9a8]">
        <div
          className="h-full bg-camden"
          style={{ width: `${pct}%`, transition: 'width 250ms linear' }}
        />
      </div>
      <div className="text-center font-mono text-[11px] text-[#6b5c44]">
        Live for {secs}s. The code dies, the drink does not. Reopen any time.
      </div>
    </div>
  )
}
