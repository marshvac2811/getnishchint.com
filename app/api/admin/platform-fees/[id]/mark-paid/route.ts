import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_fees")
    .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
