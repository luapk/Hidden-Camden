'use client'

import { useState } from 'react'

type VoucherRow = {
  id: string
  user_id: string
  status: string
  issued_at: string
  expires_at: string
  sku_label: string
  venue_name: string
}

type Venue = { id: string; name: string }

const EXAMPLE_VOUCHERS: VoucherRow[] = [
  { id: 'ex-1', user_id: 'user-001', status: 'banked',   issued_at: '2026-06-22T18:30:00Z', expires_at: '2026-06-29T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'The Dublin Castle' },
  { id: 'ex-2', user_id: 'user-002', status: 'redeemed', issued_at: '2026-06-21T19:15:00Z', expires_at: '2026-06-28T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'The Monarch' },
  { id: 'ex-3', user_id: 'user-003', status: 'banked',   issued_at: '2026-06-23T14:00:00Z', expires_at: '2026-06-30T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'Electric Ballroom' },
  { id: 'ex-4', user_id: 'user-004', status: 'expired',  issued_at: '2026-06-15T20:00:00Z', expires_at: '2026-06-22T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'The Jazz Cafe' },
  { id: 'ex-5', user_id: 'user-005', status: 'banked',   issued_at: '2026-06-23T16:45:00Z', expires_at: '2026-06-30T23:59:00Z', sku_label: 'Camden Hells Lager', venue_name: 'KOKO' },
  { id: 'ex-6', user_id: 'user-006', status: 'revoked',  issued_at: '2026-06-20T17:30:00Z', expires_at: '2026-06-27T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'Dingwalls' },
  { id: 'ex-7', user_id: 'user-007', status: 'redeemed', issued_at: '2026-06-22T21:00:00Z', expires_at: '2026-06-29T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'The Dublin Castle' },
  { id: 'ex-8', user_id: 'user-008', status: 'banked',   issued_at: '2026-06-23T11:20:00Z', expires_at: '2026-06-30T23:59:00Z', sku_label: 'Pint of Guinness',  venue_name: 'The Monarch' },
]

const STATUS_GLASS: Record<string, { bg: string; border: string; color: string }> = {
  banked:   { bg: 'rgba(201,147,60,0.14)', border: 'rgba(201,147,60,0.32)', color: '#C9933C' },
  redeemed: { bg: 'rgba(138,128,119,0.14)', border: 'rgba(138,128,119,0.28)', color: '#8A8077' },
  expired:  { bg: 'rgba(138,128,119,0.1)', border: 'rgba(138,128,119,0.2)', color: '#8A8077' },
  revoked:  { bg: 'rgba(216,67,47,0.12)', border: 'rgba(216,67,47,0.3)', color: '#D8432F' },
}

const GLASS: React.CSSProperties = {
  background: 'rgba(22,18,16,0.55)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(240,230,210,0.08)',
  borderTopColor: 'rgba(240,230,210,0.18)',
  borderLeftColor: 'rgba(240,230,210,0.12)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
}

const INPUT: React.CSSProperties = {
  background: 'rgba(240,230,210,0.04)',
  border: '1px solid rgba(240,230,210,0.12)',
  color: '#F0E6D2',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
}

export default function VoucherSearch({ venues }: { venues: Venue[] }) {
  const [results, setResults] = useState<VoucherRow[]>(EXAMPLE_VOUCHERS)
  const [filters, setFilters] = useState({ userId: '', venueId: '', status: '', dateFrom: '', dateTo: '' })
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setActionMsg(null); setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.venueId) params.set('venueId', filters.venueId)
      if (filters.status) params.set('status', filters.status)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      const res = await fetch(`/api/admin/vouchers?${params}`)
      const data = await res.json() as VoucherRow[]
      setResults(Array.isArray(data) ? data : EXAMPLE_VOUCHERS)
    } catch {
      setResults(EXAMPLE_VOUCHERS)
    } finally {
      setLoading(false)
    }
  }

  async function revoke(id: string) {
    if (!revokeReason.trim()) return
    const res = await fetch(`/api/admin/vouchers/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: revokeReason }),
    })
    if (res.ok) { setActionMsg('Revoked.'); setRevokeId(null); setRevokeReason(''); search() }
  }

  async function extend(id: string) {
    const res = await fetch(`/api/admin/vouchers/${id}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    })
    if (res.ok) { setActionMsg('Extended by 7 days.'); search() }
  }

  const displayRows = results

  return (
    <div>
      {/* Filter form */}
      <div style={{ ...GLASS, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.65rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
          Search filters
        </p>
        <form onSubmit={search} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
          <input style={INPUT} placeholder="User ID" value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} />
          <select style={INPUT} value={filters.venueId}
            onChange={(e) => setFilters((f) => ({ ...f, venueId: e.target.value }))}>
            <option value="">All venues</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select style={INPUT} value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="banked">Banked</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <input style={INPUT} type="date" value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
          <input style={INPUT} type="date" value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.25rem', background: '#D8432F', color: '#F0E6D2', fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, border: 'none' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {actionMsg && (
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.8rem', color: '#C9933C', marginBottom: '1rem' }}>{actionMsg}</p>
      )}

      {/* Results */}
      <div style={{ ...GLASS, padding: '1.25rem' }}>
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.65rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {!hasSearched ? 'Example data' : `${displayRows.length} result${displayRows.length !== 1 ? 's' : ''}`}
        </p>

        {displayRows.length === 0 && !loading && (
          <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.8rem', color: '#8A8077', textAlign: 'center', padding: '2rem 0' }}>No vouchers found.</p>
        )}

        {displayRows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(240,230,210,0.08)' }}>
                  {['User', 'Venue', 'Reward', 'Status', 'Issued', 'Expires', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0 0 0.625rem', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', color: '#8A8077', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'left', fontWeight: 'normal' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((v) => {
                  const badge = STATUS_GLASS[v.status] ?? STATUS_GLASS.expired
                  return (
                    <>
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(240,230,210,0.05)' }}>
                        <td style={{ padding: '0.625rem 0.375rem 0.625rem 0', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.68rem', color: '#8A8077' }}>{v.user_id}</td>
                        <td style={{ padding: '0.625rem 0.375rem', fontSize: '0.8rem', color: '#EFE7D6' }}>{v.venue_name}</td>
                        <td style={{ padding: '0.625rem 0.375rem', fontSize: '0.8rem', color: '#EFE7D6' }}>{v.sku_label}</td>
                        <td style={{ padding: '0.625rem 0.375rem' }}>
                          <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', padding: '0.12rem 0.4rem', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, letterSpacing: '0.08em' }}>
                            {v.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.375rem', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077' }}>
                          {new Date(v.issued_at).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '0.625rem 0.375rem', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077' }}>
                          {new Date(v.expires_at).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '0.625rem 0' }}>
                          {v.status === 'banked' && (
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button onClick={() => extend(v.id)} style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#C9933C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>+7 days</button>
                              <button onClick={() => { setRevokeId(v.id); setRevokeReason('') }} style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#D8432F', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Revoke</button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {revokeId === v.id && (
                        <tr key={`${v.id}-revoke`}>
                          <td colSpan={7} style={{ padding: '0.5rem 0 0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input style={{ ...INPUT, flex: 1, padding: '0.375rem 0.625rem', fontSize: '0.8rem' }} placeholder="Reason for revocation" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
                              <button onClick={() => revoke(v.id)} style={{ padding: '0.375rem 0.875rem', background: '#D8432F', color: '#F0E6D2', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}>Confirm</button>
                              <button onClick={() => setRevokeId(null)} style={{ padding: '0.375rem 0.875rem', background: 'rgba(138,128,119,0.2)', color: '#8A8077', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', border: '1px solid rgba(138,128,119,0.3)', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
