-- Run this in the Supabase SQL editor once, on a fresh project or to migrate an existing one.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- 1. DISTRIBUTORS / ZONE HEADS
-- ─────────────────────────────────────────────────────────
create table if not exists distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null unique,
  zone text not null,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 2. BUSINESSES (TENANTS)
-- ─────────────────────────────────────────────────────────
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical text not null default 'other', -- play_school | gym | dance | tuition | other
  owner_user_id uuid references auth.users(id) not null,
  contact_phone text,
  upi_id text,
  plan_tier text not null default 'basic', -- basic | standard | premium
  status text not null default 'active',   -- active | suspended (kill switch)
  distributor_id uuid references distributors(id) on delete set null,
  trial_end timestamptz,
  address text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 3. STAFF / INSTRUCTORS
-- ─────────────────────────────────────────────────────────
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  role text not null default 'instructor', -- instructor | manager
  assigned_batch_ids uuid[] default '{}',
  status text not null default 'active', -- active | inactive
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 4. BATCHES
-- ─────────────────────────────────────────────────────────
create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  fee_amount numeric not null,
  fee_cycle text not null default 'monthly', -- monthly | quarterly
  due_offset_days int not null default 5,
  schedule_time text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 5. MEMBERS (STUDENTS / CLIENTS)
-- ─────────────────────────────────────────────────────────
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  batch_id uuid references batches(id) on delete set null,
  name text not null,
  guardian_name text,
  guardian_phone text not null,
  join_date date default current_date,
  status text not null default 'active', -- active | paused | left
  access_token text unique default encode(gen_random_bytes(16), 'hex'),
  notes text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 6. ATTENDANCE
-- ─────────────────────────────────────────────────────────
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  batch_id uuid references batches(id) not null,
  business_id uuid references businesses(id) not null,
  session_date date not null,
  status text not null, -- present | absent
  marked_by uuid references auth.users(id),
  marked_at timestamptz default now(),
  unique(member_id, session_date)
);

-- ─────────────────────────────────────────────────────────
-- 7. FEES & PAYMENTS
-- ─────────────────────────────────────────────────────────
create table if not exists fees (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  business_id uuid references businesses(id) not null,
  cycle_start date not null,
  due_date date not null,
  amount numeric not null,
  penalty_per_day numeric default 0,
  status text not null default 'pending', -- pending | paid | overdue
  paid_date date,
  payment_method text, -- upi | cash | razorpay | bank_transfer
  receipt_no text,
  payment_link text,
  reminder_sent_at timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 8. MESSAGES & BROADCASTS
-- ─────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  batch_id uuid references batches(id), -- null = whole business
  message_text text not null,
  channel text not null default 'whatsapp', -- whatsapp | sms
  sent_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 9. FEEDBACK
-- ─────────────────────────────────────────────────────────
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  message text not null,
  rating int default 5,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- 10. PLATFORM FEES (SaaS Subscriptions)
-- ─────────────────────────────────────────────────────────
create table if not exists platform_fees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  amount numeric not null,
  status text not null default 'pending', -- pending | paid | overdue
  due_date date not null,
  paid_date date,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────

alter table businesses enable row level security;
alter table distributors enable row level security;
alter table staff enable row level security;
alter table batches enable row level security;
alter table members enable row level security;
alter table attendance enable row level security;
alter table fees enable row level security;
alter table messages enable row level security;
alter table feedback enable row level security;
alter table platform_fees enable row level security;

-- Businesses
create policy "owner reads own business" on businesses
  for select using (
    owner_user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
    or id in (select business_id from staff where user_id = auth.uid() and status = 'active')
  );

create policy "owner updates own business" on businesses
  for update using (
    owner_user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

create policy "owner inserts own business" on businesses
  for insert with check (owner_user_id = auth.uid());

-- Batches
create policy "tenant isolation batches" on batches
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or business_id in (select business_id from staff where user_id = auth.uid() and status = 'active')
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Members
create policy "tenant isolation members" on members
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or business_id in (select business_id from staff where user_id = auth.uid() and status = 'active')
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Staff
create policy "tenant isolation staff" on staff
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Attendance
create policy "tenant isolation attendance" on attendance
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or business_id in (select business_id from staff where user_id = auth.uid() and status = 'active')
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Fees (Owner & Super Admin only - Hidden from general staff)
create policy "tenant isolation fees" on fees
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Messages
create policy "tenant isolation messages" on messages
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Feedback
create policy "tenant isolation feedback" on feedback
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Platform Fees
create policy "super admin platform fees" on platform_fees
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Distributors
create policy "distributors policy" on distributors
  for all using (
    auth_user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
create index if not exists idx_businesses_owner on businesses (owner_user_id);
create index if not exists idx_members_business on members (business_id);
create index if not exists idx_members_batch on members (batch_id);
create index if not exists idx_members_token on members (access_token);
create index if not exists idx_attendance_batch_date on attendance (batch_id, session_date);
create index if not exists idx_attendance_member on attendance (member_id, session_date);
create index if not exists idx_fees_business_status on fees (business_id, status);
create index if not exists idx_fees_due_status on fees (due_date, status);
create index if not exists idx_staff_business on staff (business_id);
