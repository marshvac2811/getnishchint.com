import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Query: ?business_id=...&month=YYYY-MM (defaults to current month)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  const monthParam = req.nextUrl.searchParams.get("month");
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [{ data: attendance }, { data: feesDue }, { data: feesPaid }, { data: newMembers }] = await Promise.all([
    supabase.from("attendance").select("status").eq("business_id", businessId).gte("session_date", monthStart).lte("session_date", monthEnd),
    supabase.from("fees").select("status, amount").eq("business_id", businessId).gte("due_date", monthStart).lte("due_date", monthEnd),
    supabase.from("fees").select("amount").eq("business_id", businessId).eq("status", "paid").gte("paid_date", monthStart).lte("paid_date", monthEnd),
    supabase.from("members").select("id").eq("business_id", businessId).gte("join_date", monthStart).lte("join_date", monthEnd),
  ]);

  const totalSessions = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalSessions ? Math.round((presentCount / totalSessions) * 100) : null;

  const billedTotal = (feesDue ?? []).reduce((s, f) => s + Number(f.amount), 0);
  const pendingFees = (feesDue ?? []).filter((f) => f.status === "pending");
  const overdueFees = (feesDue ?? []).filter((f) => f.status === "overdue");
  const collectedTotal = (feesPaid ?? []).reduce((s, f) => s + Number(f.amount), 0);

  return NextResponse.json({
    year, month,
    attendance: { totalSessions, presentCount, attendancePct },
    fees: {
      billedTotal,
      collectedTotal,
      pendingCount: pendingFees.length,
      pendingAmount: pendingFees.reduce((s, f) => s + Number(f.amount), 0),
      overdueCount: overdueFees.length,
      overdueAmount: overdueFees.reduce((s, f) => s + Number(f.amount), 0),
    },
    newMembersCount: newMembers?.length ?? 0,
  });
}
