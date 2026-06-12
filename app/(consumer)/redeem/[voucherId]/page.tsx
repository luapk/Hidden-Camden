import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers, type Reward, type Venue, type Voucher } from '@/lib/db/schema'
import RedeemTicket from './RedeemTicket'

export const dynamic = 'force-dynamic'

type VoucherWithReward = Voucher & { reward: Reward & { venue: Venue } }

export default async function RedeemPage({
  params,
}: {
  params: { voucherId: string }
}) {
  // The consumer shell is white; the ticket keeps its paper-on-dark look,
  // so the redeem surface wraps everything in an ink panel.
  let voucher: VoucherWithReward | undefined
  try {
    voucher = await db.query.vouchers.findFirst({
      where: eq(vouchers.id, params.voucherId),
      with: {
        reward: {
          with: {
            venue: true,
          },
        },
      },
    })
  } catch {
    voucher = undefined
  }

  if (!voucher) {
    return (
      <main className="pt-4">
        <div className="rounded-3xl bg-ink p-4 shadow-[0_12px_40px_rgba(22,18,16,0.35)]">
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
        </div>
      </main>
    )
  }

  return (
    <main className="pt-4">
      <div className="rounded-3xl bg-ink p-4 shadow-[0_12px_40px_rgba(22,18,16,0.35)]">
        <RedeemTicket
          voucher={{
            id: voucher.id,
            skuLabel: voucher.reward.sku_label,
            venueName: voucher.reward.venue.name,
            status: voucher.status,
            expiresAt: voucher.expires_at.toISOString(),
          }}
        />
      </div>
    </main>
  )
}
