import EmailProvider from 'next-auth/providers/email'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import { db } from '@/lib/db'
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
} from '@/lib/db/schema'

async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`\n[Auth] Magic link for ${email}:\n${url}\n`)
    return
  }
  const from = process.env.EMAIL_FROM ?? 'Hidden Camden <noreply@hiddencamden.com>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Sign in to Hidden Camden',
      html: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#161210;padding:40px 0"><tr><td align="center"><table width="480" cellpadding="0" cellspacing="0" style="background:#1A1714;padding:32px"><tr><td><p style="font-family:monospace;font-size:11px;letter-spacing:0.3em;color:#CCFF00;margin:0 0 8px">HIDDEN CAMDEN</p><h1 style="font-size:22px;color:#F0E6D2;margin:0 0 24px;font-family:sans-serif">Sign in to Staff</h1><p style="color:#8A8077;font-size:14px;margin:0 0 24px;font-family:sans-serif">Click the button to sign in. This link expires in 24 hours.</p><a href="${url}" style="display:inline-block;background:#CCFF00;color:#000;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:12px 24px;text-decoration:none">Sign in</a><p style="color:#5A5A5F;font-size:11px;margin:24px 0 0;font-family:monospace">If you did not request this, ignore this email.</p></td></tr></table></td></tr></table>`,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Email send failed (${res.status}): ${body}`)
  }
}

// Build the Drizzle adapter lazily so this module can be imported in test
// environments where the DB proxy doesn't satisfy DrizzleAdapter's type check.
let _adapter: Adapter | undefined
function getAdapter(): Adapter {
  if (!_adapter) {
    _adapter = DrizzleAdapter(db, {
      usersTable: authUsers,
      accountsTable: authAccounts,
      sessionsTable: authSessions,
      verificationTokensTable: authVerificationTokens,
    })
  }
  return _adapter
}

const _base = {
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM ?? 'noreply@hiddencamden.com',
      sendVerificationRequest: ({ identifier, url }) =>
        sendMagicLink(identifier, url),
    }),
  ],
  session: { strategy: 'database' as const },
  pages: {
    signIn: '/staff/signin',
  },
}

Object.defineProperty(_base, 'adapter', {
  configurable: true,
  enumerable: true,
  get: getAdapter,
})

export const authOptions = _base as NextAuthOptions
