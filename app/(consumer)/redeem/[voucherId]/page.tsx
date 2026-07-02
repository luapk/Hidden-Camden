import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vouchers, type Reward, type Venue, type Voucher } from '@/lib/db/schema'
import { LAUNCH_ROUTE } from '@/lib/tour/launchRoute'
import BrandLogo from '../../BrandLogo'
import RedeemTicket from './RedeemTicket'
import DemoRedeemTicket from './DemoRedeemTicket'

export const dynamic = 'force-dynamic'

type VoucherWithReward = Voucher & { reward: Reward & { venue: Venue } }

export default async function RedeemPage({
  params,
}: {
  params: { voucherId: string }
}) {
  // Demo vouchers (e.g. "demo-1") are served client-side without a DB lookup.
  const demoMatch = params.voucherId.match(/^demo-(\d+)$/)
  if (demoMatch) {
    const position = parseInt(demoMatch[1], 10)
    const stop = LAUNCH_ROUTE.find((s) => s.position === position) ?? LAUNCH_ROUTE[0]
    return (
      <main className="pt-4">
        <div className="rounded-3xl bg-ink p-4 shadow-[0_12px_40px_rgba(22,18,16,0.35)]">
          <DemoRedeemTicket
            venueName={stop.name}
            skuLabel={stop.rewardLabel}
            rewardWindow={stop.rewardWindow}
          />
        </div>
      </main>
    )
  }

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
            <BrandLogo className="mx-auto h-auto w-[120px]" />
            <h1 className="mt-4 font-display text-2xl uppercase leading-tight tracking-tight">
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
