CREATE TABLE IF NOT EXISTS "auth_accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "auth_accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "auth_verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redemption_denials" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_id" text,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"lat" real,
	"lng" real,
	"device_hash" text,
	"denied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_id" text NOT NULL,
	"code" text NOT NULL,
	"code_issued_at" timestamp NOT NULL,
	"code_expires_at" timestamp NOT NULL,
	"torn_at" timestamp,
	"torn_by" text,
	"venue_id" text NOT NULL,
	"lat" real,
	"lng" real,
	"in_geofence" boolean DEFAULT false NOT NULL,
	"billed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"sponsor_id" text NOT NULL,
	"sku_label" text NOT NULL,
	"window_start" text NOT NULL,
	"window_end" text NOT NULL,
	"days_mask" integer NOT NULL,
	"daily_cap" integer NOT NULL,
	"kill_switch" boolean DEFAULT false NOT NULL,
	"expiry_days" integer DEFAULT 7 NOT NULL,
	"unit_cost_pence" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"venue_id" text NOT NULL,
	"reward_id" text NOT NULL,
	"position" integer NOT NULL,
	"audio_url" text,
	"transcript" text,
	"runtime_s" integer,
	"link_audio_url" text,
	"is_free" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"paywall_after_stop" integer NOT NULL,
	"stops_snapshot" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"paywall_after_stop" integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sponsors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"billing_ref" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_users" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'bar' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venues" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"geofence_radius_m" integer DEFAULT 40 NOT NULL,
	"address" text NOT NULL,
	"place_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"staff_pin_required" boolean DEFAULT false NOT NULL,
	"staff_pin" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reward_id" text NOT NULL,
	"route_stop_id" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" text DEFAULT 'banked' NOT NULL,
	"device_hash" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_auth_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_auth_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_versions" ADD CONSTRAINT "route_versions_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_route_stop_id_route_stops_id_fk" FOREIGN KEY ("route_stop_id") REFERENCES "public"."route_stops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "redemptions_voucher_torn_idx" ON "redemptions" USING btree ("voucher_id") WHERE "redemptions"."torn_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "redemptions_voucher_id_idx" ON "redemptions" USING btree ("voucher_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vouchers_user_reward_active_idx" ON "vouchers" USING btree ("user_id","reward_id") WHERE "vouchers"."status" = 'banked' OR "vouchers"."status" = 'redeemed';