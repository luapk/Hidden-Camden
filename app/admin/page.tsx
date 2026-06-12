import { db } from '@/lib/db'
import { venues, routes, vouchers } from '@/lib/db/schema'
import { eq, gte, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [venueCount, routeCount, vouchersToday] = await Promise.all([
    db.select({ n: count() }).from(venues),
    db.select({ n: count() }).from(routes).where(eq(routes.status, 'live')),
    db.select({ n: count() }).from(vouchers).where(gte(vouchers.issued_at, todayStart)),
  ])

  const stats = [
    { label: 'Venues', value: venueCount[0]?.n ?? 0 },
    { label: 'Live routes', value: routeCount[0]?.n ?? 0 },
    { label: 'Vouchers issued today', value: vouchersToday[0]?.n ?? 0 },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Dashboard
      </h1>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-smoke/30 p-4">
            <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '2rem', color: '#C9933C' }}>
              {s.value}
            </div>
            <div className="text-sm text-smoke mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
