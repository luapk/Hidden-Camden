'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RouteRow = { id: string; name: string; status: string; paywall_after_stop: number; stopCount: number }

const EXAMPLE_ROUTES: RouteRow[] = [
  { id: 'ex-1', name: 'Hidden Camden Launch Route', status: 'live', paywall_after_stop: 2, stopCount: 7 },
]

const GLASS: React.CSSProperties = {
  background: 'rgba(22,18,16,0.55)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(240,230,210,0.08)',
  borderTopColor: 'rgba(240,230,210,0.18)',
  borderLeftColor: 'rgba(240,230,210,0.12)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
}

export default function RoutesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<RouteRow[]>(EXAMPLE_ROUTES)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/admin/routes')
      .then((r) => r.json() as Promise<RouteRow[]>)
      .then((data) => { if (Array.isArray(data) && data.length > 0) setRows(data) })
      .catch(() => {})
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json() as { id?: string }
      if (res.ok && data.id) router.push(`/admin/routes/${data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const liveCount = rows.filter((r) => r.status === 'live').length

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {rows.length} route{rows.length !== 1 ? 's' : ''} · {liveCount} live
        </p>
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Routes
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2.5rem' }}>
        {rows.map((r) => (
          <div key={r.id} style={{ ...GLASS, padding: '1.375rem', position: 'relative', overflow: 'hidden' }}>
            {r.status === 'live' && (
              <div style={{ position: 'absolute', top: '-30px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(216,67,47,0.09)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#F0E6D2' }}>
                  {r.name}
                </h3>
                <span style={{
                  fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', padding: '0.15rem 0.5rem',
                  background: r.status === 'live' ? 'rgba(216,67,47,0.15)' : 'rgba(138,128,119,0.14)',
                  border: `1px solid ${r.status === 'live' ? 'rgba(216,67,47,0.35)' : 'rgba(138,128,119,0.28)'}`,
                  color: r.status === 'live' ? '#D8432F' : '#8A8077',
                  letterSpacing: '0.1em', backdropFilter: 'blur(8px)',
                }}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              <a href={`/admin/routes/${r.id}`} style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', color: '#C9933C', textDecoration: 'none', flexShrink: 0 }}>
                Edit →
              </a>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: '#8A8077', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stops</div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '1.5rem', color: '#C9933C', lineHeight: 1, textShadow: '0 0 30px rgba(201,147,60,0.4)', marginTop: '0.1rem' }}>{r.stopCount}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: '#8A8077', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Paywall after</div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '1.5rem', color: '#EFE7D6', lineHeight: 1, marginTop: '0.1rem' }}>Stop {r.paywall_after_stop}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: '#8A8077', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Free stops</div>
                <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '1.5rem', color: '#EFE7D6', lineHeight: 1, marginTop: '0.1rem' }}>{r.paywall_after_stop} of {r.stopCount}</div>
              </div>
            </div>

            {/* Stop progress strip */}
            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem' }}>
              {Array.from({ length: r.stopCount }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '4px',
                  background: i < r.paywall_after_stop ? 'rgba(201,147,60,0.6)' : 'rgba(216,67,47,0.45)',
                  borderRadius: '2px',
                  boxShadow: i < r.paywall_after_stop ? '0 0 6px rgba(201,147,60,0.4)' : '0 0 6px rgba(216,67,47,0.3)',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: 'rgba(201,147,60,0.7)' }}>free</span>
              <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: 'rgba(216,67,47,0.7)' }}>paid</span>
            </div>
          </div>
        ))}
      </div>

      {/* New route form */}
      <div style={{ ...GLASS, padding: '1.375rem' }}>
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.65rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
          New route
        </p>
        <form onSubmit={create} style={{ display: 'flex', gap: '0.625rem' }}>
          <input
            style={{ flex: 1, background: 'rgba(240,230,210,0.04)', border: '1px solid rgba(240,230,210,0.12)', color: '#F0E6D2', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Route name"
            required
          />
          <button type="submit" disabled={creating} style={{ padding: '0.5rem 1.25rem', background: '#D8432F', color: '#F0E6D2', fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.5 : 1, border: 'none' }}>
            {creating ? '...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}
