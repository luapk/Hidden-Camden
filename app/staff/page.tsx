import Link from 'next/link'
import { and, count, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redemptions, rewards, vouchers } from '@/lib/db/schema'
import { getStaffContext } from '@/lib/staff/auth'
import StaffControls from './StaffControls'

export const dynamic = 'force-dynamic'

function hhmm(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(
    d.getUTCMinutes(),
  ).padStart(2, '0')}`
}

export default async function StaffTodayPage() {
  const ctx = await getStaffContext()

  if (!ctx) {
    return (
      <main className="pt-12 text-center">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          Sign in with your venue email
        </h2>
        <p className="mt-3 text-sm text-smoke">
          Staff access works by magic link. Use the email your manager
          registered with Camden Crawl.
        </p>
        <Link
          href="/api/auth/signin"
          className="mt-6 inline-block rounded-md bg-cream px-6 py-3 font-display text-[15px] uppercase tracking-[0.08em] text-ink"
        >
          Sign in
        </Link>
      </main>
    )
  }

  const { venue } = ctx

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [venueRewards, tornCounts, feed] = await Promise.all([
    db.query.rewards.findMany({ where: eq(rewards.venue_id, venue.id) }),
    db
      .select({ rewardId: vouchers.reward_id, cnt: count() })
      .from(redemptions)
      .innerJoin(vouchers, eq(redemptions.voucher_id, vouchers.id))
      .where(
        and(
          eq(redemptions.venue_id, venue.id),
          gte(redemptions.torn_at, todayStart),
        ),
      )
      .groupBy(vouchers.reward_id),
    db.query.redemptions.findMany({
      where: and(
        eq(redemptions.venue_id, venue.id),
        gte(redemptions.code_issued_at, todayStart),
      ),
      orderBy: [desc(redemptions.code_issued_at)],
      limit: 20,
      with: { voucher: { with: { reward: true } } },
    }),
  ])

  const tornByReward = new Map(tornCounts.map((r) => [r.rewardId, r.cnt]))
  const now = new Date()

  return (
    <main>
      {/* Today's pours vs cap, per reward */}
      <section className="mt-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-smoke">
          Today
        </h2>
        {venueRewards.length === 0 && (
          <p className="mt-3 text-sm text-smoke">
            No rewards set up for this venue yet.
          </p>
        )}
        <div className="mt-3 space-y-4">
          {venueRewards.map((reward) => {
            const torn = tornByReward.get(reward.id) ?? 0
            const pct = Math.min(100, (torn / reward.daily_cap) * 100)
            return (
              <div key={reward.id}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-cream">{reward.sku_label}</span>
                  <span className="font-mono text-[12px] text-brass">
                    {torn} of {reward.daily_cap} poured
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded bg-cream/10">
                  <div
                    className="h-full bg-brass"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Live feed */}
      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-smoke">
          Live feed
        </h2>
        {feed.length === 0 ? (
          <p className="mt-3 text-sm text-smoke">
            Nothing yet today. Reload to refresh.
          </p>
        ) : (
          <table className="mt-3 w-full text-left">
            <tbody>
              {feed.map((r) => {
                const status = r.torn_at
                  ? 'torn'
                  : r.code_expires_at < now
                    ? 'expired'
                    : 'live'
                const when = r.torn_at ?? r.code_issued_at
                return (
                  <tr key={r.id} className="border-b border-cream/10">
                    <td className="py-2 pr-3 font-mono text-[12px] text-smoke">
                      {hhmm(when)}
                    </td>
                    <td className="py-2 pr-3 text-sm text-cream">
                      {r.voucher.reward.sku_label}
                    </td>
                    <td className="py-2 text-right font-mono text-[11px] uppercase tracking-[0.15em]">
                      <span
                        className={
                          status === 'torn'
                            ? 'text-brass'
                            : status === 'live'
                              ? 'text-camden'
                              : 'text-smoke'
                        }
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <p className="mt-2 font-mono text-[10px] text-smoke">
          Reload the page for the latest.
        </p>
      </section>

      {/* Controls */}
      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-smoke">
          Controls
        </h2>
        <StaffControls
          rewards={venueRewards.map((r) => ({
            id: r.id,
            skuLabel: r.sku_label,
            windowStart: r.window_start,
            windowEnd: r.window_end,
            dailyCap: r.daily_cap,
            killSwitch: r.kill_switch,
          }))}
          pinRequired={venue.staff_pin_required}
        />
      </section>
    </main>
  )
}
