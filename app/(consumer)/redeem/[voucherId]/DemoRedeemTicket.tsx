'use client'

import { useCallback, useState } from 'react'
import BrandLogo from '../../BrandLogo'
import CountdownBar from './CountdownBar'

const CODE_CHARS = 'ACDEFHJKMNPRTWXY'
const CODE_TTL_MS = 60_000

function randomCode(): string {
  return Array.from(
    { length: 4 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  ).join('')
}

function formatHHMM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Perforation() {
  return (
    <div className="relative -mx-5 my-4">
      <div className="border-t-2 border-dashed border-[#b9a883]" />
      <div className="absolute inset-x-0 -top-[5px] flex justify-between px-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-ink/15" />
        ))}
      </div>
    </div>
  )
}

type Phase =
  | { name: 'idle' }
  | { name: 'live'; code: string; expiresAt: number }
  | { name: 'expired' }
  | { name: 'torn'; tornAt: number }

export default function DemoRedeemTicket({
  venueName,
  skuLabel,
  rewardWindow,
}: {
  venueName: string
  skuLabel: string
  rewardWindow: string
}) {
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })

  const showAtBar = useCallback(() => {
    setPhase({
      name: 'live',
      code: randomCode(),
      expiresAt: Date.now() + CODE_TTL_MS,
    })
  }, [])

  const onExpired = useCallback(() => {
    setPhase((p) => (p.name === 'live' ? { name: 'expired' } : p))
  }, [])

  const tear = useCallback(() => {
    setPhase({ name: 'torn', tornAt: Date.now() })
  }, [])

  return (
    <div className="rounded-lg bg-paper px-5 py-6 text-ink shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      {/* Letterhead: the brand poster over the paper */}
      <div className="mb-4 flex items-center justify-between border-b border-[#b9a883]/50 pb-3">
        <BrandLogo className="h-auto w-[100px]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#6b5c44]">
          Drink voucher
        </span>
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
        {venueName}
      </div>
      <div className="mt-1 font-display text-2xl uppercase leading-tight tracking-tight">
        {skuLabel}
      </div>

      <Perforation />

      {phase.name === 'idle' && (
        <div className="py-2 text-center">
          <p className="font-mono text-[11px] text-[#6b5c44]">
            Valid {rewardWindow}. Tap when you are at the bar.
          </p>
          <div className="mt-1.5 rounded bg-brass/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-brass">
            Demo mode — no real redemption
          </div>
          <button
            onClick={showAtBar}
            className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-paper"
          >
            Show this at the bar
          </button>
        </div>
      )}

      {phase.name === 'live' && (
        <div>
          <div className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
            Show this screen, not a screenshot
          </div>
          <div className="my-1 text-center font-mono text-[44px] font-bold tracking-[0.18em]">
            {phase.code}
          </div>
          <CountdownBar expiresAt={phase.expiresAt} onExpired={onExpired} />
          <button
            onClick={tear}
            className="mt-4 w-full rounded-md bg-camden px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-white"
          >
            Staff: tear here
          </button>
          <p className="mt-2 text-center font-mono text-[10px] text-[#6b5c44]">
            Staff only. One tap pours the pint.
          </p>
        </div>
      )}

      {phase.name === 'expired' && (
        <div className="py-2 text-center">
          <p className="font-mono text-[12px] text-[#6b5c44]">
            That code is done. Your drink is still banked.
          </p>
          <button
            onClick={showAtBar}
            className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-paper"
          >
            Get a fresh code
          </button>
        </div>
      )}

      {phase.name === 'torn' && (
        <div className="py-3 text-center">
          <span className="inline-block -rotate-3 rounded bg-camden/10 px-4 py-1.5 font-display text-2xl uppercase tracking-[0.06em] text-camden">
            Poured
          </span>
          <div className="mt-3 font-mono text-[11px] text-[#6b5c44]">
            Torn at {formatHHMM(phase.tornAt)} · {venueName}
          </div>
          <p className="mt-3 text-sm text-[#6b5c44]">Enjoy. The next story is waiting.</p>
        </div>
      )}
    </div>
  )
}
