import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [{ data: business }, { data: attendance }, { data: fees }, { data: batches }, { data: members }] = await Promise.all([
    supabase.from("businesses").select("name, created_at").eq("id", businessId).single(),
    supabase.from("attendance").select("session_date, status").eq("business_id", businessId).gte("session_date", sevenDaysAgoStr),
    supabase.from("fees").select("status, amount").eq("business_id", businessId),
    supabase.from("batches").select("id, name").eq("business_id", businessId),
    supabase.from("members").select("id, batch_id").eq("business_id", businessId).eq("status", "active"),
  ]);

  const totalAttendance = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : null;

  // Daily trend calculation for the last 7 days
  const dailyAttendance: { date: string; dayLabel: string; present: number; absent: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dayRecords = (attendance ?? []).filter((a) => a.session_date === dateStr);
    const p = dayRecords.filter((a) => a.status === "present").length;
    const ab = dayRecords.filter((a) => a.status === "absent").length;
    dailyAttendance.push({ date: dateStr, dayLabel, present: p, absent: ab });
  }

  const totalFees = fees?.length ?? 0;
  const paidFees = (fees ?? []).filter((f) => f.status === "paid");
  const pendingFees = (fees ?? []).filter((f) => f.status === "pending");
  const overdueFees = (fees ?? []).filter((f) => f.status === "overdue");

  const paidAmount = paidFees.reduce((sum, f) => sum + Number(f.amount), 0);
  const pendingAmount = pendingFees.reduce((sum, f) => sum + Number(f.amount), 0);
  const overdueAmount = overdueFees.reduce((sum, f) => sum + Number(f.amount), 0);
  const collectionPct = totalFees ? Math.round((paidFees.length / totalFees) * 100) : null;

  const batchStats = (batches ?? []).map((b) => ({
    name: b.name,
    memberCount: (members ?? []).filter((m) => m.batch_id === b.id).length,
  }));

  return NextResponse.json({
    businessName: business?.name ?? "",
    memberSince: business?.created_at ?? null,
    totalBatches: batches?.length ?? 0,
    totalMembers: members?.length ?? 0,
    batches: batchStats,
    attendancePct7d: attendancePct,
    dailyAttendance,
    feeCollectionPct: collectionPct,
    paidCount: paidFees.length,
    paidAmount,
    pendingCount: pendingFees.length,
    pendingAmount,
    overdueCount: overdueFees.length,
    overdueAmount,
  });
}
