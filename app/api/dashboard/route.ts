import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [{ data: attendance }, { data: fees }] = await Promise.all([
    supabase
      .from("attendance")
      .select("status")
      .eq("business_id", businessId)
      .gte("session_date", sevenDaysAgoStr),
    supabase.from("fees").select("status, amount").eq("business_id", businessId),
  ]);

  const totalAttendance = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : null;

  const totalFees = fees?.length ?? 0;
  const paidCount = fees?.filter((f) => f.status === "paid").length ?? 0;
  const overdue = fees?.filter((f) => f.status === "overdue") ?? [];
  const collectionPct = totalFees ? Math.round((paidCount / totalFees) * 100) : null;

  return NextResponse.json({
    attendancePct7d: attendancePct,
    feeCollectionPct: collectionPct,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, f) => sum + Number(f.amount), 0),
  });
}

