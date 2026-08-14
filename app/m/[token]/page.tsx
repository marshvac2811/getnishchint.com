import { createAdminClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function MemberPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("members")
    .select("id, name, guardian_name, business_id, businesses(name)")
    .eq("access_token", token)
    .single();

  if (!member) {
    return (
      <main className="max-w-md mx-auto px-6 pt-24 text-center">
        <p className="text-coral font-medium">This link isn't valid. Please ask for a new one.</p>
      </main>
    );
  }

  const businessName = (member as any).businesses?.name ?? "";

  const { data: attendance } = await admin
    .from("attendance")
    .select("session_date, status")
    .eq("member_id", member.id)
    .order("session_date", { ascending: false })
    .limit(30);

  const { data: fees } = await admin
    .from("fees")
    .select("id, due_date, amount, status")
    .eq("member_id", member.id)
    .order("due_date", { ascending: false })
    .limit(12);

  const totalSessions = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  const pendingFees = (fees ?? []).filter((f) => f.status !== "paid");

  return (
    <main className="max-w-lg mx-auto px-6 pt-10 pb-16">
      <Image src="/logo.png" alt="Nishchint" width={140} height={40} className="h-8 w-auto mb-6" priority />
      <p className="text-sm text-[#5C7A6C] mb-1">{businessName}</p>
      <h1 className="text-2xl font-bold mb-6">{member.name}</h1>

      <div className="bg-white rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold mb-2">Attendance</p>
        {attendancePct === null ? (
          <p className="text-sm text-[#5C7A6C]">No attendance recorded yet.</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-teal">{attendancePct}%</p>
            <p className="text-xs text-[#5C7A6C]">Present {presentCount} of last {totalSessions} sessions</p>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm font-semibold mb-3">Fees</p>
        {pendingFees.length === 0 ? (
          <p className="text-sm text-[#5C7A6C]">No pending fees. All caught up.</p>
        ) : (
          <div className="space-y-2">
            {pendingFees.map((f) => (
              <div key={f.id} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="text-sm font-medium">Rs. {f.amount}</p>
                  <p className="text-xs text-[#5C7A6C]">Due {new Date(f.due_date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${f.status === "overdue" ? "bg-coral/10 text-coral" : "bg-[#EEF4EC] text-teal"}`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
