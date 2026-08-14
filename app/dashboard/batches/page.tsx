"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

interface Batch { id: string; name: string; fee_amount: number; fee_cycle: string; }

export default function BatchesPage() {
  const { business } = useBusiness();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");

  function load() {
    if (!business) return;
    fetch(`/api/batches?business_id=${business.id}`).then((r) => r.json()).then(setBatches);
  }
  useEffect(load, [business]);

  async function addBatch() {
    if (!name || !fee || !business) return;
    await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, name, fee_amount: Number(fee) }),
    });
    setName(""); setFee("");
    load();
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Batches</h1>

      <div className="bg-white rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Add a batch</p>
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Batch name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2 mb-3" placeholder="Monthly fee (₹)" type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
        <button onClick={addBatch} className="w-full bg-teal text-white rounded-lg py-2 font-medium">Add batch</button>
      </div>

      <div className="space-y-2">
        {batches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl px-4 py-3">
            <p className="font-medium">{b.name}</p>
            <p className="text-xs text-[#5C7A6C]">₹{b.fee_amount} / {b.fee_cycle}</p>
          </div>
        ))}
        {batches.length === 0 && <p className="text-sm text-[#5C7A6C]">No batches yet — add your first one above.</p>}
      </div>
    </main>
  );
}
