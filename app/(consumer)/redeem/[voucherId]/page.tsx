import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers } from '@/lib/db/schema'
import RedeemTicket from './RedeemTicket'

export const dynamic = 'force-dynamic'

export default async function RedeemPage({
  params,
}: {
  params: { voucherId: string }
}) {
  const voucher = await db.query.vouchers.findFirst({
    where: eq(vouchers.id, params.voucherId),
    with: {
      reward: {
        with: {
          venue: true,
        },
      },
    },
  })

  if (!voucher) {
    return (
      <main className="pt-10">
        <div className="rounded-lg bg-paper px-5 py-8 text-center text-ink shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#a3431f]">
            Camden Crawl
          </div>
          <h1 className="mt-2 font-display text-2xl uppercase leading-tight tracking-tight">
            This voucher does not exist
          </h1>
          <p className="mt-3 text-sm text-[#6b5c44]">
            Check your wallet for the right ticket.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-4">
      <RedeemTicket
        voucher={{
          id: voucher.id,
          skuLabel: voucher.reward.sku_label,
          venueName: voucher.reward.venue.name,
          status: voucher.status,
          expiresAt: voucher.expires_at.toISOString(),
        }}
      />
    </main>
  )
}
