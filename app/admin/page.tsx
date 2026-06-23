import { db } from '@/lib/db'
import { venues, routes, vouchers } from '@/lib/db/schema'
import { eq, gte, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const EXAMPLE_FEED = [
  { time: '22:41', venue: 'Dublin Castle', reward: 'Pint of Guinness', code: 'MXRW' },
  { time: '21:33', venue: 'The Jazz Cafe', reward: 'Pint of Guinness', code: 'FHKP' },
  { time: '20:15', venue: 'Electric Ballroom', reward: 'Pint of Guinness', code: 'TNDC' },
  { time: '19:58', venue: 'KOKO', reward: 'Camden Hells Lager', code: 'WXJM' },
  { time: '19:22', venue: 'The Monarch', reward: 'Pint of Guinness', code: 'HRTP' },
  { time: '18:44', venue: 'Dingwalls', reward: 'Pint of Guinness', code: 'ACMN' },
]

const GLASS: React.CSSProperties = {
  background: 'rgba(22,18,16,0.55)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(240,230,210,0.08)',
  borderTopColor: 'rgba(240,230,210,0.18)',
  borderLeftColor: 'rgba(240,230,210,0.12)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
}

export default async function AdminDashboard() {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  let stats = [
    { label: 'Venues', value: '7', sub: '6 live · 1 draft', accent: 'rgba(201,147,60,0.15)' },
    { label: 'Live routes', value: '1', sub: '7 stops total', accent: 'rgba(216,67,47,0.12)' },
    { label: 'Vouchers today', value: '24', sub: '+12 vs yesterday', accent: 'rgba(201,147,60,0.1)' },
  ]

  try {
    const [venueCount, routeCount, vouchersToday] = await Promise.all([
      db.select({ n: count() }).from(venues),
      db.select({ n: count() }).from(routes).where(eq(routes.status, 'live')),
      db.select({ n: count() }).from(vouchers).where(gte(vouchers.issued_at, todayStart)),
    ])
    stats = [
      { label: 'Venues', value: String(venueCount[0]?.n ?? 0), sub: '', accent: 'rgba(201,147,60,0.15)' },
      { label: 'Live routes', value: String(routeCount[0]?.n ?? 0), sub: '', accent: 'rgba(216,67,47,0.12)' },
      { label: 'Vouchers today', value: String(vouchersToday[0]?.n ?? 0), sub: '', accent: 'rgba(201,147,60,0.1)' },
    ]
  } catch {
    // DB not available; example data shown
  }

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Hidden Camden · Admin
        </p>
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.25rem' }}>
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} style={{ ...GLASS, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', borderRadius: '50%', background: s.accent, filter: 'blur(32px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '3.5rem', lineHeight: 1, color: '#C9933C', textShadow: '0 0 40px rgba(201,147,60,0.55)' }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F0E6D2', marginTop: '0.5rem' }}>
              {s.label}
            </div>
            {s.sub && (
              <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', marginTop: '0.25rem' }}>
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent redemptions feed */}
      <div style={{ ...GLASS, padding: '1.5rem' }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.65rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Recent tears · today
          </p>
          <a href="/admin/redemptions" style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#C9933C', textDecoration: 'none' }}>
            View all →
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {EXAMPLE_FEED.map((r, i) => (
            <div key={r.code} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.625rem 0.875rem',
              background: 'rgba(240,230,210,0.025)',
              borderLeft: i === 0 ? '2px solid rgba(201,147,60,0.7)' : '2px solid rgba(201,147,60,0.2)',
            }}>
              <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#C9933C', minWidth: '3.25rem' }}>{r.time}</span>
              <span style={{ fontSize: '0.875rem', flex: 1, color: '#EFE7D6' }}>{r.venue}</span>
              <span style={{ fontSize: '0.75rem', color: '#8A8077', flex: 1 }}>{r.reward}</span>
              <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.9rem', letterSpacing: '0.18em', color: '#F0E6D2' }}>{r.code}</span>
              <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(201,147,60,0.12)', border: '1px solid rgba(201,147,60,0.28)', color: '#C9933C', letterSpacing: '0.08em' }}>BILLED</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
