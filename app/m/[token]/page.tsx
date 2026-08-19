import { createAdminClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
    .select("id, name, guardian_name, guardian_phone, join_date, business_id, batch_id, businesses(name, upi_id, contact_phone, address), batches(name)")
    .eq("access_token", token)
    .single();

  if (!member) {
    return (
      <main className="min-h-screen bg-[#F8FAF8] flex items-center justify-center px-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <p className="text-coral font-semibold text-lg mb-2">Invalid or Expired Link</p>
          <p className="text-sm text-[#5C7A6C]">This student portal link is not valid. Please ask the academy for a new link.</p>
        </div>
      </main>
    );
  }

  const businessInfo = (member as any).businesses;
  const batchInfo = (member as any).batches;
  const businessName = businessInfo?.name ?? "Academy";
  const upiId = businessInfo?.upi_id ?? "";
  const contactPhone = businessInfo?.contact_phone ?? "";

  const { data: attendance } = await admin
    .from("attendance")
    .select("session_date, status")
    .eq("member_id", member.id)
    .order("session_date", { ascending: false })
    .limit(30);

  const { data: fees } = await admin
    .from("fees")
    .select("id, cycle_start, due_date, amount, status, penalty_per_day, paid_date, receipt_no")
    .eq("member_id", member.id)
    .order("due_date", { ascending: false })
    .limit(12);

  const totalSessions = attendance?.length ?? 0;
  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  const pendingFees = (fees ?? []).filter((f) => f.status !== "paid");
  const paidFees = (fees ?? []).filter((f) => f.status === "paid");

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

  function qrCodeUrl(amount: number) {
    const link = upiLink(amount);
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
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
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-6 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-[#EEF4EC] text-teal text-xs font-bold rounded-full">
            STUDENT PORTAL
          </span>
          {contactPhone && (
            <a
              href={`https://wa.me/91${contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${businessName}, I am contacting regarding ${member.name}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#128C7E] rounded-lg text-xs font-medium hover:bg-[#25D366]/20 transition-colors"
            >
              <span>💬 Message Academy</span>
            </a>
          )}
        </div>

        <p className="text-xs font-semibold text-[#5C7A6C] uppercase tracking-wider">{businessName}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{member.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C7A6C] mt-2">
          {batchInfo?.name && (
            <span className="bg-[#F3F6F4] px-2 py-0.5 rounded text-teal font-medium">
              Batch: {batchInfo.name}
            </span>
          )}
          {member.join_date && (
            <span>Member for {tenureLabel(member.join_date)}</span>
          )}
        </div>
      </div>

      {/* Attendance Stats Card */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-3">Overall Attendance</p>
        {attendancePct === null ? (
          <p className="text-sm text-[#5C7A6C]">No attendance sessions recorded yet.</p>
        ) : (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-3xl font-extrabold text-teal">{attendancePct}%</span>
              <span className="text-xs text-[#5C7A6C]">
                {presentCount} Present / {totalSessions} Recorded Sessions
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-[#EEF4EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-500"
                style={{ width: `${attendancePct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Monthly Attendance Calendar */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href={`?month=${prevStr}`} className="text-sm px-2.5 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium hover:bg-[#E2ECE5]">
            &larr;
          </Link>
          <p className="text-sm font-bold text-gray-900">{MONTH_NAMES[calMonth - 1]} {calYear}</p>
          <Link href={`?month=${nextStr}`} className="text-sm px-2.5 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium hover:bg-[#E2ECE5]">
            &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <p key={i} className="text-center text-[11px] text-[#5C7A6C] font-semibold">{d}</p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const status = statusByDay[day];
            const bg = status === "present"
              ? "bg-teal text-white shadow-xs"
              : status === "absent"
              ? "bg-coral/90 text-white"
              : "bg-[#F4F6F4] text-[#5C7A6C]";
            return (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${bg}`}>
                {day}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 pt-3 border-t border-[#EEF4EC] text-xs text-[#5C7A6C]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal"></span>
            Present ({monthPresentCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/90"></span>
            Absent ({monthAbsentCount})
          </span>
        </div>
      </div>

      {/* Due / Pending Fees & UPI Payment */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-3">Pending Fees</p>
        {pendingFees.length === 0 ? (
          <div className="text-center py-4 bg-[#EEF4EC]/50 rounded-xl">
            <p className="text-teal font-medium text-sm">🎉 All caught up! No pending dues.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingFees.map((f) => {
              const late = f.status === "overdue" ? daysLate(f.due_date) : 0;
              const penalty = late * (f.penalty_per_day ?? 0);
              const total = Number(f.amount) + penalty;
              return (
                <div key={f.id} className="border border-[#E2ECE5] rounded-xl p-4 bg-[#FAFCFA]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-base font-bold text-gray-900">₹{f.amount}</p>
                      <p className="text-xs text-[#5C7A6C]">Due: {new Date(f.due_date).toLocaleDateString("en-IN")}</p>
                      {penalty > 0 && (
                        <p className="text-xs text-coral font-medium mt-0.5">
                          {late} day{late === 1 ? "" : "s"} late • ₹{penalty} late fee
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      f.status === "overdue" ? "bg-coral/10 text-coral border border-coral/20" : "bg-amber-100 text-amber-800"
                    }`}>
                      {f.status}
                    </span>
                  </div>

                  {upiId ? (
                    <div className="mt-3 space-y-2">
                      <a
                        href={upiLink(total)}
                        className="w-full block text-center bg-teal hover:bg-teal/90 text-white rounded-xl py-2.5 text-sm font-bold shadow-sm transition-all"
                      >
                        ⚡ Pay ₹{total} via UPI (GPay / PhonePe / Paytm)
                      </a>
                      
                      <div className="text-center pt-2">
                        <details className="cursor-pointer text-xs text-[#5C7A6C]">
                          <summary className="hover:text-teal font-medium">Show QR Code to Scan</summary>
                          <div className="mt-3 flex flex-col items-center p-3 bg-white border border-[#E2ECE5] rounded-xl">
                            <img src={qrCodeUrl(total)} alt="UPI QR Code" className="w-36 h-36 rounded-lg mb-1" />
                            <p className="text-[11px] text-[#5C7A6C]">Scan with any UPI App • UPI: {upiId}</p>
                          </div>
                        </details>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#5C7A6C] bg-white p-2.5 rounded-lg border border-[#E2ECE5]">
                      Please contact {businessName} directly to clear this payment.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fee History & Download Receipts */}
      {paidFees.length > 0 && (
        <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-3">Paid Fee Receipts</p>
          <div className="divide-y divide-[#E2ECE5]">
            {paidFees.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-gray-900">₹{f.amount}</p>
                  <p className="text-xs text-[#5C7A6C]">
                    Paid on {f.paid_date ? new Date(f.paid_date).toLocaleDateString("en-IN") : "Recorded"}
                  </p>
                </div>
                <Link
                  href={`/receipt/${f.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF4EC] text-teal hover:bg-[#E2ECE5] rounded-lg text-xs font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Receipt
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
