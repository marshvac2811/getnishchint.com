import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, name, fee_amount, fee_cycle, due_day_of_month, penalty_per_day } = body;
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
      due_day_of_month: due_day_of_month ?? 5,
      penalty_per_day: penalty_per_day ?? 0,
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
