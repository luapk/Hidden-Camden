'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Reward, Sponsor } from '@/lib/db/schema'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_BITS = [1, 2, 4, 8, 16, 32, 64]

function maskToDays(mask: number) {
  return DAYS.filter((_, i) => (mask & DAY_BITS[i]!) !== 0).join(', ')
}

type RewardWithSponsor = Reward & { sponsor: Sponsor }

export default function VenueRewards({ venueId, rewards: initial, sponsors }: { venueId: string; rewards: RewardWithSponsor[]; sponsors: Sponsor[] }) {
  const router = useRouter()
  const [rewards, setRewards] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ sku_label: '', sponsor_id: '', window_start: '17:00', window_end: '23:00', days_mask: 127, daily_cap: '50', unit_cost_pence: '650', expiry_days: '7' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function toggleDay(bit: number) {
    setForm((f) => ({ ...f, days_mask: f.days_mask ^ bit }))
  }

  async function addReward(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/venues/${venueId}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, daily_cap: parseInt(form.daily_cap, 10), unit_cost_pence: parseInt(form.unit_cost_pence, 10), expiry_days: parseInt(form.expiry_days, 10) }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setShowAdd(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function toggleKillSwitch(reward: Reward) {
    await fetch(`/api/admin/rewards/${reward.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kill_switch: !reward.kill_switch }),
    })
    setRewards((r) => r.map((x) => x.id === reward.id ? { ...x, kill_switch: !x.kill_switch } : x))
  }

  const inputClass = "bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', fontSize: '1.25rem' }}>Rewards</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1 border border-brass text-brass text-sm hover:bg-brass hover:text-ink transition-colors">
          {showAdd ? 'Cancel' : 'Add reward'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addReward} className="border border-smoke/30 p-4 mb-4 space-y-3">
          {error && <p className="text-camden text-sm">{error}</p>}
          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Reward label</label>
            <input className={`${inputClass} w-full`} value={form.sku_label} onChange={(e) => setForm((f) => ({ ...f, sku_label: e.target.value }))} placeholder="Pint of Guinness" required />
          </div>
          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Sponsor</label>
            <select className={`${inputClass} w-full`} value={form.sponsor_id} onChange={(e) => setForm((f) => ({ ...f, sponsor_id: e.target.value }))} required>
              <option value="">Select sponsor...</option>
              {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Window start</label>
              <input className={`${inputClass} w-full`} value={form.window_start} onChange={(e) => setForm((f) => ({ ...f, window_start: e.target.value }))} placeholder="17:00" required />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Window end</label>
              <input className={`${inputClass} w-full`} value={form.window_end} onChange={(e) => setForm((f) => ({ ...f, window_end: e.target.value }))} placeholder="23:00" required />
            </div>
          </div>
          <div>
            <label className="block text-xs text-smoke mb-2" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Days</label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button key={day} type="button" onClick={() => toggleDay(DAY_BITS[i]!)}
                  className={`px-2 py-1 text-xs border transition-colors ${(form.days_mask & DAY_BITS[i]!) ? 'border-brass bg-brass text-ink' : 'border-smoke/40 text-smoke'}`}
                  style={{ fontFamily: 'var(--font-courier, monospace)' }}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Daily cap</label>
              <input className={`${inputClass} w-full`} type="number" min="1" value={form.daily_cap} onChange={(e) => setForm((f) => ({ ...f, daily_cap: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Cost (pence)</label>
              <input className={`${inputClass} w-full`} type="number" min="1" value={form.unit_cost_pence} onChange={(e) => setForm((f) => ({ ...f, unit_cost_pence: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Expiry days</label>
              <input className={`${inputClass} w-full`} type="number" min="1" value={form.expiry_days} onChange={(e) => setForm((f) => ({ ...f, expiry_days: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
            {saving ? 'Adding...' : 'Add reward'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {rewards.map((r) => (
          <div key={r.id} className="border border-smoke/30 p-3 flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{r.sku_label}</div>
              <div className="text-xs text-smoke mt-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
                {r.window_start}–{r.window_end} {maskToDays(r.days_mask)} · cap {r.daily_cap} · {r.sponsor.name}
              </div>
            </div>
            <button onClick={() => toggleKillSwitch(r)}
              className={`text-xs px-2 py-1 border transition-colors ${r.kill_switch ? 'border-camden text-camden' : 'border-smoke/40 text-smoke'}`}
              style={{ fontFamily: 'var(--font-courier, monospace)', whiteSpace: 'nowrap' }}>
              {r.kill_switch ? 'KILL SWITCH ON' : 'Kill switch'}
            </button>
          </div>
        ))}
        {rewards.length === 0 && <p className="text-smoke text-sm">No rewards yet.</p>}
      </div>
    </div>
  )
}
