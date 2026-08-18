import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

// Body: { email, zone, name }
// Invites (or reuses) a Supabase user and tags them as a distributor scoped to one zone.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }
  const body = await req.json();
  const { email, zone, name } = body;
  if (!email || !zone) {
    return NextResponse.json({ error: "email_and_zone_required" }, { status: 400 });
  }

  const admin = createAdminClient();

  let userId: string | null = null;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);

  if (inviteData?.user) {
    userId = inviteData.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) userId = existing.id;
  }

  if (!userId) {
    return NextResponse.json({ error: inviteError?.message ?? "could_not_create_or_find_user" }, { status: 400 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { distributor: true, zone, distributor_name: name ?? "" },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId, zone });
}
