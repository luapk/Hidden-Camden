import { db } from '@/lib/db'
import { redemptions, vouchers, rewards, sponsors, venues } from '@/lib/db/schema'
import { and, desc, eq, gte, isNotNull, lte, type SQL } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' +
    d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
}

export default async function RedemptionsPage({
  searchParams,
}: {
  searchParams: { venueId?: string; dateFrom?: string; dateTo?: string; page?: string }
}) {
  const PAGE_SIZE = 50
  const page = parseInt(searchParams.page ?? '1', 10)
  const offset = (page - 1) * PAGE_SIZE

  const allVenues = await db.query.venues.findMany({ columns: { id: true, name: true } })

  const conditions: SQL<unknown>[] = [isNotNull(redemptions.torn_at)]
  if (searchParams.venueId) conditions.push(eq(redemptions.venue_id, searchParams.venueId))
  if (searchParams.dateFrom) conditions.push(gte(redemptions.torn_at, new Date(searchParams.dateFrom)))
  if (searchParams.dateTo) conditions.push(lte(redemptions.torn_at, new Date(searchParams.dateTo)))

  const rows = await db
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase' }}>
          Redemptions
        </h1>
      </div>

      {/* Filter bar */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <select name="venueId" defaultValue={searchParams.venueId ?? ''}
          className="bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none">
          <option value="">All venues</option>
          {allVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input name="dateFrom" type="date" defaultValue={searchParams.dateFrom ?? ''}
          className="bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none" />
        <input name="dateTo" type="date" defaultValue={searchParams.dateTo ?? ''}
          className="bg-ink border border-smoke/40 text-cream px-3 py-2 text-sm focus:border-brass focus:outline-none" />
        <button type="submit" className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90"
          style={{ fontFamily: 'var(--font-anton, sans-serif)', textTransform: 'uppercase' }}>
          Filter
        </button>
      </form>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-smoke/30 text-smoke text-left">
            {['Time', 'Venue', 'Reward', 'Sponsor', 'Code', 'Billed', 'Geofence'].map((h) => (
              <th key={h} className="pb-2 font-normal text-xs" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-smoke/10 hover:bg-smoke/5">
              <td className="py-2 text-xs" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{fmt(r.torn_at)}</td>
              <td className="py-2 text-sm">{r.venue_name}</td>
              <td className="py-2 text-sm">{r.sku_label}</td>
              <td className="py-2 text-xs text-smoke">{r.sponsor_name}</td>
              <td className="py-2 text-xs" style={{ fontFamily: 'var(--font-courier, monospace)' }}>{r.code}</td>
              <td className="py-2 text-xs">
                <span style={{ color: r.billed ? '#C9933C' : '#8A8077' }}>{r.billed ? 'Billed' : 'Unbilled'}</span>
              </td>
              <td className="py-2 text-xs">
                {r.in_geofence ? <span style={{ color: '#C9933C' }}>✓</span> : <span style={{ color: '#D8432F' }}>!</span>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="py-8 text-center text-smoke">No torn redemptions found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {rows.length === PAGE_SIZE && (
        <div className="mt-4 flex justify-end">
          <Link href={`/admin/redemptions?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
            className="text-sm text-brass hover:underline" style={{ fontFamily: 'var(--font-courier, monospace)' }}>
            Next page →
          </Link>
        </div>
      )}
    </div>
  )
}
