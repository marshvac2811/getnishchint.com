"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Business { id: string; name: string; vertical: string; status: string; plan_tier: string; is_trial: boolean; trial_ends_at: string | null; }
interface PlatformFee { id: string; amount: number; due_date: string; status: string; penalty_per_day: number; }

function daysLate(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function AdminBusinessDetail() {
  const params = useParams();
  const businessId = params.id as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [penalty, setPenalty] = useState("0");
  const [error, setError] = useState("");

  function loadBusiness() {
    fetch("/api/admin/businesses")
      .then((r) => r.json())
      .then((list) => {
        if (!Array.isArray(list)) { setError(list.error ?? "failed"); return; }
        const found = list.find((b: Business) => b.id === businessId);
        setBusiness(found ?? null);
      });
  }

  function loadFees() {
    fetch(`/api/admin/platform-fees?business_id=${businessId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFees(data); });
  }

  useEffect(() => { loadBusiness(); loadFees(); }, [businessId]);

  async function addCharge() {
    if (!amount || !dueDate) return;
    await fetch("/api/admin/platform-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, amount: Number(amount), due_date: dueDate, penalty_per_day: Number(penalty) }),
    });
    setAmount(""); setDueDate(""); setPenalty("0");
    loadFees();
  }

  async function markPaid(id: string) {
    await fetch(`/api/admin/platform-fees/${id}/mark-paid`, { method: "POST" });
    loadFees();
  }

  if (error === "not_authorized") {
    return (
      <main className="max-w-lg mx-auto px-6 pt-16 text-center">
        <p className="text-coral font-medium">Not authorized - this page is for the platform owner only.</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-16 text-center">
        <p className="text-sm text-[#5C7A6C]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-10 pb-16">
      <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
      <p className="text-sm text-[#5C7A6C] mb-6">
        {business.vertical} - {business.plan_tier} plan - {business.status}
        {business.is_trial && business.trial_ends_at && (
          <> - trial ends {new Date(business.trial_ends_at).toLocaleDateString()}</>
        )}
      </p>

      <div className="bg-white rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Add a charge</p>
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Amount (Rs.)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-[#5C7A6C]">Due date</label>
            <input className="w-full rounded-lg border px-3 py-2" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#5C7A6C]">Penalty (Rs./day late)</label>
            <input className="w-full rounded-lg border px-3 py-2" type="number" min="0" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
          </div>
        </div>
        <button onClick={addCharge} className="w-full bg-teal text-white rounded-lg py-2 font-medium">Add charge</button>
      </div>

      <p className="text-sm font-semibold mb-2">Charges</p>
      <div className="space-y-2">
        {fees.map((f) => {
          const late = f.status === "overdue" ? daysLate(f.due_date) : 0;
          const penaltyAmt = late * (f.penalty_per_day ?? 0);
          const total = f.amount + penaltyAmt;
          return (
            <div key={f.id} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">Rs.{f.amount}</p>
                <p className="text-xs text-[#5C7A6C]">
                  due {f.due_date} - <span className={f.status === "overdue" ? "text-coral" : ""}>{f.status}</span>
                </p>
                {penaltyAmt > 0 && (
                  <p className="text-xs text-coral">{late} day{late === 1 ? "" : "s"} late - penalty Rs.{penaltyAmt} - total due Rs.{total}</p>
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
        {fees.length === 0 && <p className="text-sm text-[#5C7A6C]">No charges yet.</p>}
      </div>
    </main>
  );
}
