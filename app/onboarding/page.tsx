"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const VERTICALS = [
  { value: "play_school", label: "Play school" },
  { value: "gym", label: "Gym" },
  { value: "dance", label: "Dance / yoga studio" },
  { value: "tuition", label: "Tuition / coaching" },
  { value: "other", label: "Other" },
];

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("play_school");
  const [phone, setPhone] = useState("");
  const [batchName, setBatchName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    const bizRes = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, vertical, contact_phone: phone }),
    });
    const biz = await bizRes.json();
    if (!biz.id) return;

    await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: biz.id,
        name: batchName,
        fee_amount: Number(feeAmount),
      }),
    });

    router.push("/dashboard");
  }

  return (
    <main className="max-w-md mx-auto pt-16 px-6 pb-16">
      <h1 className="text-2xl font-bold mb-1">Set up your business</h1>
      <p className="text-sm text-[#4B6459] mb-6">Takes about a minute.</p>

      <label className="block text-sm font-medium mb-1">Business name</label>
      <input className="w-full rounded-lg border px-3 py-2 mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Little Steps Play School" />

      <label className="block text-sm font-medium mb-1">Type</label>
      <select className="w-full rounded-lg border px-3 py-2 mb-4" value={vertical} onChange={(e) => setVertical(e.target.value)}>
        {VERTICALS.map((v) => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </select>

      <label className="block text-sm font-medium mb-1">Your WhatsApp number</label>
      <input className="w-full rounded-lg border px-3 py-2 mb-6" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />

      <div className="border-t pt-4 mb-4">
        <p className="text-sm font-semibold mb-3">Add your first batch</p>
        <label className="block text-sm font-medium mb-1">Batch name</label>
        <input className="w-full rounded-lg border px-3 py-2 mb-4" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Morning Batch" />

        <label className="block text-sm font-medium mb-1">Monthly fee (₹)</label>
        <input className="w-full rounded-lg border px-3 py-2 mb-4" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="2500" type="number" />
      </div>

      <button onClick={handleSubmit} className="w-full bg-teal text-white rounded-lg py-3 font-medium">
        Create business
      </button>
    </main>
  );
}
