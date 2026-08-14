import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const businessId = id;

  const [{ data: business }, { data: batches }, { data: members }, { data: fees }, { data: attendance }] = await Promise.all([
    admin.from("businesses").select("*").eq("id", businessId).single(),
    admin.from("batches").select("*").eq("business_id", businessId),
    admin.from("members").select("*").eq("business_id", businessId).eq("status", "active"),
    admin.from("fees").select("status, amount").eq("business_id", businessId),
    admin.from("attendance").select("status, session_date").eq("business_id", businessId),
  ]);

  const totalFees = fees?.length ?? 0;
  const paidFees = fees?.filter((f) => f.status === "paid").length ?? 0;
  const overdueFees = fees?.filter((f) => f.status === "overdue") ?? [];

  const totalAttendance = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;

  return NextResponse.json({
    business,
    batchCount: batches?.length ?? 0,
    memberCount: members?.length ?? 0,
    feeCollectionPct: totalFees ? Math.round((paidFees / totalFees) * 100) : null,
    overdueCount: overdueFees.length,
    overdueAmount: overdueFees.reduce((sum, f) => sum + Number(f.amount), 0),
    attendancePct: totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : null,
    batches,
    members,
  });
}
