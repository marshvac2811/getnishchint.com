import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Returns businesses in the logged-in distributor's zone only. Read-only.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDistributor = user?.app_metadata?.distributor === true;
  const zone = user?.app_metadata?.zone as string | undefined;

  if (!isDistributor || !zone) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("id, name, vertical, status, plan_tier, contact_phone, zone, created_at")
    .eq("zone", zone)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ zone, businesses: data });
}
