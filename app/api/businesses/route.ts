import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log("AUTH CHECK -> user:", user?.id, "error:", userError?.message);

  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json();
  const { name, vertical, contact_phone } = body;
  console.log("BODY RECEIVED ->", body);

  if (!name || !vertical) {
    return NextResponse.json({ error: "name_and_vertical_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({ name, vertical, contact_phone, owner_user_id: user.id })
    .select()
    .single();

  if (error) {
    console.log("SUPABASE INSERT ERROR ->", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
