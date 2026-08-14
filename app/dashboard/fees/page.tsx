"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

interface Fee {
  id: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  penalty_per_day: number;
  members: { name: string; guardian_name: string | null };
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
  const [fees, setFees] = useState<Fee[]>([]);
  const [filter, setFilter] = useState<string>("");

  function load() {
    if (!business) return;
    const url = `/api/fees?business_id=${business.id}${filter ? `&status=${filter}` : ""}`;
    fetch(url).then((r) => r.json()).then(setFees);
  }

  useEffect(load, [business, filter]);

  async function markPaid(id: string) {
    await fetch(`/api/fees/${id}/mark-paid`, { method: "POST" });
    load();
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Fees</h1>

      <div className="flex gap-2 mb-5">
        {["", "pending", "overdue", "paid"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-teal text-white" : "bg-white"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {fees.map((f) => {
          const late = f.status === "overdue" ? daysLate(f.due_date) : 0;
          const penalty = late * (f.penalty_per_day ?? 0);
          const total = f.amount + penalty;
          return (
            <div key={f.id} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{f.members?.name}</p>
                <p className="text-xs text-[#5C7A6C]">
                  Rs.{f.amount} - due {f.due_date} -{" "}
                  <span className={f.status === "overdue" ? "text-coral" : ""}>{f.status}</span>
                </p>
                {penalty > 0 && (
                  <p className="text-xs text-coral">
                    {late} day{late === 1 ? "" : "s"} late - penalty Rs.{penalty} - total due Rs.{total}
                  </p>
                )}
              </div>
              {f.status !== "paid" && (
                <button onClick={() => markPaid(f.id)} className="text-sm font-medium text-teal underline whitespace-nowrap">
                  Mark paid
                </button>
              )}
            </div>
          );
        })}
        {fees.length === 0 && <p className="text-sm text-[#5C7A6C]">No fees yet - these are generated automatically once the daily job runs.</p>}
      </div>
    </main>
  );
}
