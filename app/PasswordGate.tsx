'use client'

import { useEffect, useState } from 'react'

/**
 * A soft password screen in front of the whole app. Not real security:
 * it's a speed bump so a shared demo link isn't idly passed around. The
 * unlock is remembered per browser. The marketing site under /promo is
 * static and not gated by this. For hard gating, use Vercel deployment
 * password protection instead.
 */
const PASSWORD = 'h1dden'
const STORAGE_KEY = 'hc_gate'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'ok') setUnlocked(true)
    } catch {
      // localStorage blocked (private mode) — stay gated, retype each visit.
    }
  }, [])

  if (unlocked) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim().toLowerCase() === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, 'ok')
      } catch {
        // ignore — still unlock for this session
      }
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0a0a0a',
        color: '#f5f5f7',
        fontFamily: 'var(--font-grotesk, system-ui, sans-serif)',
      }}
    >
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-anton, sans-serif)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            lineHeight: 0.95,
            fontSize: '40px',
            color: '#CCFF00',
          }}
        >
          Hidden
          <br />
          Camden
        </div>
        <p style={{ marginTop: 18, fontSize: 13, color: '#98989d' }}>
          Private preview. Enter the password to walk the tour.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          autoFocus
          aria-label="Password"
          placeholder="Password"
          style={{
            marginTop: 16,
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            background: '#16161a',
            border: `1px solid ${error ? '#D8432F' : '#2a2a2f'}`,
            borderRadius: 10,
            color: '#f5f5f7',
            fontSize: 16,
            outline: 'none',
            fontFamily: 'var(--font-courier, monospace)',
            letterSpacing: '0.15em',
            textAlign: 'center',
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: 12,
            width: '100%',
            padding: '12px 14px',
            background: '#CCFF00',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Enter
        </button>
        <p style={{ marginTop: 12, minHeight: 16, fontSize: 12, color: '#D8432F' }}>
          {error ? 'Not that one. Have another go.' : ''}
        </p>
      </form>
    </div>
  )
}
