import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Query: ?month=YYYY-MM (defaults to current month)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const monthParam = req.nextUrl.searchParams.get("month");
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: member } = await supabase.from("members").select("id, name").eq("id", id).single();
  const { data, error } = await supabase
    .from("attendance")
    .select("session_date, status")
    .eq("member_id", id)
    .gte("session_date", monthStart)
    .lte("session_date", monthEnd);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ member, year, month, records: data });
}
