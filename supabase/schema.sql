-- Run this in the Supabase SQL editor once, on a fresh project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────────────────────

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical text not null default 'other', -- play_school | gym | dance | tuition | other
  owner_user_id uuid references auth.users(id) not null,
  contact_phone text,
  plan_tier text not null default 'basic', -- basic | standard | premium
  status text not null default 'active',   -- active | suspended  (your kill switch)
  created_at timestamptz default now()
);

create table batches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  fee_amount numeric not null,
  fee_cycle text not null default 'monthly', -- monthly | quarterly
  due_offset_days int not null default 5,
  created_at timestamptz default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  batch_id uuid references batches(id) on delete set null,
  name text not null,
  guardian_name text,
  guardian_phone text not null,
  join_date date default current_date,
  status text not null default 'active', -- active | paused | left
  created_at timestamptz default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  batch_id uuid references batches(id) not null,
  business_id uuid references businesses(id) not null,
  session_date date not null,
  status text not null, -- present | absent
  marked_at timestamptz default now(),
  unique(member_id, session_date)
);

create table fees (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  business_id uuid references businesses(id) not null,
  cycle_start date not null,
  due_date date not null,
  amount numeric not null,
  status text not null default 'pending', -- pending | paid | overdue
  paid_date date,
  payment_link text,
  reminder_sent_at timestamptz,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  batch_id uuid references batches(id), -- null = whole business
  message_text text not null,
  channel text not null default 'whatsapp', -- whatsapp | sms
  sent_at timestamptz default now()
);

-- Platform admin flag - set this manually on your own auth.users row.
-- e.g. update auth.users set raw_app_meta_data = raw_app_meta_data || '{"super_admin": true}' where email = 'you@example.com';

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — this is what keeps each business's
-- data isolated from every other business.
-- ─────────────────────────────────────────────────────────

alter table businesses enable row level security;
alter table batches enable row level security;
alter table members enable row level security;
alter table attendance enable row level security;
alter table fees enable row level security;
alter table messages enable row level security;

-- Owners can only see/edit their own business row
create policy "owner reads own business" on businesses
  for select using (owner_user_id = auth.uid() or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true);
create policy "owner updates own business" on businesses
  for update using (owner_user_id = auth.uid());
create policy "owner inserts own business" on businesses
  for insert with check (owner_user_id = auth.uid());

-- Helper pattern repeated for every child table: only rows whose
-- business_id belongs to the logged-in owner (or you, as super_admin).
create policy "tenant isolation batches" on batches
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

create policy "tenant isolation members" on members
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

create policy "tenant isolation attendance" on attendance
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

create policy "tenant isolation fees" on fees
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

create policy "tenant isolation messages" on messages
  for all using (
    business_id in (select id from businesses where owner_user_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'super_admin')::boolean = true
  );

-- Indexes for the queries the app runs most often
create index on members (business_id);
create index on members (batch_id);
create index on attendance (batch_id, session_date);
create index on fees (business_id, status);
create index on fees (due_date, status);
