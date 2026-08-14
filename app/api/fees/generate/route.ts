import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, templates } from "@/lib/messaging";
import { createPaymentLink } from "@/lib/payments";

// Call this once a day from a scheduled job. It does two jobs:
//   1. Creates new fee rows for members whose cycle has renewed, due on
//      the batch's fixed due_day_of_month
//   2. Sends WhatsApp reminders for fees due in 2 days, and flags overdue ones
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ── 1. Generate fee rows for members without a fee this cycle ──
  const { data: members } = await supabase
    .from("members")
    .select("id, business_id, batch_id, guardian_phone, batches(fee_amount, fee_cycle, due_day_of_month, penalty_per_day)")
    .eq("status", "active");

  let created = 0;
  for (const m of members ?? []) {
    const batch = (m as any).batches;
    if (!batch) continue;
    const cycleStart = todayStr;

    // due date = this month's fixed due day; if that day already passed, use next month
    const dueDay = batch.due_day_of_month ?? 5;
    let due = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (due < today) {
      due = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }

    const { data: existing } = await supabase
      .from("fees")
      .select("id")
      .eq("member_id", m.id)
      .eq("cycle_start", cycleStart)
      .maybeSingle();
    if (existing) continue;

    const { data: fee } = await supabase
      .from("fees")
      .insert({
        member_id: m.id,
        business_id: m.business_id,
        cycle_start: cycleStart,
        due_date: due.toISOString().slice(0, 10),
        amount: batch.fee_amount,
        status: "pending",
        penalty_per_day: batch.penalty_per_day ?? 0,
      })
      .select()
      .single();

    if (fee) {
      const link = await createPaymentLink(batch.fee_amount, m.id, fee.id);
      if (link) {
        await supabase.from("fees").update({ payment_link: link }).eq("id", fee.id);
      }
      created++;
    }
  }

  // ── 2. Send reminders for fees due in 2 days, and mark overdue ones ──
  const reminderDate = new Date(today);
  reminderDate.setDate(reminderDate.getDate() + 2);
  const reminderDateStr = reminderDate.toISOString().slice(0, 10);
  const { data: dueSoon } = await supabase
    .from("fees")
    .select("*, members(name, guardian_phone)")
    .eq("status", "pending")
    .eq("due_date", reminderDateStr)
    .is("reminder_sent_at", null);

  let remindersSent = 0;
  for (const fee of dueSoon ?? []) {
    const member = (fee as any).members;
    if (!member) continue;
    const t = templates.feeReminder(member.name, fee.amount, fee.due_date, fee.payment_link);
    const result = await sendWhatsAppMessage(member.guardian_phone, t.templateName, t.params);
    if (result.success) {
      await supabase.from("fees").update({ reminder_sent_at: new Date().toISOString() }).eq("id", fee.id);
      remindersSent++;
    }
  }

  // mark anything past due_date as overdue
  await supabase
    .from("fees")
    .update({ status: "overdue" })
    .eq("status", "pending")
    .lt("due_date", todayStr);

  return NextResponse.json({ feesCreated: created, remindersSent });
}
