import { getStaffContext } from '@/lib/staff/auth'

export const dynamic = 'force-dynamic'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getStaffContext()

  return (
    <div className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-md px-4 pb-12">
        <header className="flex items-baseline justify-between border-b border-cream/10 py-5">
          <h1 className="font-display text-xl uppercase leading-none tracking-tight">
            {ctx?.venue.name ?? 'Camden Crawl'}
          </h1>
          <span className="font-mono text-[11px] tracking-[0.3em] text-brass">
            STAFF
          </span>
        </header>
        {children}
      </div>
    </div>
  )
}
