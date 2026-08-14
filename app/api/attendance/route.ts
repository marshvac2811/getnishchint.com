import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Body: { business_id, batch_id, session_date, records: [{ member_id, status }] }
// One tap per member on the frontend batches into a single call on save.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, batch_id, session_date, records } = body;

  if (!business_id || !batch_id || !session_date || !Array.isArray(records)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const rows = records.map((r: { member_id: string; status: string }) => ({
    business_id,
    batch_id,
    session_date,
    member_id: r.member_id,
    status: r.status,
  }));

  // upsert so re-saving the same day updates instead of duplicating
  const { data, error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "member_id,session_date" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const batchId = req.nextUrl.searchParams.get("batch_id");
  const date = req.nextUrl.searchParams.get("date");
  if (!batchId || !date) {
    return NextResponse.json({ error: "batch_id_and_date_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("batch_id", batchId)
    .eq("session_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

