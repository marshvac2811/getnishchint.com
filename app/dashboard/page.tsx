"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/context/business";

interface Stats {
  attendancePct7d: number | null;
  feeCollectionPct: number | null;
  overdueCount: number;
  overdueAmount: number;
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Attendance (7d)" value={stats?.attendancePct7d != null ? `${stats.attendancePct7d}%` : "—"} />
        <StatCard label="Fee collection" value={stats?.feeCollectionPct != null ? `${stats.feeCollectionPct}%` : "—"} />
        <StatCard label="Overdue fees" value={stats ? String(stats.overdueCount) : "—"} accent="coral" />
        <StatCard label="Overdue amount" value={stats ? `₹${stats.overdueAmount}` : "—"} accent="coral" />
      </div>

      <div className="space-y-3">
        <Link href="/dashboard/attendance" className="block bg-white rounded-xl px-4 py-3 font-medium">Mark today's attendance →</Link>
        <Link href="/dashboard/fees" className="block bg-white rounded-xl px-4 py-3 font-medium">View fees & reminders →</Link>
        <Link href="/dashboard/members" className="block bg-white rounded-xl px-4 py-3 font-medium">Manage members →</Link>
        <Link href="/dashboard/batches" className="block bg-white rounded-xl px-4 py-3 font-medium">Manage batches →</Link>
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
