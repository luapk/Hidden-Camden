import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type VenueRow = {
  id: string; name: string; status: string; address: string
  lat: number; lng: number; rewardCount: number
}

const EXAMPLE_VENUES: VenueRow[] = [
  { id: 'ex-1', name: 'The Dublin Castle', status: 'live', address: '94 Parkway, Camden Town NW1 7AN', lat: 51.5394, lng: -0.1477, rewardCount: 1 },
  { id: 'ex-2', name: 'The Monarch', status: 'live', address: '49 Chalk Farm Rd NW1 8AN', lat: 51.5401, lng: -0.1484, rewardCount: 1 },
  { id: 'ex-3', name: 'Electric Ballroom', status: 'live', address: '184 Camden High St NW1 8QP', lat: 51.5392, lng: -0.1432, rewardCount: 2 },
  { id: 'ex-4', name: 'The Jazz Cafe', status: 'live', address: '5 Parkway, Camden Town NW1 7PG', lat: 51.5388, lng: -0.1435, rewardCount: 1 },
  { id: 'ex-5', name: 'KOKO', status: 'live', address: '1A Camden High St NW1 7JE', lat: 51.5358, lng: -0.1387, rewardCount: 1 },
  { id: 'ex-6', name: 'The Roundhouse', status: 'draft', address: 'Chalk Farm Rd NW1 8EH', lat: 51.5429, lng: -0.1516, rewardCount: 0 },
  { id: 'ex-7', name: 'Dingwalls', status: 'live', address: 'Middle Yard, Camden Lock NW1 8AB', lat: 51.5416, lng: -0.1467, rewardCount: 1 },
]

const STATUS_GLASS: Record<string, { bg: string; border: string; color: string }> = {
  live:   { bg: 'rgba(201,147,60,0.12)', border: 'rgba(201,147,60,0.3)',  color: '#C9933C' },
  draft:  { bg: 'rgba(138,128,119,0.14)', border: 'rgba(138,128,119,0.28)', color: '#8A8077' },
  paused: { bg: 'rgba(216,67,47,0.12)',  border: 'rgba(216,67,47,0.3)',   color: '#D8432F' },
}

const GLASS: React.CSSProperties = {
  background: 'rgba(22,18,16,0.55)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(240,230,210,0.08)',
  borderTopColor: 'rgba(240,230,210,0.18)',
  borderLeftColor: 'rgba(240,230,210,0.12)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
}

export default async function VenuesPage() {
  let rows: VenueRow[] = EXAMPLE_VENUES

  try {
    const dbRows = await db.query.venues.findMany({
      with: { rewards: { columns: { id: true } } },
      orderBy: [desc(venues.created_at)],
    })
    if (dbRows.length > 0) {
      rows = dbRows.map((v) => ({
        id: v.id, name: v.name, status: v.status, address: v.address,
        lat: v.lat, lng: v.lng, rewardCount: v.rewards.length,
      }))
    }
  } catch {
    // DB not available; example data shown
  }

  const liveCount = rows.filter((v) => v.status === 'live').length

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {rows.length} venues · {liveCount} live
          </p>
          <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Venues
          </h1>
        </div>
        <Link href="/admin/venues/new" style={{ padding: '0.5rem 1.25rem', background: '#D8432F', color: '#F0E6D2', fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', textDecoration: 'none' }}>
          Add venue
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {rows.map((v) => {
          const badge = STATUS_GLASS[v.status] ?? STATUS_GLASS.draft
          return (
            <div key={v.id} style={{ ...GLASS, padding: '1.375rem', position: 'relative', overflow: 'hidden' }}>
              {v.status === 'live' && (
                <div style={{ position: 'absolute', top: '-35px', right: '-35px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(201,147,60,0.09)', filter: 'blur(28px)', pointerEvents: 'none' }} />
              )}

              <div className="flex items-start justify-between mb-2">
                <h3 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F0E6D2', lineHeight: 1.2 }}>
                  {v.name}
                </h3>
                <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', padding: '0.15rem 0.45rem', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, letterSpacing: '0.1em', backdropFilter: 'blur(8px)', flexShrink: 0, marginLeft: '0.5rem' }}>
                  {v.status.toUpperCase()}
                </span>
              </div>

              <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', marginBottom: '1rem', lineHeight: 1.4 }}>
                {v.address}
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: '#8A8077', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rewards</div>
                    <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '1.25rem', color: '#C9933C', lineHeight: 1, marginTop: '0.15rem' }}>{v.rewardCount}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.58rem', color: '#8A8077', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coords</div>
                    <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.68rem', color: '#EFE7D6', marginTop: '0.15rem' }}>
                      {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/venues/${v.id}`} style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', color: '#C9933C', textDecoration: 'none' }}>
                  Edit →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
