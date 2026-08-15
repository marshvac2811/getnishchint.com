import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const TRIAL_DAYS = 14;

// Public endpoint - anyone can start a trial. Body: { name, vertical, contact_phone, email }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, vertical, contact_phone, email } = body;
  if (!name || !vertical || !email) {
    return NextResponse.json({ error: "name_vertical_email_required" }, { status: 400 });
  }

  const admin = createAdminClient();

  let ownerId: string | null = null;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);

  if (inviteData?.user) {
    ownerId = inviteData.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) ownerId = existing.id;
  }

  if (!ownerId) {
    return NextResponse.json({ error: inviteError?.message ?? "could_not_create_or_find_user" }, { status: 400 });
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: business, error: bizError } = await admin
    .from("businesses")
    .insert({
      name,
      vertical,
      contact_phone,
      owner_user_id: ownerId,
      is_trial: true,
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();

  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 400 });
  return NextResponse.json(business);
}
