'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StaffUser } from '@/lib/db/schema'

export default function VenueStaff({ venueId, staff: initial }: { venueId: string; staff: StaffUser[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'bar'>('bar')
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setMagicLink(null)
    try {
      const res = await fetch(`/api/admin/venues/${venueId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json() as { magicLinkUrl?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setMagicLink(data.magicLinkUrl ?? null)
      setEmail('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none"

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', fontSize: '1.25rem', marginBottom: '1rem' }}>Staff</h2>

      <table className="w-full text-sm mb-4">
        <tbody>
          {initial.map((s) => (
            <tr key={s.id} className="border-b border-smoke/10">
              <td className="py-2" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{s.email}</td>
              <td className="py-2 text-smoke text-xs">{s.role}</td>
            </tr>
          ))}
          {initial.length === 0 && <tr><td className="py-2 text-smoke text-sm">No staff yet.</td></tr>}
        </tbody>
      </table>

      <form onSubmit={invite} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Invite by email</label>
          <input className={`${inputClass} w-full`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@venue.com" required />
        </div>
        <div>
          <label className="block text-xs text-smoke mb-1" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Role</label>
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as 'manager' | 'bar')}>
            <option value="bar">Bar</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 disabled:opacity-50 h-[38px]" style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
          {saving ? '...' : 'Invite'}
        </button>
      </form>

      {error && <p className="text-camden text-sm mt-2">{error}</p>}

      {magicLink && (
        <div className="mt-3 border border-brass/40 p-3">
          <p className="text-xs text-smoke mb-2" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Magic link (copy and send):</p>
          <code className="text-xs text-brass break-all">{magicLink}</code>
        </div>
      )}
    </div>
  )
}
