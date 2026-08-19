"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/context/business";
import { useToast } from "@/components/Toast";

interface Fee {
  id: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  penalty_per_day: number;
  reminder_sent_at?: string | null;
  members: { name: string; guardian_name: string | null; guardian_phone: string; access_token?: string };
}

function daysLate(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function FeesPage() {
  const { business } = useBusiness();
  const { showToast } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function load() {
    if (!business) return;
    setLoading(true);
    const url = `/api/fees?business_id=${business.id}${filter ? `&status=${filter}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setFees(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [business, filter]);

  async function markPaid(id: string, memberName: string) {
    const res = await fetch(`/api/fees/${id}/mark-paid`, { method: "POST" });
    if (res.ok) {
      showToast(`Fee marked as paid for ${memberName}!`);
      load();
    } else {
      showToast("Failed to mark fee as paid", "error");
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Fees & Billing</h1>
          <p className="text-xs text-[#5C7A6C]">Track payments, receipts & dispatch reminders</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "", label: "All Fees" },
          { key: "pending", label: "Pending" },
          { key: "overdue", label: "Overdue ⚠️" },
          { key: "paid", label: "Paid ✓" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === s.key ? "bg-teal text-white shadow-xs" : "bg-white border border-[#E2ECE5] text-[#5C7A6C] hover:bg-[#EEF4EC]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Fee List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-[#5C7A6C] text-center py-6">Loading fees ledger...</p>
        ) : fees.length === 0 ? (
          <div className="bg-white border border-[#E2ECE5] rounded-2xl p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-800">No fee records found</p>
            <p className="text-xs text-[#5C7A6C] mt-1">
              Fees are automatically generated based on batch cycles, or you can trigger the daily job.
            </p>
          </div>
        ) : (
          fees.map((f) => {
            const late = f.status === "overdue" ? daysLate(f.due_date) : 0;
            const penalty = late * (f.penalty_per_day ?? 0);
            const total = Number(f.amount) + penalty;

            return (
              <div
                key={f.id}
                className="bg-white border border-[#E2ECE5] rounded-2xl p-4 shadow-sm hover:border-teal/50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{f.members?.name}</p>
                    <p className="text-xs text-[#5C7A6C]">
                      Due: {new Date(f.due_date).toLocaleDateString("en-IN")} • Amount: <strong className="text-gray-900">₹{f.amount}</strong>
                    </p>
                    {penalty > 0 && (
                      <p className="text-[11px] text-coral font-medium mt-0.5">
                        {late} day{late === 1 ? "" : "s"} late • Penalty: ₹{penalty} • Total: ₹{total}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      f.status === "overdue"
                        ? "bg-coral/10 text-coral border border-coral/20"
                        : f.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EEF4EC] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {f.members?.guardian_phone && f.status !== "paid" && (
                      <a
                        href={`https://wa.me/91${f.members.guardian_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Hi ${f.members.guardian_name || "Parent"}, this is a reminder from ${business?.name || "Academy"} that fee of Rs.${total} for ${f.members.name} is due. Link: ${typeof window !== "undefined" ? window.location.origin : ""}/m/${f.members.access_token}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#128C7E] bg-[#25D366]/10 px-2.5 py-1 rounded-lg hover:bg-[#25D366]/20 transition-colors"
                      >
                        💬 WhatsApp
                      </a>
                    )}

                    {f.status === "paid" && (
                      <Link
                        href={`/receipt/${f.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal bg-[#EEF4EC] px-2.5 py-1 rounded-lg hover:bg-[#E2ECE5] transition-colors"
                      >
                        📄 View Receipt
                      </Link>
                    )}
                  </div>

                  {f.status !== "paid" && (
                    <button
                      onClick={() => markPaid(f.id, f.members?.name || "Student")}
                      className="text-xs font-bold bg-teal text-white px-3 py-1.5 rounded-lg shadow-xs hover:opacity-90 transition-opacity"
                    >
                      Mark Paid ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
