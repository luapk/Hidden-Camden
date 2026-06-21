# CLAUDE.md — Hidden Camden

## What this project is

Hidden Camden is a geofenced audio tour app for Camden's music venues. Users walk a fixed route from Camden Town tube; each venue stop unlocks only when they physically arrive (40m geofence, 8s dwell). Unlocking plays a ~2:15 audio story and banks a drink voucher, redeemable later inside a venue-controlled window. Sponsors (Diageo brands) fund the drinks per verified redemption; venues pay nothing for stock and control when vouchers can be redeemed. Revenue: £4.99 tour purchase (stops 1–2 free, paywall fires mid-walk to stop 3), sponsor activation fees per redemption, venue analytics SaaS, gig ticket commission.

The consumer app concept, scripts, and a UX simulator already exist. **This codebase's current priorities are two backend-and-admin features:**

1. **Voucher tear** — the production redemption flow (the simulator only fakes it)
2. **Admin** — voucher/reward management and bar/route management, including adding new bars

## Reference assets (do not rebuild, read for intent)

- `reference/camden-crawl-simulator.jsx` — UX simulator. The redeem screen here is the visual spec for voucher tear: paper ticket, 4-char code, 60-second countdown bar, "STAFF: TEAR HERE" button.
- `reference/camden-crawl-audio-scripts.md` — the 7-stop script pack. Source of truth for stop names, reward labels, and redemption windows on the launch route.

## Stack

- Next.js 14+ (App Router), TypeScript strict
- Postgres (Neon) via Drizzle ORM
- Auth: NextAuth — magic link for venue staff, credentials/SSO for internal admin
- Deployed on Vercel
- Styling: Tailwind + the design tokens below. No component library; the look is bespoke.

### Commands

```bash
pnpm dev          # local dev
pnpm db:generate  # drizzle migration from schema changes
pnpm db:migrate   # apply migrations
pnpm db:seed      # seeds the launch route (7 stops, see scripts file)
pnpm test         # vitest
pnpm lint && pnpm typecheck   # must pass before any commit
```

## Repo layout

```
app/
  (consumer)/        # tour, wallet, redeem screens (PWA)
  admin/             # internal admin: routes, venues, rewards, sponsors
  staff/             # venue-facing: today's redemptions, kill switch, caps
  api/               # route handlers
lib/
  db/schema.ts       # drizzle schema — single source of truth
  vouchers/          # issue, code-mint, tear, expiry logic
  geo/               # geofence math, spoof checks
reference/           # simulator + scripts (read-only)
```

## Data model

```
venues        id, name, slug, lat, lng, geofence_radius_m (default 40),
              address, place_id, status (draft|live|paused), created_by
routes        id, name, status (draft|live), paywall_after_stop (int)
route_stops   id, route_id, venue_id, position (int), audio_url,
              transcript, runtime_s, link_audio_url, is_free (bool)
rewards       id, venue_id, sponsor_id, sku_label ("Pint of Guinness"),
              window_start, window_end, days_mask (bitmask Mon–Sun),
              daily_cap (int), kill_switch (bool), expiry_days (default 7),
              unit_cost_pence (what sponsor is billed)
sponsors      id, name, billing_ref
vouchers      id, user_id, reward_id, route_stop_id, issued_at,
              expires_at, status (banked|redeemed|expired|revoked),
              device_hash
redemptions   id, voucher_id, code, code_issued_at, code_expires_at,
              torn_at, torn_by (staff_user_id|null), venue_id,
              lat, lng, in_geofence (bool), billed (bool)
staff_users   id, venue_id, email, role (manager|bar)
```

Rules enforced at the DB level where possible: unique partial index on `vouchers (user_id, reward_id) WHERE status = 'banked' OR status = 'redeemed'` (one voucher per user per reward), and `redemptions.voucher_id` unique once `torn_at` is set.

## Feature 1: Voucher tear

The redemption flow. The simulator's redeem screen is the UI spec; this builds the real thing.

### Flow

1. User taps a banked voucher in their wallet → `POST /api/vouchers/:id/code`
2. Server validates ALL of: voucher status is `banked` and unexpired; current time inside the reward's window + days_mask; venue kill_switch off; daily_cap not hit (count today's torn redemptions for this reward); user location inside venue geofence (client sends lat/lng, server checks distance; reject obvious spoofs — see fraud rules)
3. On pass: mint a redemption row with a 4-char code (alphabet `ACDEFHJKMNPRTWXY` — no ambiguous glyphs), `code_expires_at = now + 60s`. Return code + expiry. Client renders the live countdown ticket.
4. Staff tears: the **user's** phone shows a "STAFF: TEAR HERE" button (zero venue hardware). Tap → `POST /api/redemptions/:id/tear`. Server checks code unexpired and untorn, sets `torn_at`, flips voucher to `redeemed`, emits a `redemption.torn` event for sponsor billing.
5. Code expiry without tear: voucher stays `banked`, user can mint a fresh code immediately. Codes are cheap; vouchers are precious. Never let a dead code eat a drink.

### Hard rules

