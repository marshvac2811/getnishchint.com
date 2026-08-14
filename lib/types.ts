export type Vertical = "play_school" | "gym" | "dance" | "tuition" | "other";
export type FeeCycle = "monthly" | "quarterly";
export type MemberStatus = "active" | "paused" | "left";
export type AttendanceStatus = "present" | "absent";
export type FeeStatus = "pending" | "paid" | "overdue";
export type Channel = "whatsapp" | "sms";

export interface Business {
  id: string;
  name: string;
  vertical: Vertical;
  owner_user_id: string;
  contact_phone: string | null;
  plan_tier: "basic" | "standard" | "premium";
  status: "active" | "suspended";
  created_at: string;
}

export interface Batch {
  id: string;
  business_id: string;
  name: string;
  fee_amount: number;
  fee_cycle: FeeCycle;
  due_offset_days: number;
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
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  member_id: string;
  batch_id: string;
  business_id: string;
  session_date: string;
  status: AttendanceStatus;
  marked_at: string;
}

export interface Fee {
  id: string;
  member_id: string;
  business_id: string;
  cycle_start: string;
  due_date: string;
  amount: number;
  status: FeeStatus;
  paid_date: string | null;
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
