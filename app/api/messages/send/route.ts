import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, templates } from "@/lib/messaging";

// Body: { business_id, batch_id (optional - omit to send to whole business), message_text }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { business_id, batch_id, message_text } = body;
  if (!business_id || !message_text) {
    return NextResponse.json({ error: "business_id_and_message_text_required" }, { status: 400 });
  }
  let query = supabase.from("members").select("guardian_phone").eq("business_id", business_id).eq("status", "active");
  if (batch_id) query = query.eq("batch_id", batch_id);
  const { data: members, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const t = templates.broadcast(message_text);
  let sent = 0;
  for (const m of members ?? []) {
    const result = await sendWhatsAppMessage(m.guardian_phone, t.templateName, t.params);
    if (result.success) sent++;
  }
  await supabase.from("messages").insert({
    business_id,
    batch_id: batch_id ?? null,
    message_text,
    channel: "whatsapp",
  });
  return NextResponse.json({ recipients: members?.length ?? 0, sent });
}

// Query: ?business_id=... - returns the 20 most recent broadcasts for this business
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const businessId = req.nextUrl.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ error: "business_id_required" }, { status: 400 });
  const { data, error } = await supabase
    .from("messages")
    .select("id, message_text, batch_id, sent_at")
    .eq("business_id", businessId)
    .order("sent_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
