'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Reward = { id: string; sku_label: string; venue_id: string }
type Venue = { id: string; name: string }
type RouteStop = { id: string; position: number; venue_id: string }

export default function IssueVoucherPage() {
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>([])
  const [allRewards, setAllRewards] = useState<(Reward & { venue_name: string })[]>([])
  const [stops, setStops] = useState<RouteStop[]>([])
  const [form, setForm] = useState({ user_id: '', reward_id: '', route_stop_id: '' })
  const [result, setResult] = useState<{ id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load all venues and their rewards
    fetch('/api/admin/venues')
      .then((r) => r.json() as Promise<(Venue & { rewardsCount: number })[]>)
      .then(async (vs) => {
        setVenues(vs)
        const rewardArrays = await Promise.all(
          vs.map((v) =>
            fetch(`/api/admin/venues/${v.id}/rewards`)
              .then((r) => r.json() as Promise<Reward[]>)
              .then((rs) => rs.map((r) => ({ ...r, venue_name: v.name })))
          )
        )
        setAllRewards(rewardArrays.flat())
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.reward_id) { setStops([]); return }
    const reward = allRewards.find((r) => r.id === form.reward_id)
    if (!reward) return
    // Fetch stops for this venue across all routes
    fetch(`/api/admin/routes`)
      .then((r) => r.json() as Promise<{ id: string }[]>)
      .then(async (routes) => {
        const stopArrays = await Promise.all(
          routes.map((route) =>
            fetch(`/api/admin/routes/${route.id}`)
              .then((r) => r.json() as Promise<{ routeStops: RouteStop[] }>)
              .then((d) => d.routeStops?.filter((s) => s.venue_id === reward.venue_id) ?? [])
          )
        )
        setStops(stopArrays.flat())
      })
      .catch(() => {})
  }, [form.reward_id, allRewards])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/admin/vouchers/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setResult({ id: data.id! })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div className="max-w-lg">
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Issue voucher
      </h1>

      {result ? (
        <div className="border border-brass/40 p-4">
          <p className="text-brass">Voucher issued.</p>
          <p className="text-xs text-smoke mt-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>ID: {result.id}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setResult(null)} className="text-sm text-brass hover:underline">Issue another</button>
            <button onClick={() => router.push('/admin/vouchers')} className="text-sm text-smoke hover:underline">Back to vouchers</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-camden text-sm">{error}</p>}

          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>User ID (email)</label>
            <input className={inputClass} value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} required placeholder="user@example.com" />
          </div>

          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Reward</label>
            <select className={inputClass} value={form.reward_id} onChange={(e) => setForm((f) => ({ ...f, reward_id: e.target.value, route_stop_id: '' }))} required>
              <option value="">Select reward...</option>
              {allRewards.map((r) => (
                <option key={r.id} value={r.id}>{r.venue_name} — {r.sku_label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Route stop</label>
            <select className={inputClass} value={form.route_stop_id} onChange={(e) => setForm((f) => ({ ...f, route_stop_id: e.target.value }))} required disabled={!form.reward_id}>
              <option value="">Select stop...</option>
              {stops.map((s) => <option key={s.id} value={s.id}>Stop {s.position}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3 bg-camden text-cream hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {saving ? 'Issuing...' : 'Issue voucher'}
          </button>
        </form>
      )}
    </div>
  )
}
