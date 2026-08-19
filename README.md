# BatchMate — Attendance, Fees, Staff & Parent Portal SaaS

BatchMate is a multi-tenant SaaS application tailored for play schools, coaching centers, dance academies, karate dojos, and tuition classes to manage onboarding, batches, member tracking, staff/instructor roles, attendance, automated WhatsApp fee reminders, digital PDF receipts, and visual reports.

---

## 🌟 Key Features

1. **Owner Dashboard & Visual Analytics (`/dashboard`)**
   - 7-day attendance trend charts (daily present/absent counts).
   - Real-time fee collection progress gauge (Billed vs Collected vs Pending vs Overdue).
   - Batch capacity and student distribution metrics.

2. **Daily Attendance Marker (`/dashboard/attendance`)**
   - 1-click batch attendance marking with quick present/absent toggles.

3. **Fees, Invoicing & Digital Receipts (`/dashboard/fees`, `/receipt/[id]`)**
   - Automatic fee generation with configurable billing cycles and overdue grace periods.
   - 1-click WhatsApp payment reminders with dynamic UPI payment links.
   - **Printable & PDF-ready Digital Fee Receipts** with verification stamps and itemized breakdown.

4. **Parent & Student Portal (`/m/[token]`)**
   - Mobile-optimized personal link for parents.
   - Monthly attendance calendar with color-coded badges.
   - Instant UPI payment button (GPay, PhonePe, Paytm) + Scannable QR Code.
   - Downloadable fee receipts.
   - 1-click WhatsApp support button to message the academy.

5. **Staff & Instructor Management (`/dashboard/staff`)**
   - Invite teachers/coaches and assign them to specific batches.
   - Role-based permissions (Instructors can mark attendance without seeing fee revenue).

6. **Monthly Business Reports (`/dashboard/reports`)**
   - Month-over-month attendance rate and collection analytics.
   - **1-Click CSV Export** for Excel / Google Sheets accounting.

7. **Admin & Distribution Engine (`/admin`, `/distributor`)**
   - Platform super-admin console with tenant kill-switch and platform fee monitoring.
   - Zone Head / Distributor portal for partner referral commissions.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15+ (App Router), React 19, Tailwind CSS, TypeScript
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security & PGCrypto)
- **Messaging:** WhatsApp Cloud API / Interakt / Gupshup integration points (`lib/messaging.ts`)
- **Payments:** Direct UPI deep-linking + Razorpay payment links (`lib/payments.ts`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in Supabase and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. *(Optional)* To test with realistic demo data, run [`supabase/seed.sql`](supabase/seed.sql).
4. Copy `.env.example` to `.env.local` and add your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   CRON_SECRET=your_random_secret_string
   ```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⏰ Automated Cron Jobs

Vercel Cron is configured in `vercel.json` for:
- **Fee Generation & WhatsApp Reminders:** Runs daily at 03:30 UTC (`POST /api/fees/generate`)
- **Trial Expiry Check:** Runs daily at 04:00 UTC (`POST /api/cron/trial-expiry`)

For custom triggers or external schedulers (e.g. cron-job.org), send a `POST` request with the header:
```http
x-cron-secret: <CRON_SECRET>
```

---

## 🛡️ Super-Admin Privileges

To grant your account platform super-admin rights:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"super_admin": true}'
WHERE email = 'you@example.com';
```
