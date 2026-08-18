import { createAdminClient } from "@/lib/supabase/server";
import Image from "next/image";

function daysLate(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function tenureLabel(dateStr: string): string {
  const start = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default async function MemberPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { token } = await params;
  const { month: monthParam } = await searchParams;
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("members")
    .select("id, name, guardian_name, join_date, business_id, businesses(name, upi_id)")
    .eq("access_token", token)
    .single();

  if (!member) {
    return (
      <main className="max-w-md mx-auto px-6 pt-24 text-center">
        <p className="text-coral font-medium">This link isn't valid. Please ask for a new one.</p>
      </main>
    );
  }

  const businessInfo = (member as any).businesses;
  const businessName = businessInfo?.name ?? "";
  const upiId = businessInfo?.upi_id ?? "";

  const { data: attendance } = await admin
    .from("attendance")
    .select("session_date, status")
    .eq("member_id", member.id)
    .order("session_date", { ascending: false })
    .limit(30);

  const { data: fees } = await admin
    .from("fees")
    .select("id, due_date, amount, status, penalty_per_day")
    .eq("member_id", member.id)
    .order("due_date", { ascending: false })
    .limit(12);

  const totalSessions = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  const pendingFees = (fees ?? []).filter((f) => f.status !== "paid");

  function upiLink(amount: number) {
    const params = new URLSearchParams({
      pa: upiId,
      pn: businessName || "Fee payment",
      am: String(amount),
      cu: "INR",
      tn: `Fee for ${member!.name}`,
    });
    return `upi://pay?${params.toString()}`;
  }

  // --- Monthly calendar ---
  const now = new Date();
  const [calYear, calMonth] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const monthStart = `${calYear}-${String(calMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(calYear, calMonth, 0).getDate();
  const monthEnd = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: monthRecords } = await admin
    .from("attendance")
    .select("session_date, status")
    .eq("member_id", member.id)
    .gte("session_date", monthStart)
    .lte("session_date", monthEnd);

  const statusByDay: Record<number, string> = {};
  (monthRecords ?? []).forEach((r) => {
    const day = Number(r.session_date.split("-")[2]);
    statusByDay[day] = r.status;
  });

  const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();
  const monthPresentCount = (monthRecords ?? []).filter((r) => r.status === "present").length;
  const monthAbsentCount = (monthRecords ?? []).filter((r) => r.status === "absent").length;

  let prevMonth = calMonth - 1, prevYear = calYear;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  let nextMonth = calMonth + 1, nextYear = calYear;
  if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
  const prevStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const nextStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  return (
    <main className="max-w-lg mx-auto px-6 pt-10 pb-16">
      <Image src="/logo.png" alt="Nishchint" width={140} height={40} className="h-8 w-auto mb-6" priority />
      <p className="text-sm text-[#5C7A6C] mb-1">{businessName}</p>
      <h1 className="text-2xl font-bold mb-1">{member.name}</h1>
      {member.join_date && (
        <p className="text-sm text-[#5C7A6C] mb-6">Member for {tenureLabel(member.join_date)}</p>
      )}

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

      {/* Monthly calendar */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <a href={`?month=${prevStr}`} className="text-sm px-2 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium">&larr;</a>
          <p className="text-sm font-semibold">{MONTH_NAMES[calMonth - 1]} {calYear}</p>
          <a href={`?month=${nextStr}`} className="text-sm px-2 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium">&rarr;</a>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <p key={i} className="text-center text-[10px] text-[#5C7A6C] font-medium">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const status = statusByDay[day];
            const bg = status === "present" ? "bg-teal text-white" : status === "absent" ? "bg-coral/80 text-white" : "bg-[#F3F3F0] text-[#5C7A6C]";
            return (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${bg}`}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[#5C7A6C]">
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-teal mr-1"></span>Present ({monthPresentCount})</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-coral/80 mr-1"></span>Absent ({monthAbsentCount})</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm font-semibold mb-3">Fees</p>
        {pendingFees.length === 0 ? (
          <p className="text-sm text-[#5C7A6C]">No pending fees. All caught up.</p>
        ) : (
          <div className="space-y-3">
            {pendingFees.map((f) => {
              const late = f.status === "overdue" ? daysLate(f.due_date) : 0;
              const penalty = late * (f.penalty_per_day ?? 0);
              const total = f.amount + penalty;
              return (
                <div key={f.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm font-medium">Rs. {f.amount}</p>
                      <p className="text-xs text-[#5C7A6C]">Due {new Date(f.due_date).toLocaleDateString()}</p>
                      {penalty > 0 && (
                        <p className="text-xs text-coral">
                          {late} day{late === 1 ? "" : "s"} late - penalty Rs.{penalty} - total due Rs.{total}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${f.status === "overdue" ? "bg-coral/10 text-coral" : "bg-[#EEF4EC] text-teal"}`}>
                      {f.status}
                    </span>
                  </div>
                  {upiId ? (
                    <a
                      href={upiLink(total)}
                      className="block text-center bg-teal text-white rounded-lg py-2 text-sm font-medium"
                    >
                      Pay Now {penalty > 0 ? `(Rs.${total})` : ""}
                    </a>
                  ) : (
                    <p className="text-xs text-[#5C7A6C]">Contact {businessName} to pay this fee.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
