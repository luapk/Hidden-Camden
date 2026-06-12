import { db } from '@/lib/db'
import Link from 'next/link'
import VoucherSearch from './VoucherSearch'

export const dynamic = 'force-dynamic'

export default async function VouchersPage() {
  const venues = await db.query.venues.findMany({ columns: { id: true, name: true } })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '2rem', textTransform: 'uppercase' }}>
          Vouchers
        </h1>
        <Link href="/admin/vouchers/issue" className="px-4 py-2 bg-camden text-cream text-sm hover:opacity-90 transition-opacity">
          Issue voucher
        </Link>
      </div>
      <VoucherSearch venues={venues} />
    </div>
  )
}
