import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Runs daily via Vercel Cron. Suspends any business whose trial has ended.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("businesses")
    .update({ status: "suspended" })
    .eq("is_trial", true)
    .eq("status", "active")
    .lt("trial_ends_at", nowIso)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ suspended_count: data?.length ?? 0 });
}
