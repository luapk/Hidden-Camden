import { requireAdmin, isAdminError } from '@/lib/admin/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin()

  if (isAdminError(ctx)) {
    return (
      <html lang="en">
        <body style={{ background: '#161210', color: '#F0E6D2', fontFamily: 'system-ui', padding: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.875rem', color: '#8A8077' }}>
            ADMIN
          </p>
          <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>
            Not authorised.
          </h1>
          <p style={{ marginTop: '1rem', color: '#8A8077' }}>
            Sign in at <a href="/api/auth/signin" style={{ color: '#C9933C' }}>/api/auth/signin</a> with an admin email.
          </p>
        </body>
      </html>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-smoke/30 px-6 py-4 flex items-center gap-4">
        <span style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Camden Crawl
        </span>
        <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', color: '#C9933C', border: '1px solid #C9933C', padding: '0.125rem 0.375rem' }}>
          ADMIN
        </span>
        <nav className="flex gap-6 ml-8 text-sm text-smoke">
          <a href="/admin/venues" className="hover:text-cream transition-colors">Venues</a>
          <a href="/admin/routes" className="hover:text-cream transition-colors">Routes</a>
          <a href="/admin/vouchers" className="hover:text-cream transition-colors">Vouchers</a>
          <a href="/admin/redemptions" className="hover:text-cream transition-colors">Redemptions</a>
        </nav>
        <span className="ml-auto text-xs text-smoke" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
          {ctx.email}
        </span>
      </header>
      <main className="px-6 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
