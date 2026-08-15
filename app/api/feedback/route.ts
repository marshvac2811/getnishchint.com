import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Body: { business_id, message }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, message } = body;
  if (!business_id || !message) {
    return NextResponse.json({ error: "business_id_message_required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("feedback")
    .insert({ business_id, message })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
