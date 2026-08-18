import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isDistributor = user?.app_metadata?.distributor === true;

  if (isDistributor) {
    return NextResponse.redirect(new URL("/distributor", req.url));
  }

  return NextResponse.redirect(new URL("/onboarding", req.url));
}
