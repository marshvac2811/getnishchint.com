import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

// Body: { business_id, amount, due_date, penalty_per_day? }
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const body = await req.json();
  const { business_id, amount, due_date, penalty_per_day } = body;
  if (!business_id || !amount || !due_date) {
    return NextResponse.json({ error: "business_id_amount_due_date_required" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_fees")
    .insert({ business_id, amount, due_date, penalty_per_day: penalty_per_day ?? 0 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// Query: ?business_id=...
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_fees")
    .select("*")
    .eq("business_id", businessId)
    .order("due_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // also flag anything past due as overdue while we're here
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueIds = (data ?? []).filter((f) => f.status === "pending" && f.due_date < todayStr).map((f) => f.id);
  if (overdueIds.length > 0) {
    await admin.from("platform_fees").update({ status: "overdue" }).in("id", overdueIds);
    for (const f of data ?? []) {
      if (overdueIds.includes(f.id)) f.status = "overdue";
    }
  }

  return NextResponse.json(data);
}
