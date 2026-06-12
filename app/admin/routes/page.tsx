'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type RouteRow = { id: string; name: string; status: string; paywall_after_stop: number; stopCount: number }

export default function RoutesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<RouteRow[]>([])
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/admin/routes')
      .then((r) => r.json() as Promise<RouteRow[]>)
      .then(setRows)
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

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Routes
      </h1>

      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="border-b border-smoke/30 text-smoke text-left">
            {['Name', 'Status', 'Stops', 'Paywall after', ''].map((h) => (
              <th key={h} className="pb-2 font-normal" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-smoke/10 hover:bg-smoke/5">
              <td className="py-3">{r.name}</td>
              <td className="py-3">
                <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: r.status === 'live' ? '#C9933C' : '#8A8077', color: r.status === 'live' ? '#161210' : '#F0E6D2' }}>
                  {r.status.toUpperCase()}
                </span>
              </td>
              <td className="py-3 text-smoke">{r.stopCount}</td>
              <td className="py-3 text-smoke">Stop {r.paywall_after_stop}</td>
              <td className="py-3 text-right">
                <Link href={`/admin/routes/${r.id}`} className="text-brass hover:underline">Edit</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-smoke">No routes yet.</td></tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-smoke/30 pt-6">
        <h2 className="text-sm text-smoke mb-3" style={{ fontFamily: 'var(--font-courier, monospace)' }}>New route</h2>
        <form onSubmit={create} className="flex gap-2">
          <input
            className="flex-1 bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Route name"
            required
          />
          <button type="submit" disabled={creating} className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
            {creating ? '...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}
