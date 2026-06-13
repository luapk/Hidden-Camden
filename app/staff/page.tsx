import Link from 'next/link'
import { and, count, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redemptions, rewards, vouchers } from '@/lib/db/schema'
import { getStaffContext } from '@/lib/staff/auth'
import StaffControls from './StaffControls'
import LiveRefresh from './LiveRefresh'

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
      <main className="pt-14 text-center">
        <div className="font-grotesk text-[10px] uppercase tracking-[0.35em] text-acid">
          Staff access
        </div>
        <h2 className="mt-2 font-jost text-2xl font-bold uppercase tracking-tight text-label-1">
          Sign in with your venue email
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-label-2">
          Staff access works by magic link. Use the email your manager
          registered with Camden Crawl.
        </p>
        <Link
          href="/staff/signin"
          className="mt-6 inline-block bg-acid px-6 py-3 font-jost text-[15px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
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
  const tornToday = tornCounts.reduce((sum, r) => sum + r.cnt, 0)

  return (
    <main>
      {/* Live status + day total */}
      <div className="mt-5 flex items-center justify-between">
        <LiveRefresh />
        <div
          className="font-grotesk leading-none"
          aria-label={`${tornToday} poured today`}
        >
          <span className="text-3xl font-bold text-acid">
            {String(tornToday).padStart(2, '0')}
          </span>
          <span className="ml-1.5 text-[11px] uppercase tracking-[0.2em] text-label-3">
            poured today
          </span>
        </div>
      </div>

      {/* Today's pours vs cap, per reward */}
      <section className="mt-7">
        <h2 className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
          Today
        </h2>
        {venueRewards.length === 0 && (
          <p className="mt-3 text-sm text-label-2">
            No rewards set up for this venue yet.
          </p>
        )}
        <div className="mt-4 space-y-5">
          {venueRewards.map((reward) => {
            const torn = tornByReward.get(reward.id) ?? 0
            const pct = Math.min(100, (torn / reward.daily_cap) * 100)
            const capped = torn >= reward.daily_cap
            const paused = reward.kill_switch
            return (
              <div key={reward.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-label-1">
                    {reward.sku_label}
                  </span>
                  <span className="shrink-0 font-grotesk text-[12px] text-label-2">
                    <span
                      className={
                        capped
                          ? 'text-camden'
                          : paused
                            ? 'text-label-3'
                            : 'text-acid'
                      }
                    >
                      {torn}
                    </span>{' '}
                    of {reward.daily_cap}
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden bg-white/10">
                  <div
                    className={`h-full transition-[width] duration-500 ${
                      capped ? 'bg-camden' : paused ? 'bg-label-3' : 'bg-acid'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {(capped || paused) && (
                  <div className="mt-1 font-grotesk text-[10px] uppercase tracking-[0.15em] text-label-3">
                    {paused ? 'Paused' : 'Cap reached for today'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Live feed */}
      <section className="mt-9">
        <h2 className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
          Live feed
        </h2>
        {feed.length === 0 ? (
          <p className="mt-3 text-sm text-label-2">Nothing yet today.</p>
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
                  <tr key={r.id} className="border-b border-white/10">
                    <td className="py-2.5 pr-3 font-grotesk text-[12px] text-label-3">
                      {hhmm(when)}
                    </td>
                    <td className="py-2.5 pr-3 text-sm text-label-1">
                      {r.voucher.reward.sku_label}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`font-grotesk text-[10px] uppercase tracking-[0.2em] ${
                          status === 'torn'
                            ? 'text-acid'
                            : status === 'live'
                              ? 'text-label-1'
                              : 'text-label-3'
                        }`}
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
      </section>

      {/* Controls */}
      <section className="mt-9">
        <h2 className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-label-2">
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
