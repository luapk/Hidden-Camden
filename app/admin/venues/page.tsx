import { db } from '@/lib/db'
import { venues } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  live: 'color:#161210;background:#C9933C;',
  draft: 'color:#F0E6D2;background:#8A8077;',
  paused: 'color:#F0E6D2;background:#D8432F;',
}

export default async function VenuesPage() {
  const rows = await db.query.venues.findMany({
    with: { rewards: { columns: { id: true } } },
    orderBy: [desc(venues.created_at)],
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase' }}>
          Venues
        </h1>
        <Link href="/admin/venues/new" className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 transition-opacity">
          Add venue
        </Link>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-smoke/30 text-smoke text-left">
            <th className="pb-2 font-normal" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Name</th>
            <th className="pb-2 font-normal" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Status</th>
            <th className="pb-2 font-normal" style={{ fontFamily: 'var(--font-courier, monospace)' }}>Rewards</th>
            <th className="pb-2 font-normal" style={{ fontFamily: 'var(--font-courier, monospace)' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-b border-smoke/10 hover:bg-smoke/5">
              <td className="py-3">{v.name}</td>
              <td className="py-3">
                <span style={{ fontFamily: 'var(--font-courier, monospace)', fontSize: '0.7rem', padding: '0.15rem 0.4rem', ...(STATUS_STYLE[v.status] ? Object.fromEntries(STATUS_STYLE[v.status].split(';').filter(Boolean).map(s => s.split(':') as [string, string])) : {}) }}>
                  {v.status.toUpperCase()}
                </span>
              </td>
              <td className="py-3 text-smoke">{v.rewards.length}</td>
              <td className="py-3 text-right">
                <Link href={`/admin/venues/${v.id}`} className="text-brass hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-smoke">No venues yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
