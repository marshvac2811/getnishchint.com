# BatchMate — Attendance, Fees & Parent Updates

A working starter build of the MVP described in the product spec: onboarding, batches, members, attendance, automated fee reminders, and broadcast messaging — multi-tenant, with your business as the platform admin.

This is a **real, runnable Next.js project**, not a mockup. It was written in an environment without internet access, so it hasn't been `npm install`-ed or test-run yet — the steps below take you from this code to a live app.

## What's included

- Full Next.js + TypeScript + Tailwind app (`app/`)
- Supabase database schema with row-level security for tenant isolation (`supabase/schema.sql`)
- API routes for every core flow (`app/api/`)
- WhatsApp messaging + Razorpay payment link integration points (`lib/messaging.ts`, `lib/payments.ts`)
- Owner-facing pages: onboarding, dashboard, attendance, fees, members, batches

## What's NOT included (by design — see the spec's "out of scope")

- Native mobile apps
- Staff roles / parent login portal
- Super-admin panel UI (the database support for it — the `status`/`plan_tier` columns and RLS bypass for `super_admin` — is there; the screen itself isn't built yet)
- Automated tests

## Setup steps

### 1. Install dependencies
```
npm install
```

### 2. Create a Supabase project
1. Go to supabase.com → New Project
2. Once created, go to Project Settings → API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — never expose it to the browser)
3. Go to the SQL Editor and run the entire contents of `supabase/schema.sql`
4. Enable Email OTP auth: Authentication → Providers → Email (should be on by default)

Copy `.env.example` to `.env.local` and fill in the three Supabase values.

### 3. WhatsApp provider (for automated reminders)
Sign up with Interakt (interakt.shop) or Gupshup (gupshup.io) — both are built for WhatsApp Business API in India and don't require the full Meta approval process to get started.
- Get your API key and base URL, add to `.env.local` as `WHATSAPP_PROVIDER_API_KEY` / `WHATSAPP_PROVIDER_BASE_URL`
- Create two WhatsApp template messages in their dashboard matching the names used in `lib/messaging.ts`: `fee_reminder` and `broadcast_update`
- Until this is configured, the app will run fine but reminders will just be logged to the console instead of sent — useful for testing the rest of the flow first

### 4. Razorpay (for payment links in reminders)
1. Sign up at razorpay.com, complete KYC (needed before live payments work — test mode works without it)
2. Get your Key ID and Key Secret from Settings → API Keys
3. Add to `.env.local` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`

### 5. Run locally
```
npm run dev
```
Visit `http://localhost:3000`, sign in, and go through onboarding.

### 6. Set up the daily reminder job
The fee-generation + reminder logic lives at `POST /api/fees/generate`, protected by a `CRON_SECRET` header. This needs to run once a day.
- Set `CRON_SECRET` in your env vars to any random string
- Easiest option once deployed on Vercel: add a `vercel.json` with a Cron Job hitting this route daily, or use a free external cron service (e.g. cron-job.org) to POST to `https://yourdomain.com/api/fees/generate` with header `x-cron-secret: <your secret>` once every day

### 7. Deploy
1. Push this code to a GitHub repo
2. Import the repo into Vercel (vercel.com/new)
3. Add all the same env vars from `.env.local` into Vercel's project settings
4. Deploy

### 8. Make yourself super-admin (platform control)
After you've signed up once in the live app, run this in the Supabase SQL editor (replace the email):
```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"super_admin": true}'
where email = 'youremail@example.com';
```
This lets your account read/manage every business's data for support purposes, per the RLS policies in the schema — without needing their login.

## Testing the pilot end-to-end

1. Sign in, complete onboarding for one real business (e.g. your pilot play school)
2. Add a batch and a few real members with real guardian phone numbers
3. Mark attendance for a few days
4. Trigger `/api/fees/generate` manually once (via curl or Postman with the `x-cron-secret` header) to confirm a fee reminder actually sends
5. Once that works end-to-end, you've hit the MVP "Definition of Done" from the product spec

## If you hire a developer instead of building it yourself

Hand them this whole folder plus `product-spec.md` from earlier — the schema, API routes, and acceptance criteria are already written, so their job is mainly: run `npm install`, wire up the accounts above, test the flows, and polish the UI.
