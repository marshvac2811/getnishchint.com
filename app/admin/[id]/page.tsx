"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Summary {
  business: { name: string; vertical: string; status: string; contact_phone: string | null };
  batchCount: number;
  memberCount: number;
  feeCollectionPct: number | null;
  overdueCount: number;
  overdueAmount: number;
  attendancePct: number | null;
  batches: { id: string; name: string; fee_amount: number }[];
  members: { id: string; name: string; guardian_phone: string }[];
}

export default function AdminBusinessPage() {
  const params = useParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/businesses/${params.id}/summary`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "failed");
        return r.json();
      })
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-16 text-center">
        <p className="text-coral font-medium">{error === "not_authorized" ? "Not authorized." : error}</p>
      </main>
    );
  }

  if (!summary) {
    return <main className="max-w-lg mx-auto px-6 pt-16 text-center text-[#5C7A6C]">Loading…</main>;
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-10 pb-16">
      <Link href="/admin" className="text-sm text-teal underline mb-4 inline-block">← All businesses</Link>
      <h1 className="text-2xl font-bold mb-1">{summary.business.name}</h1>
      <p className="text-sm text-[#4B6459] mb-6">{summary.business.vertical} · {summary.business.contact_phone ?? "no phone"} · {summary.business.status}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Stat label="Batches" value={String(summary.batchCount)} />
        <Stat label="Active members" value={String(summary.memberCount)} />
        <Stat label="Attendance rate" value={summary.attendancePct != null ? `${summary.attendancePct}%` : "—"} />
        <Stat label="Fee collection" value={summary.feeCollectionPct != null ? `${summary.feeCollectionPct}%` : "—"} />
        <Stat label="Overdue fees" value={String(summary.overdueCount)} accent="coral" />
        <Stat label="Overdue amount" value={`₹${summary.overdueAmount}`} accent="coral" />
      </div>

      <h2 className="text-sm font-semibold mb-2 text-[#4B6459]">Batches</h2>
      <div className="space-y-2 mb-6">
        {summary.batches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl px-4 py-3">
            <p className="font-medium">{b.name}</p>
            <p className="text-xs text-[#5C7A6C]">₹{b.fee_amount}/mo</p>
          </div>
        ))}
        {summary.batches.length === 0 && <p className="text-sm text-[#5C7A6C]">No batches yet.</p>}
      </div>

      <h2 className="text-sm font-semibold mb-2 text-[#4B6459]">Members</h2>
      <div className="space-y-2">
        {summary.members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl px-4 py-3">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-[#5C7A6C]">{m.guardian_phone}</p>
          </div>
        ))}
        {summary.members.length === 0 && <p className="text-sm text-[#5C7A6C]">No members yet.</p>}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "coral" }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-[#5C7A6C] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent === "coral" ? "text-coral" : "text-teal"}`}>{value}</p>
    </div>
  );
}
