import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import GenerateAudioClient from './GenerateAudioClient'

export const dynamic = 'force-dynamic'

export default async function GenerateAudioPage() {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return (
      <div style={{ padding: '2rem', color: '#F0E6D2' }}>
        <p>Not authorised. <a href="/api/auth/signin" style={{ color: '#C9933C' }}>Sign in</a></p>
      </div>
    )
  }
  return <GenerateAudioClient />
}
