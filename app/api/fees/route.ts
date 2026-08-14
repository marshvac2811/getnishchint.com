import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  const status = req.nextUrl.searchParams.get("status"); // optional filter
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  let query = supabase
    .from("fees")
    .select("*, members(name, guardian_name, guardian_phone)")
    .eq("business_id", businessId)
    .order("due_date", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

