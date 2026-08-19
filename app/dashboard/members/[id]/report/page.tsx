"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface AttendanceRecord { session_date: string; status: string; }
interface ReportData {
  member: { id: string; name: string } | null;
  year: number;
  month: number;
  records: AttendanceRecord[];
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MemberReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const monthParam = searchParams.get("month");

  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    const url = monthParam
      ? `/api/members/${memberId}/attendance?month=${monthParam}`
      : `/api/members/${memberId}/attendance`;
    fetch(url).then((r) => r.json()).then(setData);
  }, [memberId, monthParam]);

  if (!data) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
        <p className="text-sm text-[#5C7A6C]">Loading...</p>
      </main>
    );
  }

  const { year, month, records, member } = data;
  const statusByDay: Record<number, string> = {};
  records.forEach((r) => {
    const day = Number(r.session_date.split("-")[2]);
    statusByDay[day] = r.status;
  });

  const lastDay = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  let prevMonth = month - 1, prevYear = year;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  let nextMonth = month + 1, nextYear = year;
  if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
  const prevStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const nextStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <button onClick={() => router.back()} className="text-sm text-teal font-medium mb-4">&larr; Back</button>
      <h1 className="text-2xl font-bold mb-1">{member?.name ?? "Member"}</h1>
      <p className="text-sm text-[#5C7A6C] mb-6">Monthly attendance report</p>

      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push(`?month=${prevStr}`)} className="text-sm px-2 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium">&larr;</button>
          <p className="text-sm font-semibold">{MONTH_NAMES[month - 1]} {year}</p>
          <button onClick={() => router.push(`?month=${nextStr}`)} className="text-sm px-2 py-1 rounded-lg bg-[#EEF4EC] text-teal font-medium">&rarr;</button>
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
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-teal mr-1"></span>Present ({presentCount})</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-coral/80 mr-1"></span>Absent ({absentCount})</span>
        </div>
      </div>
    </main>
  );
}
