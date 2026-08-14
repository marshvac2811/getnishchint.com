import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, name, fee_amount, fee_cycle, due_offset_days } = body;

  if (!business_id || !name || !fee_amount) {
    return NextResponse.json({ error: "business_id_name_fee_amount_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({
      business_id,
      name,
      fee_amount,
      fee_cycle: fee_cycle ?? "monthly",
      due_offset_days: due_offset_days ?? 5,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });

  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

