import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, templates } from "@/lib/messaging";
import { createPaymentLink } from "@/lib/payments";

// Call this once a day from a scheduled job (Vercel Cron, or any cron
// service hitting this URL with the CRON_SECRET header). It does two jobs:
//   1. Creates new fee rows for members whose cycle has renewed
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
    .select("id, business_id, batch_id, guardian_phone, batches(fee_amount, fee_cycle, due_offset_days)")
    .eq("status", "active");

  let created = 0;
  for (const m of members ?? []) {
    const batch = (m as any).batches;
    if (!batch) continue;

    const cycleStart = todayStr; // simple model: cycle starts the day it's generated
    const due = new Date(today);
    due.setDate(due.getDate() + (batch.due_offset_days ?? 5));

    // skip if a fee already exists for this member starting this cycle
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

