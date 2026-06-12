'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RewardControl {
  id: string
  skuLabel: string
  windowStart: string
  windowEnd: string
  dailyCap: number
  killSwitch: boolean
}

async function post(
  url: string,
  body: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return { ok: true }
    const data = (await res.json()) as { error?: string }
    return { ok: false, error: data.error ?? 'That did not save. Try again.' }
  } catch {
    return { ok: false, error: 'No connection. Try again.' }
  }
}

function RewardRow({ reward }: { reward: RewardControl }) {
  const router = useRouter()
  const [windowStart, setWindowStart] = useState(reward.windowStart)
  const [windowEnd, setWindowEnd] = useState(reward.windowEnd)
  const [dailyCap, setDailyCap] = useState(String(reward.dailyCap))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleKill = async () => {
    setBusy(true)
    setError(null)
    const result = await post(`/api/staff/rewards/${reward.id}/kill-switch`, {
      on: !reward.killSwitch,
    })
    setBusy(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  const saveSettings = async () => {
    setBusy(true)
    setError(null)
    const result = await post(`/api/staff/rewards/${reward.id}/settings`, {
      windowStart,
      windowEnd,
      dailyCap: Number(dailyCap),
    })
    setBusy(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  return (
    <div className="rounded-lg border border-cream/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cream">{reward.skuLabel}</span>
        <button
          onClick={toggleKill}
          disabled={busy}
          className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] disabled:opacity-50 ${
            reward.killSwitch
              ? 'bg-camden text-white'
              : 'bg-cream/10 text-cream'
          }`}
        >
          {reward.killSwitch ? 'Paused. Tap to resume' : 'Kill switch'}
        </button>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
            From
          </span>
          <input
            type="time"
            value={windowStart}
            onChange={(e) => setWindowStart(e.target.value)}
            className="mt-1 block w-full rounded border border-cream/20 bg-ink px-2 py-1.5 font-mono text-[13px] text-cream"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
            To
          </span>
          <input
            type="time"
            value={windowEnd}
            onChange={(e) => setWindowEnd(e.target.value)}
            className="mt-1 block w-full rounded border border-cream/20 bg-ink px-2 py-1.5 font-mono text-[13px] text-cream"
          />
        </label>
        <label className="block w-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
            Cap
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={dailyCap}
            onChange={(e) => setDailyCap(e.target.value)}
            className="mt-1 block w-full rounded border border-cream/20 bg-ink px-2 py-1.5 font-mono text-[13px] text-cream"
          />
        </label>
        <button
          onClick={saveSettings}
          disabled={busy}
          className="rounded bg-cream px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-smoke">
        Takes effect on the next code, not codes already on screen.
      </p>
      {error && (
        <p className="mt-2 font-mono text-[11px] text-camden">{error}</p>
      )}
    </div>
  )
}

function PinControl({ pinRequired }: { pinRequired: boolean }) {
  const router = useRouter()
  const [enteringPin, setEnteringPin] = useState(false)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const turnOff = async () => {
    setBusy(true)
    setError(null)
    const result = await post('/api/staff/venue/pin', { required: false })
    setBusy(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  const turnOn = async () => {
    setBusy(true)
    setError(null)
    const result = await post('/api/staff/venue/pin', { required: true, pin })
    setBusy(false)
    if (result.ok) {
      setEnteringPin(false)
      setPin('')
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="rounded-lg border border-cream/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cream">Staff PIN on tear</span>
        {pinRequired ? (
          <button
            onClick={turnOff}
            disabled={busy}
            className="rounded bg-brass px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink disabled:opacity-50"
          >
            On. Tap to turn off
          </button>
        ) : (
          <button
            onClick={() => setEnteringPin((v) => !v)}
            disabled={busy}
            className="rounded bg-cream/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cream disabled:opacity-50"
          >
            Off. Tap to turn on
          </button>
        )}
      </div>

      {!pinRequired && enteringPin && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            placeholder="4 digits"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            aria-label="New staff PIN"
            className="w-28 rounded border border-cream/20 bg-ink px-2 py-1.5 text-center font-mono text-[15px] tracking-[0.3em] text-cream"
          />
          <button
            onClick={turnOn}
            disabled={pin.length !== 4 || busy}
            className="rounded bg-cream px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      )}
      {error && (
        <p className="mt-2 font-mono text-[11px] text-camden">{error}</p>
      )}
    </div>
  )
}

export default function StaffControls({
  rewards,
  pinRequired,
}: {
  rewards: RewardControl[]
  pinRequired: boolean
}) {
  return (
    <div className="mt-3 space-y-3">
      {rewards.map((reward) => (
        <RewardRow key={reward.id} reward={reward} />
      ))}
      <PinControl pinRequired={pinRequired} />
    </div>
  )
}
