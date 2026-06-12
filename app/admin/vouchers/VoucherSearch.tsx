'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const STATUS_COLOR: Record<string, string> = {
  banked: '#C9933C',
  redeemed: '#8A8077',
  expired: '#8A8077',
  revoked: '#D8432F',
}

export default function VoucherSearch({ venues }: { venues: Venue[] }) {
  const [results, setResults] = useState<VoucherRow[]>([])
  const [filters, setFilters] = useState({ userId: '', venueId: '', status: '', dateFrom: '', dateTo: '' })
  const [loading, setLoading] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setActionMsg(null)
    try {
      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.venueId) params.set('venueId', filters.venueId)
      if (filters.status) params.set('status', filters.status)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      const res = await fetch(`/api/admin/vouchers?${params}`)
      const data = await res.json() as VoucherRow[]
      setResults(data)
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

  const inputClass = "bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div>
      <form onSubmit={search} className="grid grid-cols-3 gap-3 mb-6">
        <input className={inputClass} placeholder="User ID" value={filters.userId} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} />
        <select className={inputClass} value={filters.venueId} onChange={(e) => setFilters((f) => ({ ...f, venueId: e.target.value }))}>
          <option value="">All venues</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className={inputClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="banked">Banked</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <input className={inputClass} type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
        <input className={inputClass} type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {actionMsg && <p className="text-brass text-sm mb-4">{actionMsg}</p>}

      {results.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-smoke/30 text-smoke text-left">
              {['User', 'Venue', 'Reward', 'Status', 'Issued', 'Expires', 'Actions'].map((h) => (
                <th key={h} className="pb-2 font-normal text-xs" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((v) => (
              <tr key={v.id} className="border-b border-smoke/10 hover:bg-smoke/5 align-top">
                <td className="py-2 text-xs" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{v.user_id}</td>
                <td className="py-2 text-xs">{v.venue_name}</td>
                <td className="py-2 text-xs">{v.sku_label}</td>
                <td className="py-2">
                  <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: STATUS_COLOR[v.status] ?? '#8A8077', color: v.status === 'banked' ? '#161210' : '#F0E6D2' }}>
                    {v.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-xs text-smoke">{new Date(v.issued_at).toLocaleDateString('en-GB')}</td>
                <td className="py-2 text-xs text-smoke">{new Date(v.expires_at).toLocaleDateString('en-GB')}</td>
                <td className="py-2">
                  <div className="flex gap-2 text-xs">
                    {v.status === 'banked' && (
                      <>
                        <button onClick={() => extend(v.id)} className="text-brass hover:underline">+7 days</button>
                        <button onClick={() => { setRevokeId(v.id); setRevokeReason('') }} className="text-camden hover:underline">Revoke</button>
                      </>
                    )}
                  </div>
                  {revokeId === v.id && (
                    <div className="mt-1 flex gap-1">
                      <input className="flex-1 bg-ink border border-smoke/40 text-cream px-2 py-1 text-xs" placeholder="Reason" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
                      <button onClick={() => revoke(v.id)} className="px-2 py-1 bg-camden text-cream text-xs">Confirm</button>
                      <button onClick={() => setRevokeId(null)} className="px-2 py-1 text-smoke text-xs">Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {results.length === 0 && !loading && (
        <p className="text-smoke text-sm text-center py-8">Run a search to see vouchers.</p>
      )}
    </div>
  )
}
