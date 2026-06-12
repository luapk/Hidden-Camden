'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { haversineDistance } from '@/lib/geo'

type Venue = { id: string; name: string; lat: number; lng: number; geofence_radius_m: number; status: string }
type Reward = { id: string; sku_label: string }
type Stop = {
  id?: string
  venue_id: string
  reward_id: string
  position: number
  audio_url: string
  transcript: string
  runtime_s: string
  link_audio_url: string
  is_free: boolean
  _venue?: Venue
  _reward?: Reward
  _expanded?: boolean
}
type Route = { id: string; name: string; status: string; paywall_after_stop: number }

export default function RouteBuilder({ route: initial, venues, initialStops }: {
  route: Route
  venues: Venue[]
  initialStops: (Stop & { venue: Venue; reward: Reward & { sponsor: { name: string } } })[]
}) {
  const router = useRouter()
  const [route, setRoute] = useState(initial)
  const [stops, setStops] = useState<Stop[]>(
    initialStops.map((s) => ({
      id: s.id,
      venue_id: s.venue_id,
      reward_id: s.reward_id,
      position: s.position,
      audio_url: s.audio_url ?? '',
      transcript: s.transcript ?? '',
      runtime_s: String(s.runtime_s ?? ''),
      link_audio_url: s.link_audio_url ?? '',
      is_free: s.is_free,
      _venue: s.venue,
      _reward: s.reward,
      _expanded: false,
    }))
  )
  const [rewardsByVenue, setRewardsByVenue] = useState<Record<string, Reward[]>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Compute geofence overlap warnings on every stop change
  const overlapWarnings = stops.reduce<string[]>((acc, stop, i) => {
    if (i === 0) return acc
    const prev = stops[i - 1]!
    const va = prev._venue, vb = stop._venue
    if (!va || !vb) return acc
    const dist = haversineDistance(va.lat, va.lng, vb.lat, vb.lng)
    const combined = va.geofence_radius_m + vb.geofence_radius_m
    if (dist < combined) {
      acc.push(`Stops ${prev.position} and ${stop.position}: geofences overlap by ${Math.round(combined - dist)}m.`)
    }
    return acc
  }, [])

  async function loadRewards(venueId: string) {
    if (rewardsByVenue[venueId]) return
    const res = await fetch(`/api/admin/venues/${venueId}/rewards`)
    const data = await res.json() as Reward[]
    setRewardsByVenue((r) => ({ ...r, [venueId]: data }))
  }

  function addStop() {
    setStops((s) => [...s, { venue_id: '', reward_id: '', position: s.length + 1, audio_url: '', transcript: '', runtime_s: '', link_audio_url: '', is_free: false, _expanded: true }])
  }

  function removeStop(i: number) {
    setStops((s) => s.filter((_, j) => j !== i).map((x, j) => ({ ...x, position: j + 1 })))
  }

  function moveStop(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= stops.length) return
    setStops((s) => {
      const next = [...s]
      ;[next[i]!, next[j]!] = [{ ...next[j]!, position: i + 1 }, { ...next[i]!, position: j + 1 }]
      return next
    })
  }

  function updateStop(i: number, field: keyof Stop, value: unknown) {
    setStops((s) => s.map((x, j) => j === i ? { ...x, [field]: value } : x))
  }

  async function onVenueChange(i: number, venueId: string) {
    const venue = venues.find((v) => v.id === venueId)
    updateStop(i, 'venue_id', venueId)
    updateStop(i, '_venue', venue)
    updateStop(i, 'reward_id', '')
    if (venueId) await loadRewards(venueId)
  }

  async function save() {
    setSaving(true); setErrors([])
    try {
      const res = await fetch(`/api/admin/routes/${route.id}/stops`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stops: stops.map((s) => ({ venue_id: s.venue_id, reward_id: s.reward_id, position: s.position, audio_url: s.audio_url || null, transcript: s.transcript || null, runtime_s: s.runtime_s ? parseInt(s.runtime_s, 10) : null, link_audio_url: s.link_audio_url || null, is_free: s.is_free })) }),
      })
      if (!res.ok) { const d = await res.json() as { error?: string }; setErrors([d.error ?? 'Save failed.']); return }
      await fetch(`/api/admin/routes/${route.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paywall_after_stop: route.paywall_after_stop }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true); setErrors([]); setWarnings([])
    try {
      const res = await fetch(`/api/admin/routes/${route.id}/publish`, { method: 'POST' })
      const data = await res.json() as { errors?: string[]; warnings?: string[] }
      if (!res.ok) { setErrors(data.errors ?? ['Publish failed.']); setWarnings(data.warnings ?? []); return }
      setWarnings(data.warnings ?? [])
      setRoute((r) => ({ ...r, status: 'live' }))
      router.refresh()
    } finally {
      setPublishing(false)
    }
  }

  const totalRuntime = stops.reduce((sum, s) => sum + (parseInt(s.runtime_s, 10) || 0), 0)
  const isLive = route.status === 'live'
  const inputClass = "w-full bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: isLive ? '#C9933C' : '#8A8077', color: isLive ? '#161210' : '#F0E6D2' }}>
          {route.status.toUpperCase()}
        </span>
        {totalRuntime > 0 && (
          <span className="text-xs text-smoke" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
            Total: {Math.floor(totalRuntime / 60)}:{String(totalRuntime % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Paywall control */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-smoke" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Free up to stop</label>
        <input type="number" min="0" max={stops.length} value={route.paywall_after_stop} onChange={(e) => setRoute((r) => ({ ...r, paywall_after_stop: parseInt(e.target.value, 10) }))}
          className="w-16 bg-ink border border-smoke/40 text-cream px-2 py-1 text-sm focus:border-brass focus:outline-none" />
      </div>

      {/* Stops */}
      <div className="space-y-3">
        {stops.map((stop, i) => (
          <div key={i} className="border border-smoke/30">
            <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => updateStop(i, '_expanded', !stop._expanded)}>
              <span className="text-sm text-smoke w-6" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{stop.position}</span>
              <span className="flex-1 text-sm">{stop._venue?.name ?? <span className="text-smoke">No venue selected</span>}</span>
              {stop._venue?.status !== 'live' && stop.venue_id && <span className="text-xs text-camden" style={{ fontFamily: 'var(--font-courier, monospace)' }}>DRAFT VENUE</span>}
              <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="px-2 py-1 text-xs border border-smoke/30 text-smoke hover:text-cream disabled:opacity-30">▲</button>
                <button onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="px-2 py-1 text-xs border border-smoke/30 text-smoke hover:text-cream disabled:opacity-30">▼</button>
                <button onClick={() => removeStop(i)} className="px-2 py-1 text-xs border border-smoke/30 text-smoke hover:text-camden">✕</button>
              </div>
            </div>

            {stop._expanded && (
              <div className="border-t border-smoke/30 p-3 space-y-3">
                <div>
                  <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Venue</label>
                  <select className={inputClass} value={stop.venue_id} onChange={(e) => onVenueChange(i, e.target.value)}>
                    <option value="">Select venue...</option>
                    {venues.map((v) => <option key={v.id} value={v.id}>{v.name} {v.status !== 'live' ? '(draft)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Reward</label>
                  <select className={inputClass} value={stop.reward_id} onChange={(e) => updateStop(i, 'reward_id', e.target.value)} disabled={!stop.venue_id}>
                    <option value="">Select reward...</option>
                    {(rewardsByVenue[stop.venue_id] ?? []).map((r) => <option key={r.id} value={r.id}>{r.sku_label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Audio URL</label>
                  <input className={inputClass} value={stop.audio_url} onChange={(e) => updateStop(i, 'audio_url', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Transcript <span className="text-smoke/50">(click to expand)</span></label>
                  <textarea className={inputClass} rows={3} value={stop.transcript} onChange={(e) => updateStop(i, 'transcript', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Runtime (seconds)</label>
                    <input className={inputClass} type="number" min="0" value={stop.runtime_s} onChange={(e) => updateStop(i, 'runtime_s', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Link audio URL</label>
                    <input className={inputClass} value={stop.link_audio_url} onChange={(e) => updateStop(i, 'link_audio_url', e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={stop.is_free} onChange={(e) => updateStop(i, 'is_free', e.target.checked)} className="accent-brass" />
                  <span className="text-sm text-smoke">Free stop</span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addStop} className="text-sm text-brass hover:underline" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
        + Add stop
      </button>

      {overlapWarnings.length > 0 && (
        <div className="border border-brass/40 p-3 text-xs text-brass space-y-1">
          {overlapWarnings.map((w, i) => <p key={i}>{w}</p>)}
        </div>
      )}

      {errors.length > 0 && (
        <div className="border border-camden/40 p-3 text-xs text-camden space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="border border-brass/40 p-3 text-xs text-brass space-y-1">
          {warnings.map((w, i) => <p key={i}>{w}</p>)}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={save} disabled={saving || isLive} className="px-4 py-2 border border-brass text-brass text-sm hover:bg-brass hover:text-ink transition-colors disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
          {saving ? 'Saving...' : 'Save draft'}
        </button>
        <button onClick={publish} disabled={publishing || isLive} className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
          {publishing ? 'Publishing...' : isLive ? 'Route is live' : 'Publish route'}
        </button>
      </div>
    </div>
  )
}
