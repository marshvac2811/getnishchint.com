export type Vertical = "play_school" | "gym" | "dance" | "tuition" | "other";
export type FeeCycle = "monthly" | "quarterly";
export type MemberStatus = "active" | "paused" | "left";
export type AttendanceStatus = "present" | "absent";
export type FeeStatus = "pending" | "paid" | "overdue";
export type Channel = "whatsapp" | "sms";
export type StaffRole = "instructor" | "manager";

export interface Business {
  id: string;
  name: string;
  vertical: Vertical;
  owner_user_id: string;
  contact_phone: string | null;
  upi_id?: string | null;
  address?: string | null;
  plan_tier: "basic" | "standard" | "premium";
  status: "active" | "suspended";
  distributor_id?: string | null;
  trial_end?: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  business_id: string;
  user_id?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  role: StaffRole;
  assigned_batch_ids: string[];
  status: "active" | "inactive";
  created_at: string;
}

export interface Batch {
  id: string;
  business_id: string;
  name: string;
  fee_amount: number;
  fee_cycle: FeeCycle;
  due_offset_days: number;
  schedule_time?: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  business_id: string;
  batch_id: string | null;
  name: string;
  guardian_name: string | null;
  guardian_phone: string;
  join_date: string;
  status: MemberStatus;
  access_token?: string;
  notes?: string | null;
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  member_id: string;
  batch_id: string;
  business_id: string;
  session_date: string;
  status: AttendanceStatus;
  marked_by?: string | null;
  marked_at: string;
}

export interface Fee {
  id: string;
  member_id: string;
  business_id: string;
  cycle_start: string;
  due_date: string;
  amount: number;
  penalty_per_day?: number;
  status: FeeStatus;
  paid_date: string | null;
  payment_method?: string | null;
  receipt_no?: string | null;
  payment_link: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  business_id: string;
  batch_id: string | null;
  message_text: string;
  channel: Channel;
  sent_at: string;
}

export interface Feedback {
  id: string;
  business_id: string;
  message: string;
  rating: number;
  created_at: string;
}

export interface PlatformFee {
  id: string;
  business_id: string;
  amount: number;
  status: FeeStatus;
  due_date: string;
  paid_date: string | null;
  created_at: string;
}

export interface Distributor {
  id: string;
  name: string;
  phone: string;
  email: string;
  zone: string;
  auth_user_id?: string | null;
  created_at: string;
}
