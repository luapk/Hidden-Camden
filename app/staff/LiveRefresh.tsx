'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polls the server component on an interval so the bar's "Today" counts and
 * live feed stay current without a manual reload. Renders a compact status
 * line with a pulsing dot and the last-updated time.
 */
export default function LiveRefresh({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date())
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      router.refresh()
      setUpdatedAt(new Date())
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs, paused])

  // Stop polling while the tab is hidden; resume and refresh on return.
  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden'
      setPaused(hidden)
      if (!hidden) {
        router.refresh()
        setUpdatedAt(new Date())
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [router])

  const hhmmss = `${String(updatedAt.getHours()).padStart(2, '0')}:${String(
    updatedAt.getMinutes(),
  ).padStart(2, '0')}:${String(updatedAt.getSeconds()).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-2 font-grotesk text-[10px] uppercase tracking-[0.2em] text-label-3">
      <span className="relative flex h-2 w-2">
        {!paused && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            paused ? 'bg-label-3' : 'bg-acid'
          }`}
        />
      </span>
      <span>{paused ? 'Paused' : 'Live'}</span>
      <span className="text-label-3/70">· {hhmmss}</span>
    </div>
  )
}
