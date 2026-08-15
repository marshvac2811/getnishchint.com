import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [{ data: business }, { data: attendance }, { data: fees }, { data: batches }, { data: members }] = await Promise.all([
    supabase.from("businesses").select("created_at").eq("id", businessId).single(),
    supabase.from("attendance").select("status").eq("business_id", businessId).gte("session_date", sevenDaysAgoStr),
    supabase.from("fees").select("status, amount").eq("business_id", businessId),
    supabase.from("batches").select("id, name").eq("business_id", businessId),
    supabase.from("members").select("id, batch_id").eq("business_id", businessId).eq("status", "active"),
  ]);

  const totalAttendance = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : null;

  const totalFees = fees?.length ?? 0;
  const paidCount = fees?.filter((f) => f.status === "paid").length ?? 0;
  const pendingCount = fees?.filter((f) => f.status === "pending").length ?? 0;
  const overdue = fees?.filter((f) => f.status === "overdue") ?? [];
  const collectionPct = totalFees ? Math.round((paidCount / totalFees) * 100) : null;

  const batchStats = (batches ?? []).map((b) => ({
    name: b.name,
    memberCount: (members ?? []).filter((m) => m.batch_id === b.id).length,
  }));

  return NextResponse.json({
    memberSince: business?.created_at ?? null,
    totalBatches: batches?.length ?? 0,
    totalMembers: members?.length ?? 0,
    batches: batchStats,
    attendancePct7d: attendancePct,
    feeCollectionPct: collectionPct,
    paidCount,
    pendingCount,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, f) => sum + Number(f.amount), 0),
  });
}
