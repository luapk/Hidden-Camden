'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function StaffSignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await signIn('email', { email, redirect: false, callbackUrl: '/staff' })
    setSent(true)
    setBusy(false)
  }

  return (
    <main className="pt-14 text-center">
      <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
        Staff access
      </div>
      {sent ? (
        <>
          <h2 className="mt-2 font-jost text-2xl font-bold uppercase tracking-tight text-label-1">
            Check your inbox
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-label-2">
            We sent a sign-in link to {email}. Click it and you will land straight in.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-2 font-jost text-2xl font-bold uppercase tracking-tight text-label-1">
            Sign in with your venue email
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-label-2">
            Enter the email your manager registered with Camden Crawl. We will send a sign-in link.
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col items-center gap-3">
            <input
              type="email"
              required
              placeholder="you@yourvenue.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-xs border border-white/15 bg-night px-4 py-3 text-center font-grotesk text-sm text-label-1 placeholder:text-label-3"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full max-w-xs bg-acid px-6 py-3 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-black disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'Send sign-in link'}
            </button>
          </form>
        </>
      )}
    </main>
  )
}
