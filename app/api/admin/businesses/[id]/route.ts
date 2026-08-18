import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

// Body: { status?: "active"|"suspended", plan_tier?: "basic"|"standard"|"premium", zone?: string }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const body = await req.json();
  const update: Record<string, string> = {};
  if (body.status) update.status = body.status;
  if (body.plan_tier) update.plan_tier = body.plan_tier;
  if (body.zone !== undefined) update.zone = body.zone;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// Deletes the business and everything under it (batches, members, attendance,
// fees, messages all cascade-delete via the foreign keys in schema.sql).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("businesses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
