"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/context/business";

interface BatchStat { name: string; memberCount: number; }
interface Stats {
  memberSince: string | null;
  totalBatches: number;
  totalMembers: number;
  batches: BatchStat[];
  attendancePct7d: number | null;
  feeCollectionPct: number | null;
  paidCount: number;
  pendingCount: number;
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

  useEffect(() => {
    if (!business) return;
    fetch(`/api/dashboard?business_id=${business.id}`).then((r) => r.json()).then(setStats);
  }, [business]);

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      {stats?.memberSince && (
        <p className="text-sm text-[#5C7A6C] mb-6">With GetNishChint for {tenureLabel(stats.memberSince)}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatCard label="Attendance (7d)" value={stats?.attendancePct7d != null ? `${stats.attendancePct7d}%` : "-"} />
        <StatCard label="Fee collection" value={stats?.feeCollectionPct != null ? `${stats.feeCollectionPct}%` : "-"} />
        <StatCard label="Overdue fees" value={stats ? String(stats.overdueCount) : "-"} accent="coral" />
        <StatCard label="Overdue amount" value={stats ? `Rs.${stats.overdueAmount}` : "-"} accent="coral" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Paid this cycle" value={stats ? String(stats.paidCount) : "-"} />
        <StatCard label="Pending" value={stats ? String(stats.pendingCount) : "-"} />
      </div>

      {stats && stats.batches.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-8">
          <p className="text-sm font-semibold mb-3">
            {stats.totalBatches} group{stats.totalBatches === 1 ? "" : "s"} - {stats.totalMembers} member{stats.totalMembers === 1 ? "" : "s"} total
          </p>
          <div className="space-y-2">
            {stats.batches.map((b, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{b.name}</span>
                <span className="text-[#5C7A6C]">{b.memberCount} member{b.memberCount === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Link href="/dashboard/attendance" className="block bg-white rounded-xl px-4 py-3 font-medium">Mark today's attendance -&gt;</Link>
        <Link href="/dashboard/fees" className="block bg-white rounded-xl px-4 py-3 font-medium">View fees & reminders -&gt;</Link>
        <Link href="/dashboard/members" className="block bg-white rounded-xl px-4 py-3 font-medium">Manage members -&gt;</Link>
        <Link href="/dashboard/batches" className="block bg-white rounded-xl px-4 py-3 font-medium">Manage batches -&gt;</Link>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "coral" }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-[#5C7A6C] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent === "coral" ? "text-coral" : "text-teal"}`}>{value}</p>
    </div>
  );
}
