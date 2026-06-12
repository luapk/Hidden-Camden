'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseGoogleMapsUrl } from '@/lib/admin/parseGoogleMapsUrl'

export default function NewVenuePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    address: '',
    lat: '',
    lng: '',
    geofence_radius_m: '40',
    status: 'draft',
  })
  const [mapsUrl, setMapsUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function deriveSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function parseMapsUrl() {
    const coords = parseGoogleMapsUrl(mapsUrl)
    if (!coords) { setError('Could not parse coordinates from that URL.'); return }
    setForm((f) => ({ ...f, lat: String(coords.lat), lng: String(coords.lng) }))
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          geofence_radius_m: parseInt(form.geofence_radius_m, 10),
        }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      router.push(`/admin/venues/${data.id}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div className="max-w-lg">
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Add venue
      </h1>

      {error && <p className="text-camden text-sm mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: deriveSlug(e.target.value) }))} required />
        </div>

        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Slug</label>
          <input className={inputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
        </div>

        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
        </div>

        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Google Maps URL (paste to extract coords)</label>
          <div className="flex gap-2">
            <input className={inputClass} value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." />
            <button type="button" onClick={parseMapsUrl} className="px-3 py-2 border border-brass text-brass text-sm hover:bg-brass hover:text-ink transition-colors whitespace-nowrap">
              Parse
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Latitude</label>
            <input className={inputClass} value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} required type="number" step="any" />
          </div>
          <div>
            <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Longitude</label>
            <input className={inputClass} value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} required type="number" step="any" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
            Geofence radius: {form.geofence_radius_m}m
          </label>
          <input type="range" min="25" max="80" value={form.geofence_radius_m} onChange={(e) => setForm((f) => ({ ...f, geofence_radius_m: e.target.value }))} className="w-full accent-brass" />
          <div className="flex justify-between text-xs text-smoke mt-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
            <span>25m</span><span>80m</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Status</label>
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <button type="submit" disabled={saving} className="w-full py-3 bg-camden text-cream hover:opacity-90 transition-opacity disabled:opacity-50" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {saving ? 'Saving...' : 'Create venue'}
        </button>
      </form>
    </div>
  )
}
