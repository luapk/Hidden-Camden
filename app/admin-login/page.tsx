'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  )
}

function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/generate-audio'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(next)
      router.refresh()
      return
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string }
    setError(data.error ?? 'Sign in failed.')
    setBusy(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#161210',
        color: '#F0E6D2',
        fontFamily: 'system-ui',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.3em', color: '#C9933C', textTransform: 'uppercase' }}>
        Admin
      </p>
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '1.75rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>
        Sign in
      </h1>
      <p style={{ color: '#8A8077', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center', maxWidth: 320 }}>
        Enter the admin password.
      </p>

      <form onSubmit={submit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 280 }}>
        <input
          type="password"
          required
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            background: '#1A1714',
            border: '1px solid #3A3530',
            color: '#F0E6D2',
            padding: '0.75rem 1rem',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            background: busy ? '#2A2520' : '#C9933C',
            color: busy ? '#8A8077' : '#000',
            border: 'none',
            padding: '0.75rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Checking...' : 'Sign in'}
        </button>
        {error && (
          <p style={{ color: '#D8432F', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'monospace' }}>
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
