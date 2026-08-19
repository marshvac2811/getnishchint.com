"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/context/business";

interface BatchStat { name: string; memberCount: number; }
interface DailyAtt { date: string; dayLabel: string; present: number; absent: number; }
interface Stats {
  businessName: string;
  memberSince: string | null;
  totalBatches: number;
  totalMembers: number;
  batches: BatchStat[];
  attendancePct7d: number | null;
  dailyAttendance: DailyAtt[];
  feeCollectionPct: number | null;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

function tenureLabel(dateStr: string | null): string {
  if (!dateStr) return "-";
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

export default function DashboardPage() {
  const { business } = useBusiness();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setLoading(true);
    fetch(`/api/dashboard?business_id=${business.id}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [business]);

  const maxAtt = Math.max(...(stats?.dailyAttendance?.map((d) => d.present + d.absent) || [1]), 5);

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          {stats?.memberSince && (
            <p className="text-xs text-[#5C7A6C]">Academy active for {tenureLabel(stats.memberSince)}</p>
          )}
        </div>
        <Link
          href="/dashboard/reports"
          className="px-3 py-1.5 bg-[#EEF4EC] text-teal rounded-xl text-xs font-bold hover:bg-[#E2ECE5] transition-colors"
        >
          📊 Reports
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Attendance (7d)"
          value={stats?.attendancePct7d != null ? `${stats.attendancePct7d}%` : "-"}
          subText="Past 7 days average"
          icon="👥"
        />
        <StatCard
          label="Fee Collection"
          value={stats?.feeCollectionPct != null ? `${stats.feeCollectionPct}%` : "-"}
          subText={`₹${stats?.paidAmount ?? 0} collected`}
          icon="💰"
        />
        <StatCard
          label="Pending Fees"
          value={stats ? `₹${stats.pendingAmount}` : "-"}
          subText={`${stats?.pendingCount ?? 0} invoices pending`}
          accent="amber"
          icon="⏳"
        />
        <StatCard
          label="Overdue Amount"
          value={stats ? `₹${stats.overdueAmount}` : "-"}
          subText={`${stats?.overdueCount ?? 0} overdue members`}
          accent="coral"
          icon="⚠️"
        />
      </div>

      {/* 7-Day Attendance Visual Trend Chart */}
      {stats?.dailyAttendance && stats.dailyAttendance.length > 0 && (
        <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">7-Day Attendance Trend</p>
              <p className="text-xs text-[#5C7A6C]">Daily present vs absent markups</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#5C7A6C]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-teal"></span> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-coral/80"></span> Absent
              </span>
            </div>
          </div>

          <div className="h-32 flex items-end gap-2 pt-4 border-b border-[#EEF4EC] pb-2">
            {stats.dailyAttendance.map((d, i) => {
              const presentHeight = Math.round((d.present / maxAtt) * 100);
              const absentHeight = Math.round((d.absent / maxAtt) * 100);
              const total = d.present + d.absent;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="text-[10px] text-[#5C7A6C] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    {total > 0 ? `${d.present}/${total}` : "-"}
                  </div>
                  <div className="w-full flex flex-col-reverse items-center gap-0.5 max-w-[28px]">
                    <div
                      style={{ height: `${presentHeight}%`, minHeight: d.present > 0 ? "8px" : "0px" }}
                      className="w-full bg-teal rounded-t-sm transition-all"
                      title={`${d.present} present`}
                    />
                    <div
                      style={{ height: `${absentHeight}%`, minHeight: d.absent > 0 ? "8px" : "0px" }}
                      className="w-full bg-coral/80 rounded-t-sm transition-all"
                      title={`${d.absent} absent`}
                    />
                    {total === 0 && (
                      <div className="w-full h-1 bg-[#EEF4EC] rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#5C7A6C] mt-1">{d.dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Overview Card */}
      {stats && stats.batches.length > 0 && (
        <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">
              Batches ({stats.totalBatches}) • {stats.totalMembers} Active Students
            </p>
            <Link href="/dashboard/batches" className="text-xs font-semibold text-teal hover:underline">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats.batches.map((b, i) => {
              const pct = stats.totalMembers > 0 ? Math.round((b.memberCount / stats.totalMembers) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-900">{b.name}</span>
                    <span className="text-[#5C7A6C]">{b.memberCount} students ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#EEF4EC] rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/dashboard/attendance"
          className="bg-white border border-[#E2ECE5] rounded-2xl p-4 hover:border-teal transition-all shadow-sm group"
        >
          <div className="text-2xl mb-1">📝</div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-teal transition-colors">Mark Attendance</p>
          <p className="text-[11px] text-[#5C7A6C]">Today's class records</p>
        </Link>

        <Link
          href="/dashboard/fees"
          className="bg-white border border-[#E2ECE5] rounded-2xl p-4 hover:border-teal transition-all shadow-sm group"
        >
          <div className="text-2xl mb-1">💳</div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-teal transition-colors">Fees & Reminders</p>
          <p className="text-[11px] text-[#5C7A6C]">Send WhatsApp reminders</p>
        </Link>

        <Link
          href="/dashboard/members"
          className="bg-white border border-[#E2ECE5] rounded-2xl p-4 hover:border-teal transition-all shadow-sm group"
        >
          <div className="text-2xl mb-1">🎓</div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-teal transition-colors">Members & Batches</p>
          <p className="text-[11px] text-[#5C7A6C]">Add students, profiles</p>
        </Link>

        <Link
          href="/dashboard/staff"
          className="bg-white border border-[#E2ECE5] rounded-2xl p-4 hover:border-teal transition-all shadow-sm group"
        >
          <div className="text-2xl mb-1">👨‍🏫</div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-teal transition-colors">Instructors / Staff</p>
          <p className="text-[11px] text-[#5C7A6C]">Assign batch permissions</p>
        </Link>
      </div>

      <div className="space-y-2">
        <Link
          href="/dashboard/broadcast"
          className="flex items-center justify-between bg-white border border-[#E2ECE5] rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 hover:border-teal transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">📢 Send WhatsApp Broadcast Update</span>
          <span className="text-teal">&rarr;</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-between bg-white border border-[#E2ECE5] rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 hover:border-teal transition-all shadow-sm"
        >
          <span className="flex items-center gap-2">⚙️ Business Settings & UPI QR</span>
          <span className="text-teal">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  subText,
  accent,
  icon,
}: {
  label: string;
  value: string;
  subText?: string;
  accent?: "coral" | "amber";
  icon?: string;
}) {
  return (
    <div className="bg-white border border-[#E2ECE5] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] uppercase tracking-wider font-bold text-[#5C7A6C]">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p
        className={`text-2xl font-extrabold ${
          accent === "coral" ? "text-coral" : accent === "amber" ? "text-amber-600" : "text-teal"
        }`}
      >
        {value}
      </p>
      {subText && <p className="text-[10px] text-[#5C7A6C] mt-0.5 font-medium">{subText}</p>}
    </div>
  );
}
