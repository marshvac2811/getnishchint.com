"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

export default function SettingsPage() {
  const { business } = useBusiness();
  const [upiId, setUpiId] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((list) => {
        const mine = Array.isArray(list) ? list.find((b: any) => b.id === business.id) : null;
        setUpiId(mine?.upi_id ?? "");
        setLoading(false);
      });
  }, [business]);

  async function save() {
    if (!business) return;
    await fetch("/api/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: business.id, upi_id: upiId }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-[#5C7A6C]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white rounded-xl p-4">
        <p className="text-sm font-semibold mb-1">UPI ID for fee payments</p>
        <p className="text-xs text-[#5C7A6C] mb-3">
          When guardians open their fee link, they'll see a Pay Now button that sends payment directly to this UPI ID. Nothing passes through us.
        </p>
        <input
          className="w-full rounded-lg border px-3 py-2 mb-3"
          placeholder="yourname@okhdfcbank"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
        <button onClick={save} className="w-full bg-teal text-white rounded-lg py-2 font-medium">
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
    </main>
  );
}
