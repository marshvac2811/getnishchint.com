import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, batch_id, name, guardian_name, guardian_phone } = body;

  if (!business_id || !name || !guardian_phone) {
    return NextResponse.json(
      { error: "business_id_name_guardian_phone_required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("members")
    .insert({ business_id, batch_id, name, guardian_name, guardian_phone })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const batchId = req.nextUrl.searchParams.get("batch_id");
  const businessId = req.nextUrl.searchParams.get("business_id");

  let query = supabase.from("members").select("*").eq("status", "active");
  if (batchId) query = query.eq("batch_id", batchId);
  if (businessId) query = query.eq("business_id", businessId);

  const { data, error } = await query.order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

