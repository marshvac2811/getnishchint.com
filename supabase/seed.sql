-- ====================================================================
-- SEED DATA SCRIPT FOR BATCHMATE
-- Run this in the Supabase SQL Editor AFTER running schema.sql
-- Note: Replace '<YOUR_AUTH_USER_ID>' with your actual auth.uid() from auth.users
-- ====================================================================

DO $$
DECLARE
  v_owner_id uuid;
  v_biz_id uuid;
  v_batch_dance uuid;
  v_batch_karate uuid;
  v_batch_art uuid;
  v_m1 uuid;
  v_m2 uuid;
  v_m3 uuid;
  v_m4 uuid;
  v_m5 uuid;
BEGIN
  -- Get the first user id from auth.users, or generate a dummy one
  SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
  IF v_owner_id IS NULL THEN
    v_owner_id := gen_random_uuid();
  END IF;

  -- 1. Create sample business
  INSERT INTO businesses (name, vertical, owner_user_id, contact_phone, upi_id, plan_tier, status, address)
  VALUES ('Little Stars Academy', 'dance', v_owner_id, '9876543210', 'littlestars@upi', 'standard', 'active', '42 Sunrise Avenue, Indiranagar, Bengaluru')
  RETURNING id INTO v_biz_id;

  -- 2. Create sample batches
  INSERT INTO batches (business_id, name, fee_amount, fee_cycle, due_offset_days, schedule_time)
  VALUES (v_biz_id, 'Junior Ballet (Age 4-7)', 2500, 'monthly', 5, 'Tue, Thu 4:00 PM')
  RETURNING id INTO v_batch_dance;

  INSERT INTO batches (business_id, name, fee_amount, fee_cycle, due_offset_days, schedule_time)
  VALUES (v_biz_id, 'Kids Karate Yellow Belt', 3000, 'monthly', 5, 'Mon, Wed, Fri 5:00 PM')
  RETURNING id INTO v_batch_karate;

  INSERT INTO batches (business_id, name, fee_amount, fee_cycle, due_offset_days, schedule_time)
  VALUES (v_biz_id, 'Creative Art & Craft', 2000, 'monthly', 5, 'Sat, Sun 10:00 AM')
  RETURNING id INTO v_batch_art;

  -- 3. Create sample staff
  INSERT INTO staff (business_id, name, phone, email, role, assigned_batch_ids)
  VALUES 
    (v_biz_id, 'Priya Sharma', '9876500001', 'priya.instructor@example.com', 'instructor', ARRAY[v_batch_dance, v_batch_art]),
    (v_biz_id, 'Rahul Verma', '9876500002', 'rahul.sensei@example.com', 'instructor', ARRAY[v_batch_karate]);

  -- 4. Create sample members
  INSERT INTO members (business_id, batch_id, name, guardian_name, guardian_phone, join_date, status, access_token)
  VALUES (v_biz_id, v_batch_dance, 'Aarav Patel', 'Suresh Patel', '9876543201', current_date - interval '60 days', 'active', 'demo-token-aarav')
  RETURNING id INTO v_m1;

  INSERT INTO members (business_id, batch_id, name, guardian_name, guardian_phone, join_date, status, access_token)
  VALUES (v_biz_id, v_batch_dance, 'Diya Menon', 'Ananya Menon', '9876543202', current_date - interval '45 days', 'active', 'demo-token-diya')
  RETURNING id INTO v_m2;

  INSERT INTO members (business_id, batch_id, name, guardian_name, guardian_phone, join_date, status, access_token)
  VALUES (v_biz_id, v_batch_karate, 'Kabir Singh', 'Rohan Singh', '9876543203', current_date - interval '90 days', 'active', 'demo-token-kabir')
  RETURNING id INTO v_m3;

  INSERT INTO members (business_id, batch_id, name, guardian_name, guardian_phone, join_date, status, access_token)
  VALUES (v_biz_id, v_batch_karate, 'Ananya Iyer', 'Lakshmi Iyer', '9876543204', current_date - interval '30 days', 'active', 'demo-token-ananya')
  RETURNING id INTO v_m4;

  INSERT INTO members (business_id, batch_id, name, guardian_name, guardian_phone, join_date, status, access_token)
  VALUES (v_biz_id, v_batch_art, 'Vihaan Gupta', 'Neha Gupta', '9876543205', current_date - interval '15 days', 'active', 'demo-token-vihaan')
  RETURNING id INTO v_m5;

  -- 5. Insert sample attendance
  INSERT INTO attendance (member_id, batch_id, business_id, session_date, status)
  VALUES
    (v_m1, v_batch_dance, v_biz_id, current_date - 1, 'present'),
    (v_m1, v_batch_dance, v_biz_id, current_date - 3, 'present'),
    (v_m1, v_batch_dance, v_biz_id, current_date - 5, 'absent'),
    (v_m2, v_batch_dance, v_biz_id, current_date - 1, 'present'),
    (v_m2, v_batch_dance, v_biz_id, current_date - 3, 'present'),
    (v_m3, v_batch_karate, v_biz_id, current_date - 1, 'present'),
    (v_m3, v_batch_karate, v_biz_id, current_date - 2, 'present'),
    (v_m4, v_batch_karate, v_biz_id, current_date - 1, 'absent'),
    (v_m5, v_batch_art, v_biz_id, current_date - 2, 'present');

  -- 6. Insert sample fees
  INSERT INTO fees (member_id, business_id, cycle_start, due_date, amount, status, paid_date, payment_method, receipt_no)
  VALUES
    (v_m1, v_biz_id, date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '5 days')::date, 2500, 'paid', current_date - 2, 'upi', 'BM-202608-001'),
    (v_m2, v_biz_id, date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '5 days')::date, 2500, 'pending', null, null, null),
    (v_m3, v_biz_id, date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '5 days')::date, 3000, 'paid', current_date - 4, 'cash', 'BM-202608-002'),
    (v_m4, v_biz_id, (date_trunc('month', current_date) - interval '1 month')::date, (date_trunc('month', current_date) - interval '25 days')::date, 3000, 'overdue', null, null, null);

  RAISE NOTICE 'Seed data successfully inserted for business: Little Stars Academy (ID: %)', v_biz_id;
END $$;
