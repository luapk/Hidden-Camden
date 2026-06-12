'use client'

import { useCallback, useState } from 'react'
import CountdownBar from './CountdownBar'

interface VoucherView {
  id: string
  skuLabel: string
  venueName: string
  status: 'banked' | 'redeemed' | 'expired' | 'revoked'
  expiresAt: string
}

interface LiveCode {
  redemptionId: string
  code: string
  expiresAt: number // epoch ms
}

type TicketState =
  | { phase: 'idle' }
  | { phase: 'minting' }
  | { phase: 'live'; live: LiveCode }
  | { phase: 'code-expired' }
  | { phase: 'tearing'; live: LiveCode }
  | { phase: 'pin'; live: LiveCode; pinError: string | null; submitting: boolean }
  | { phase: 'torn'; tornAt: string }
  | { phase: 'error'; message: string; retryable: boolean }

function getDeviceHash(): string {
  const key = 'cc-device'
  let hash = localStorage.getItem(key)
  if (!hash) {
    hash = crypto.randomUUID()
    localStorage.setItem(key, hash)
  }
  return hash
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('no-geolocation'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 5_000,
    })
  })
}

function formatHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

/** Row of punched holes along the tear line. */
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

export default function RedeemTicket({ voucher }: { voucher: VoucherView }) {
  const [state, setState] = useState<TicketState>(() => {
    if (voucher.status === 'redeemed') {
      return { phase: 'torn', tornAt: '' }
    }
    if (voucher.status === 'expired') {
      return {
        phase: 'error',
        message: 'This one is expired. The tour bank keeps drinks for 7 days.',
        retryable: false,
      }
    }
    if (voucher.status === 'revoked') {
      return {
        phase: 'error',
        message: 'This voucher has been revoked. Contact support if that seems wrong.',
        retryable: false,
      }
    }
    return { phase: 'idle' }
  })

  const mint = useCallback(async () => {
    setState({ phase: 'minting' })

    let position: GeolocationPosition
    try {
      position = await getPosition()
    } catch {
      setState({
        phase: 'error',
        message: 'We need your location to confirm you are at the bar.',
        retryable: true,
      })
      return
    }

    try {
      const res = await fetch(`/api/vouchers/${voucher.id}/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          deviceHash: getDeviceHash(),
        }),
      })

      const data = (await res.json()) as {
        redemptionId?: string
        code?: string
        codeExpiresAt?: string
        error?: string
      }

      if (!res.ok || !data.redemptionId || !data.code || !data.codeExpiresAt) {
        setState({
          phase: 'error',
          message: data.error ?? 'Something went sideways. Your drink is still banked.',
          retryable: res.status !== 410,
        })
        return
      }

      setState({
        phase: 'live',
        live: {
          redemptionId: data.redemptionId,
          code: data.code,
          expiresAt: new Date(data.codeExpiresAt).getTime(),
        },
      })
    } catch {
      setState({
        phase: 'error',
        message: 'No connection. Get back on signal and try again. Your drink is still banked.',
        retryable: true,
      })
    }
  }, [voucher.id])

  const tear = useCallback(
    async (live: LiveCode, venuePin?: string) => {
      setState(
        venuePin !== undefined
          ? { phase: 'pin', live, pinError: null, submitting: true }
          : { phase: 'tearing', live },
      )

      try {
        const res = await fetch(`/api/redemptions/${live.redemptionId}/tear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(venuePin ? { venuePin } : {}),
        })

        const data = (await res.json()) as { tornAt?: string; error?: string }

        if (res.ok && data.tornAt) {
          setState({ phase: 'torn', tornAt: data.tornAt })
          return
        }

        if (res.status === 410) {
          // Code died at the tap. The voucher is untouched.
          setState({ phase: 'code-expired' })
          return
        }

        if (res.status === 403 && data.error && /PIN/.test(data.error)) {
          setState({
            phase: 'pin',
            live,
            pinError: venuePin !== undefined ? data.error : null,
            submitting: false,
          })
          return
        }

        setState({
          phase: 'error',
          message: data.error ?? 'That did not go through. Your drink is still banked.',
          retryable: true,
        })
      } catch {
        setState({
          phase: 'error',
          message: 'No connection. Get back on signal and try again. Your drink is still banked.',
          retryable: true,
        })
      }
    },
    [],
  )

  const onCodeExpired = useCallback(() => {
    setState((s) => (s.phase === 'live' ? { phase: 'code-expired' } : s))
  }, [])

  return (
    <div className="rounded-lg bg-paper px-5 py-6 text-ink shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      {/* Ticket header: venue + reward */}
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
        {voucher.venueName}
      </div>
      <div className="mt-1 font-display text-2xl uppercase leading-tight tracking-tight">
        {voucher.skuLabel}
      </div>

      <Perforation />

      {state.phase === 'idle' && (
        <div className="py-2 text-center">
          <p className="font-mono text-[11px] text-[#6b5c44]">
            Banked until {new Date(voucher.expiresAt).toLocaleDateString('en-GB')}.
            Tap when you are at the bar.
          </p>
          <button
            onClick={mint}
            className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-paper"
          >
            Show this at the bar
          </button>
        </div>
      )}

      {state.phase === 'minting' && (
        <div className="py-6 text-center font-mono text-[11px] text-[#6b5c44]">
          Checking you are at the bar...
        </div>
      )}

      {state.phase === 'live' && (
        <div>
          <div className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
            Show this screen, not a screenshot
          </div>
          <div className="my-1 text-center font-mono text-[44px] font-bold tracking-[0.18em]">
            {state.live.code}
          </div>
          <CountdownBar expiresAt={state.live.expiresAt} onExpired={onCodeExpired} />
          <button
            onClick={() => tear(state.live)}
            className="mt-4 w-full rounded-md bg-camden px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-white"
          >
            Staff: tear here
          </button>
          <p className="mt-2 text-center font-mono text-[10px] text-[#6b5c44]">
            Staff only. One tap pours the pint.
          </p>
        </div>
      )}

      {state.phase === 'code-expired' && (
        <div className="py-2 text-center">
          <p className="font-mono text-[12px] text-[#6b5c44]">
            That code is done. Your drink is still banked.
          </p>
          <button
            onClick={mint}
            className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-paper"
          >
            Get a fresh code
          </button>
        </div>
      )}

      {state.phase === 'tearing' && (
        <div className="py-2">
          <div className="my-1 text-center font-mono text-[44px] font-bold tracking-[0.18em] opacity-50">
            {state.live.code}
          </div>
          <button
            disabled
            className="mt-4 w-full rounded-md bg-camden px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-white opacity-60"
          >
            Tearing...
          </button>
        </div>
      )}

      {state.phase === 'pin' && (
        <PinEntry
          error={state.pinError}
          submitting={state.submitting}
          onSubmit={(pin) => tear(state.live, pin)}
        />
      )}

      {state.phase === 'torn' && (
        <div className="py-3 text-center">
          <span className="inline-block -rotate-3 rounded bg-camden/10 px-4 py-1.5 font-display text-2xl uppercase tracking-[0.06em] text-camden">
            Poured
          </span>
          <div className="mt-3 font-mono text-[11px] text-[#6b5c44]">
            {state.tornAt ? `Torn at ${formatHHMM(state.tornAt)} · ` : ''}
            {voucher.venueName}
          </div>
          <p className="mt-3 text-sm text-[#6b5c44]">
            Enjoy. The next story is waiting.
          </p>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="py-2 text-center">
          <p className="text-sm leading-relaxed text-[#6b5c44]">{state.message}</p>
          {state.retryable && (
            <button
              onClick={mint}
              className="mt-4 w-full rounded-md bg-ink px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-paper"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PinEntry({
  error,
  submitting,
  onSubmit,
}: {
  error: string | null
  submitting: boolean
  onSubmit: (pin: string) => void
}) {
  const [pin, setPin] = useState('')

  return (
    <div className="py-2 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
        Staff PIN required
      </div>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        autoComplete="off"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        aria-label="Staff PIN"
        className="mt-3 w-32 rounded-md border-2 border-ink/20 bg-cream px-3 py-2 text-center font-mono text-2xl tracking-[0.3em] text-ink outline-none focus:border-camden"
      />
      {error && (
        <p className="mt-2 font-mono text-[11px] text-camden">{error}</p>
      )}
      <button
        onClick={() => onSubmit(pin)}
        disabled={pin.length !== 4 || submitting}
        className="mt-4 w-full rounded-md bg-camden px-4 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-white disabled:opacity-50"
      >
        {submitting ? 'Tearing...' : 'Tear'}
      </button>
      <p className="mt-2 font-mono text-[10px] text-[#6b5c44]">
        Staff only. Ask the bar for the PIN.
      </p>
    </div>
  )
}
