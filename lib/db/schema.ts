import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  real,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// venues
// ---------------------------------------------------------------------------
export const venues = pgTable('venues', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  geofence_radius_m: integer('geofence_radius_m').notNull().default(40),
  address: text('address').notNull(),
  place_id: text('place_id'),
  status: text('status', { enum: ['draft', 'live', 'paused'] })
    .notNull()
    .default('draft'),
  created_by: text('created_by'), // references users.id (NextAuth)
  staff_pin_required: boolean('staff_pin_required').notNull().default(false),
  staff_pin: text('staff_pin'), // 4-digit, nullable
  created_at: timestamp('created_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// sponsors
// ---------------------------------------------------------------------------
export const sponsors = pgTable('sponsors', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  billing_ref: text('billing_ref').notNull(),
})

// ---------------------------------------------------------------------------
// rewards
// ---------------------------------------------------------------------------
export const rewards = pgTable('rewards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  venue_id: text('venue_id')
    .references(() => venues.id)
    .notNull(),
  sponsor_id: text('sponsor_id')
    .references(() => sponsors.id)
    .notNull(),
  sku_label: text('sku_label').notNull(), // e.g. "Pint of Guinness"
  window_start: text('window_start').notNull(), // "HH:MM"
  window_end: text('window_end').notNull(), // "HH:MM"
  // bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
  days_mask: integer('days_mask').notNull(),
  daily_cap: integer('daily_cap').notNull(),
  kill_switch: boolean('kill_switch').notNull().default(false),
  expiry_days: integer('expiry_days').notNull().default(7),
  unit_cost_pence: integer('unit_cost_pence').notNull(),
})

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------
export const routes = pgTable('routes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'live'] })
    .notNull()
    .default('draft'),
  paywall_after_stop: integer('paywall_after_stop').notNull().default(2),
})

// ---------------------------------------------------------------------------
// route_stops
// ---------------------------------------------------------------------------
export const routeStops = pgTable('route_stops', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  route_id: text('route_id')
    .references(() => routes.id)
    .notNull(),
  venue_id: text('venue_id')
    .references(() => venues.id)
    .notNull(),
  reward_id: text('reward_id')
    .references(() => rewards.id)
    .notNull(),
  position: integer('position').notNull(),
  audio_url: text('audio_url'),
  transcript: text('transcript'),
  runtime_s: integer('runtime_s'),
  link_audio_url: text('link_audio_url'),
  is_free: boolean('is_free').notNull().default(false),
})

// ---------------------------------------------------------------------------
// vouchers
// ---------------------------------------------------------------------------
export const vouchers = pgTable(
  'vouchers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull(),
    reward_id: text('reward_id')
      .references(() => rewards.id)
      .notNull(),
    route_stop_id: text('route_stop_id')
      .references(() => routeStops.id)
      .notNull(),
    issued_at: timestamp('issued_at').defaultNow().notNull(),
    expires_at: timestamp('expires_at').notNull(),
    status: text('status', {
      enum: ['banked', 'redeemed', 'expired', 'revoked'],
    })
      .notNull()
      .default('banked'),
    device_hash: text('device_hash').notNull(),
  },
  (table) => ({
    // One active voucher per user per reward
    uniqueActiveVoucher: uniqueIndex('vouchers_user_reward_active_idx')
      .on(table.user_id, table.reward_id)
      .where(
        sql`${table.status} = 'banked' OR ${table.status} = 'redeemed'`,
      ),
  }),
)

// ---------------------------------------------------------------------------
// redemptions
// ---------------------------------------------------------------------------
export const redemptions = pgTable(
  'redemptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    voucher_id: text('voucher_id')
      .references(() => vouchers.id)
      .notNull(),
    code: text('code').notNull(), // 4-char
    code_issued_at: timestamp('code_issued_at').notNull(),
    code_expires_at: timestamp('code_expires_at').notNull(),
    torn_at: timestamp('torn_at'),
    torn_by: text('torn_by'), // staff_user_id | null
    venue_id: text('venue_id')
      .references(() => venues.id)
      .notNull(),
    lat: real('lat'),
    lng: real('lng'),
    in_geofence: boolean('in_geofence').notNull().default(false),
    billed: boolean('billed').notNull().default(false),
  },
  (table) => ({
    // Only one torn redemption per voucher
    uniqueTornRedemption: uniqueIndex('redemptions_voucher_torn_idx')
      .on(table.voucher_id)
      .where(sql`${table.torn_at} IS NOT NULL`),
    voucherIdIdx: index('redemptions_voucher_id_idx').on(table.voucher_id),
  }),
)

