"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBusiness } from "@/lib/context/business";
import Link from "next/link";

interface ReportData {
  year: number;
  month: number;
  attendance: { totalSessions: number; presentCount: number; attendancePct: number | null };
  fees: {
    billedTotal: number;
    collectedTotal: number;
    pendingCount: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  newMembersCount: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function ReportsContent() {
  const { business } = useBusiness();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setLoading(true);
    const url = monthParam
      ? `/api/reports/business?business_id=${business.id}&month=${monthParam}`
      : `/api/reports/business?business_id=${business.id}`;
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [business, monthParam]);

  function exportCSV() {
    if (!data || !business) return;
    const { year, month, attendance, fees, newMembersCount } = data;
    const monthName = MONTH_NAMES[month - 1];

    const rows = [
      ["BatchMate Monthly Summary Report"],
      ["Academy", business.name],
      ["Period", `${monthName} ${year}`],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["Metric", "Value"],
      ["Total Recorded Sessions", attendance.totalSessions],
      ["Present Marks", attendance.presentCount],
      ["Attendance Rate", attendance.attendancePct !== null ? `${attendance.attendancePct}%` : "N/A"],
      ["Total Billed Fees (INR)", fees.billedTotal],
      ["Total Collected Fees (INR)", fees.collectedTotal],
      ["Pending Fees Count", fees.pendingCount],
      ["Pending Amount (INR)", fees.pendingAmount],
      ["Overdue Invoices Count", fees.overdueCount],
      ["Overdue Amount (INR)", fees.overdueAmount],
      ["New Members Joined", newMembersCount],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${business.name.replace(/\s+/g, "_")}_${monthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading || !data) {
    return (
      <main className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-20">
        <h1 className="text-2xl font-bold mb-4">Monthly Reports</h1>
        <div className="bg-white rounded-2xl p-6 border border-[#E2ECE5] text-center">
          <p className="text-sm text-[#5C7A6C]">Loading report data...</p>
        </div>
      </main>
    );
  }

  const { year, month, attendance, fees, newMembersCount } = data;
  let prevMonth = month - 1, prevYear = year;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  let nextMonth = month + 1, nextYear = year;
  if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
  const prevStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const nextStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

  const collectionRate = fees.billedTotal > 0 ? Math.round((fees.collectedTotal / fees.billedTotal) * 100) : 0;

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Monthly Reports</h1>
          <p className="text-xs text-[#5C7A6C]">Financial & Attendance performance</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF4EC] text-teal rounded-xl text-xs font-bold hover:bg-[#E2ECE5] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Month Navigator */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.push(`?month=${prevStr}`)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[#EEF4EC] text-teal font-bold hover:bg-[#E2ECE5] transition-colors"
        >
          &larr; Prev
        </button>
        <p className="text-base font-extrabold text-gray-900">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button
          onClick={() => router.push(`?month=${nextStr}`)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[#EEF4EC] text-teal font-bold hover:bg-[#E2ECE5] transition-colors"
        >
          Next &rarr;
        </button>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-4 shadow-sm">
        <p className="text-xs font-bold text-[#5C7A6C] uppercase tracking-wider mb-2">Monthly Attendance</p>
        {attendance.attendancePct === null ? (
          <p className="text-sm text-[#5C7A6C]">No sessions recorded for {MONTH_NAMES[month - 1]}.</p>
        ) : (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-extrabold text-teal">{attendance.attendancePct}%</span>
              <span className="text-xs text-[#5C7A6C]">
                {attendance.presentCount} present of {attendance.totalSessions} total markings
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#EEF4EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-500"
                style={{ width: `${attendance.attendancePct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fee & Revenue Breakdown */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#5C7A6C] uppercase tracking-wider">Fee Collection</p>
          <span className="text-xs font-bold text-teal">{collectionRate}% collected</span>
        </div>

        <div className="w-full h-2.5 bg-[#EEF4EC] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#EEF4EC]">
            <p className="text-[11px] font-semibold text-[#5C7A6C]">Total Billed</p>
            <p className="text-lg font-bold text-gray-900">₹{fees.billedTotal}</p>
          </div>
          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#EEF4EC]">
            <p className="text-[11px] font-semibold text-[#5C7A6C]">Total Collected</p>
            <p className="text-lg font-bold text-teal">₹{fees.collectedTotal}</p>
          </div>
          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#EEF4EC]">
            <p className="text-[11px] font-semibold text-[#5C7A6C]">Pending Invoices</p>
            <p className="text-lg font-bold text-amber-600">
              ₹{fees.pendingAmount} <span className="text-xs font-normal text-gray-600">({fees.pendingCount})</span>
            </p>
          </div>
          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#EEF4EC]">
            <p className="text-[11px] font-semibold text-[#5C7A6C]">Overdue</p>
            <p className="text-lg font-bold text-coral">
              ₹{fees.overdueAmount} <span className="text-xs font-normal text-gray-600">({fees.overdueCount})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Member Growth */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#5C7A6C] uppercase tracking-wider">New Student Admissions</p>
          <p className="text-2xl font-extrabold text-teal mt-0.5">{newMembersCount}</p>
          <p className="text-xs text-[#5C7A6C]">Enrolled in {MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <Link
          href="/dashboard/members"
          className="px-3.5 py-2 bg-[#EEF4EC] text-teal rounded-xl text-xs font-bold hover:bg-[#E2ECE5] transition-colors"
        >
          View Members &rarr;
        </Link>
      </div>
    </main>
  );
}

export default function ClientReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-[#5C7A6C]">Loading...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
