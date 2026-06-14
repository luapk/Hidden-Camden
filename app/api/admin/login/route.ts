import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { ADMIN_COOKIE, adminTokenFor } from '@/lib/admin/auth'

const bodySchema = z.object({ password: z.string() })

function passwordsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function POST(req: Request) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return NextResponse.json(
      { error: 'No admin password set. Add ADMIN_PASSWORD in Vercel.' },
      { status: 500 },
    )
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password required.' }, { status: 400 })
  }

  if (!passwordsMatch(parsed.data.password, password)) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  cookies().set(ADMIN_COOKIE, adminTokenFor(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ ok: true })
}