// ---------------------------------------------------------------------------
// staff_users
// ---------------------------------------------------------------------------
export const staffUsers = pgTable('staff_users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  venue_id: text('venue_id')
    .references(() => venues.id)
    .notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['manager', 'bar'] })
    .notNull()
    .default('bar'),
  created_at: timestamp('created_at').defaultNow(),
})

// ---------------------------------------------------------------------------
// redemption_denials
// ---------------------------------------------------------------------------
export const routeVersions = pgTable('route_versions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  route_id: text('route_id')
    .references(() => routes.id)
    .notNull(),
  published_at: timestamp('published_at').notNull().defaultNow(),
  paywall_after_stop: integer('paywall_after_stop').notNull(),
  stops_snapshot: text('stops_snapshot').notNull(), // JSON.stringify(RouteStop[])
})

export const redemptionDenials = pgTable('redemption_denials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  voucher_id: text('voucher_id'), // nullable — denial may occur before voucher load
  user_id: text('user_id').notNull(),
  reason: text('reason').notNull(),
  lat: real('lat'),
  lng: real('lng'),
  device_hash: text('device_hash'),
  denied_at: timestamp('denied_at').defaultNow().notNull(),
})

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------
export type Venue = typeof venues.$inferSelect
export type NewVenue = typeof venues.$inferInsert
export type Sponsor = typeof sponsors.$inferSelect
export type NewSponsor = typeof sponsors.$inferInsert
export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
export type Route = typeof routes.$inferSelect
export type NewRoute = typeof routes.$inferInsert
export type RouteStop = typeof routeStops.$inferSelect
export type NewRouteStop = typeof routeStops.$inferInsert
export type Voucher = typeof vouchers.$inferSelect
export type NewVoucher = typeof vouchers.$inferInsert
export type Redemption = typeof redemptions.$inferSelect
export type NewRedemption = typeof redemptions.$inferInsert
export type StaffUser = typeof staffUsers.$inferSelect
export type NewStaffUser = typeof staffUsers.$inferInsert
export type RedemptionDenial = typeof redemptionDenials.$inferSelect
export type NewRedemptionDenial = typeof redemptionDenials.$inferInsert
export type RouteVersion = typeof routeVersions.$inferSelect
export type NewRouteVersion = typeof routeVersions.$inferInsert

// ---------------------------------------------------------------------------
// Relations (required for db.query relational API)
// ---------------------------------------------------------------------------
export const venuesRelations = relations(venues, ({ many }) => ({
  rewards: many(rewards),
  routeStops: many(routeStops),
  staffUsers: many(staffUsers),
  redemptions: many(redemptions),
}))

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  rewards: many(rewards),
}))

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  venue: one(venues, { fields: [rewards.venue_id], references: [venues.id] }),
  sponsor: one(sponsors, { fields: [rewards.sponsor_id], references: [sponsors.id] }),
  vouchers: many(vouchers),
}))

export const routesRelations = relations(routes, ({ many }) => ({
  routeStops: many(routeStops),
  versions: many(routeVersions),
}))

export const routeVersionsRelations = relations(routeVersions, ({ one }) => ({
  route: one(routes, { fields: [routeVersions.route_id], references: [routes.id] }),
}))

export const routeStopsRelations = relations(routeStops, ({ one, many }) => ({
  route: one(routes, { fields: [routeStops.route_id], references: [routes.id] }),
  venue: one(venues, { fields: [routeStops.venue_id], references: [venues.id] }),
  reward: one(rewards, { fields: [routeStops.reward_id], references: [rewards.id] }),
  vouchers: many(vouchers),
}))

export const vouchersRelations = relations(vouchers, ({ one, many }) => ({
  reward: one(rewards, { fields: [vouchers.reward_id], references: [rewards.id] }),
  routeStop: one(routeStops, { fields: [vouchers.route_stop_id], references: [routeStops.id] }),
  redemptions: many(redemptions),
}))

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  voucher: one(vouchers, { fields: [redemptions.voucher_id], references: [vouchers.id] }),
  venue: one(venues, { fields: [redemptions.venue_id], references: [venues.id] }),
}))

export const staffUsersRelations = relations(staffUsers, ({ one }) => ({
  venue: one(venues, { fields: [staffUsers.venue_id], references: [venues.id] }),
}))

export const redemptionDenialsRelations = relations(redemptionDenials, ({ }) => ({}))
