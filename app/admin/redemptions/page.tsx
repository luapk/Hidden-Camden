import { db } from '@/lib/db'
import { redemptions, vouchers, rewards, sponsors, venues } from '@/lib/db/schema'
import { and, desc, eq, gte, isNotNull, lte, type SQL } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type RedemptionRow = {
  id: string
  torn_at: Date | null
  code: string
  billed: boolean
  in_geofence: boolean
  venue_name: string
  sku_label: string
  sponsor_name: string
}

const EXAMPLE_REDEMPTIONS: RedemptionRow[] = [
  { id: 'ex-1',  torn_at: new Date('2026-06-22T22:41:00Z'), code: 'MXRW', billed: true,  in_geofence: true,  venue_name: 'The Dublin Castle',  sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-2',  torn_at: new Date('2026-06-22T21:33:00Z'), code: 'FHKP', billed: true,  in_geofence: true,  venue_name: 'The Jazz Cafe',       sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-3',  torn_at: new Date('2026-06-22T20:15:00Z'), code: 'TNDC', billed: true,  in_geofence: true,  venue_name: 'Electric Ballroom',   sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-4',  torn_at: new Date('2026-06-22T19:58:00Z'), code: 'WXJM', billed: true,  in_geofence: true,  venue_name: 'KOKO',                sku_label: 'Camden Hells Lager', sponsor_name: 'Diageo' },
  { id: 'ex-5',  torn_at: new Date('2026-06-22T19:22:00Z'), code: 'HRTP', billed: true,  in_geofence: true,  venue_name: 'The Monarch',         sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-6',  torn_at: new Date('2026-06-22T18:44:00Z'), code: 'ACMN', billed: false, in_geofence: false, venue_name: 'Dingwalls',           sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-7',  torn_at: new Date('2026-06-21T21:07:00Z'), code: 'YXKW', billed: true,  in_geofence: true,  venue_name: 'The Dublin Castle',   sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-8',  torn_at: new Date('2026-06-21T20:30:00Z'), code: 'PFDC', billed: true,  in_geofence: true,  venue_name: 'The Jazz Cafe',       sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-9',  torn_at: new Date('2026-06-21T19:55:00Z'), code: 'MNXT', billed: true,  in_geofence: true,  venue_name: 'KOKO',                sku_label: 'Camden Hells Lager', sponsor_name: 'Diageo' },
  { id: 'ex-10', torn_at: new Date('2026-06-21T18:52:00Z'), code: 'RWHA', billed: true,  in_geofence: true,  venue_name: 'Electric Ballroom',   sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-11', torn_at: new Date('2026-06-21T18:10:00Z'), code: 'TPNW', billed: true,  in_geofence: true,  venue_name: 'The Monarch',         sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
  { id: 'ex-12', torn_at: new Date('2026-06-21T17:40:00Z'), code: 'CDJF', billed: true,  in_geofence: true,  venue_name: 'Dingwalls',           sku_label: 'Pint of Guinness',  sponsor_name: 'Diageo' },
]

function fmt(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) + ' ' +
    d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Europe/London' })
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

const INPUT: React.CSSProperties = {
  background: 'rgba(240,230,210,0.04)',
  border: '1px solid rgba(240,230,210,0.12)',
  color: '#F0E6D2',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
}

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { venueId?: string; dateFrom?: string; dateTo?: string; page?: string }
}) {
  const PAGE_SIZE = 50
  const page = parseInt(searchParams.page ?? '1', 10)
  const offset = (page - 1) * PAGE_SIZE

  let allVenues: { id: string; name: string }[] = []
  let rows: RedemptionRow[] = EXAMPLE_REDEMPTIONS
  let usingExample = true

  try {
    allVenues = await db.query.venues.findMany({ columns: { id: true, name: true } })

    const conditions: SQL<unknown>[] = [isNotNull(redemptions.torn_at)]
    if (searchParams.venueId) conditions.push(eq(redemptions.venue_id, searchParams.venueId))
    if (searchParams.dateFrom) conditions.push(gte(redemptions.torn_at, new Date(searchParams.dateFrom)))
    if (searchParams.dateTo) conditions.push(lte(redemptions.torn_at, new Date(searchParams.dateTo)))

    const dbRows = await db
      .select({
        id: redemptions.id,
        torn_at: redemptions.torn_at,
        code: redemptions.code,
        billed: redemptions.billed,
        in_geofence: redemptions.in_geofence,
        venue_name: venues.name,
        sku_label: rewards.sku_label,
        sponsor_name: sponsors.name,
      })
      .from(redemptions)
      .innerJoin(venues, eq(redemptions.venue_id, venues.id))
      .innerJoin(vouchers, eq(redemptions.voucher_id, vouchers.id))
      .innerJoin(rewards, eq(vouchers.reward_id, rewards.id))
      .innerJoin(sponsors, eq(rewards.sponsor_id, sponsors.id))
      .where(and(...conditions))
      .orderBy(desc(redemptions.torn_at))
      .limit(PAGE_SIZE)
      .offset(offset)

    rows = dbRows
    usingExample = false
  } catch {
    // DB not available; example data shown
  }

  const billedCount = rows.filter((r) => r.billed).length
  const geofenceCount = rows.filter((r) => r.in_geofence).length

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#8A8077', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {usingExample ? 'Example data · ' : ''}{rows.length} tears · {billedCount} billed
        </p>
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Redemptions
        </h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total tears', value: String(rows.length), accent: 'rgba(201,147,60,0.15)' },
          { label: 'Billed', value: String(billedCount), accent: 'rgba(201,147,60,0.12)' },
          { label: 'In geofence', value: String(geofenceCount), accent: 'rgba(138,128,119,0.1)' },
        ].map((s) => (
          <div key={s.label} style={{ ...GLASS, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: '80px', height: '80px', borderRadius: '50%', background: s.accent, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '2rem', color: '#C9933C', lineHeight: 1, textShadow: '0 0 30px rgba(201,147,60,0.45)' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.62rem', color: '#8A8077', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.375rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ ...GLASS, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <select name="venueId" defaultValue={searchParams.venueId ?? ''} style={INPUT}>
            <option value="">All venues</option>
            {allVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input name="dateFrom" type="date" defaultValue={searchParams.dateFrom ?? ''} style={INPUT} />
          <input name="dateTo" type="date" defaultValue={searchParams.dateTo ?? ''} style={INPUT} />
          <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#D8432F', color: '#F0E6D2', fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={{ ...GLASS, padding: '1.375rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(240,230,210,0.08)' }}>
              {['Time', 'Venue', 'Reward', 'Sponsor', 'Code', 'Billed', 'Geo'].map((h) => (
                <th key={h} style={{ padding: '0 0.5rem 0.625rem 0', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', color: '#8A8077', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'left', fontWeight: 'normal' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(240,230,210,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(240,230,210,0.015)' }}>
                <td style={{ padding: '0.625rem 0.5rem 0.625rem 0', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', color: '#C9933C' }}>{fmt(r.torn_at)}</td>
                <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.8rem', color: '#EFE7D6' }}>{r.venue_name}</td>
                <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.75rem', color: '#8A8077' }}>{r.sku_label}</td>
                <td style={{ padding: '0.625rem 0.5rem', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.68rem', color: '#8A8077' }}>{r.sponsor_name}</td>
                <td style={{ padding: '0.625rem 0.5rem', fontFamily: 'var(--font-courier, monospace)', fontSize: '0.85rem', letterSpacing: '0.15em', color: '#F0E6D2' }}>{r.code}</td>
                <td style={{ padding: '0.625rem 0.5rem' }}>
                  {r.billed
                    ? <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(201,147,60,0.12)', border: '1px solid rgba(201,147,60,0.28)', color: '#C9933C', letterSpacing: '0.06em' }}>BILLED</span>
                    : <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.6rem', color: '#8A8077' }}>—</span>
                  }
                </td>
                <td style={{ padding: '0.625rem 0' }}>
                  {r.in_geofence
                    ? <span style={{ color: '#C9933C', fontSize: '0.85rem' }}>✓</span>
                    : <span style={{ color: '#D8432F', fontSize: '0.85rem' }}>!</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === PAGE_SIZE && !usingExample && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Link href={`/admin/redemptions?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
              style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.75rem', color: '#C9933C', textDecoration: 'none' }}>
              Next page →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