- Tear must be **idempotent**: double-tap returns the same success state, never a 500, never a second billing event.
- All validation server-side. The client countdown is theatre; `code_expires_at` is law.
- Code minting is rate-limited: max 5 codes per voucher per hour (stops code-farming for screenshot relay).
- Fraud checks on mint: reject if device reports mock location; reject if distance from last known fix implies >25 km/h travel; log everything rejected with reason (`redemption_denials` table) — denial analytics are a product feature later.
- Optional staff PIN mode per venue (`staff_pin_required` flag on venue): tear requires a 4-digit venue PIN instead of a bare tap. Build the flag and the check; default off.
- Every torn redemption writes the billing line: `reward.unit_cost_pence` against `sponsor_id`. Monthly sponsor invoice = sum of billed redemptions. Never bill an untorn code.

### Edge cases to handle and test

- Window closes while a live code is on screen → tear still succeeds if code was minted in-window (the pint is being poured; don't argue at the tap)
- Daily cap reached between mint and tear → tear succeeds (cap gates minting, not tearing)
- Voucher expires mid-conversation → mint fails with a human message: "This one's expired — the tour bank keeps drinks for 7 days"
- Offline tear: client queues a signed tear payload (voucher_id, code, device timestamp, HMAC with the code as part of the key) and syncs; server accepts if the code was valid at the device timestamp. Build the endpoint; client queue can come later.

## Feature 2: Admin — vouchers, bars, routes

Internal admin at `/admin` (role: internal). Venue-facing controls at `/staff` (role: manager). Keep them separate surfaces; venues must never see other venues' data or sponsor economics.

### Add a new bar (`/admin/venues/new`)

- Form: name, address, lat/lng (map-pin picker; paste a Google Maps link and parse coords as a convenience), geofence radius (default 40m, range 25–80), status starts `draft`
- Creating a venue does NOT put it on a route. Venues are a library; routes compose them.
- Attach rewards inline: sku_label, sponsor (dropdown), window, days, daily cap, unit cost. A venue can hold multiple rewards (e.g. a daytime pint and a club-night voucher) but a route stop references exactly one.
- Invite venue staff by email from the venue page (magic link → `/staff`).

### Route builder (`/admin/routes/:id`)

- Ordered list of stops, drag to reorder, each row: venue picker, reward picker (filtered to that venue), audio file upload (or URL), transcript textarea, runtime, link audio for the walk to the NEXT stop
- `paywall_after_stop` selector — which stop number the free tier ends at (launch route: 2)
- Validation before publish: every stop has audio + transcript + a live reward; venue status is `live`; geofences of adjacent stops don't overlap (warn, don't block — Camden is dense); total runtime estimate shown (sum of stop runtimes + links)
- Publish = atomic flip to `live`. Consumers mid-tour on the old version finish on the old version (routes are versioned: snapshot `route_stops` into `route_versions` on publish; vouchers reference the version's stop).

### Voucher admin (`/admin/vouchers`)

- Search by user, venue, status, date
- Actions: revoke (with reason, for fraud), extend expiry, manual issue (comp a voucher to a user — needed constantly for support)
- Redemption feed: live table of tears with venue, time, sponsor, billed flag. This view grows into the Diageo dashboard; build it as a query over `redemptions`, not a separate store.

### Staff surface (`/staff` — venue managers)

- Today: redemptions count vs daily cap, live feed
- Controls: kill switch toggle (instant), edit window/cap (takes effect on next mint), toggle staff PIN
- Nothing else. A bar manager checks this on a phone behind the bar in 10 seconds.

## Design tokens (match the simulator)

- Ink `#161210`, paper `#F0E6D2`, Camden red `#D8432F`, brass `#C9933C`, cream `#EFE7D6`, smoke `#8A8077`
- Display: Anton (uppercase, tight). Ticket/data: Courier Prime. Body: system sans.
- Admin can be plainer than consumer, but redemption tickets and anything venue staff see should keep the paper-ticket language — staff recognise the look, which is itself an anti-fraud feature.

## Copy rules (user-facing strings)

- Never use em dashes in any user-facing copy. Use full stops, commas, or restructure.
- Voice: dry, North London, confident. "Your drink is still banked", not "Oops! Something went wrong."
- Errors say what happened and what to do. Never apologise, never exclaim.
- Buttons say what they do: "Tear", "Bank reward", "Unlock the last five".

## Definition of done

- `pnpm lint && pnpm typecheck && pnpm test` green
- Voucher tear: integration tests covering the happy path, double-tear idempotency, expired code re-mint, out-of-window mint denial, cap-gates-mint-not-tear, kill switch, geofence rejection, billing event emitted exactly once
- Admin: a new bar can go from created → reward attached → placed on a draft route → published, entirely through the UI
- No secrets in client bundles; geofence checks and all voucher state transitions are server-side only

## Environment

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ADMIN_ALLOWED_EMAILS=        # comma-separated internal admins
AUDIO_STORAGE_URL=           # blob store base for stop audio
```

## Out of scope right now (don't build, don't scaffold)

Native app shells, background geofencing, PRS-cleared audio pipeline, sponsor self-serve portal, gig ticketing integration, payments (paywall purchase is stubbed behind a feature flag).
