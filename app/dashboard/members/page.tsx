"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

interface Batch { id: string; name: string; }
interface Member { id: string; name: string; guardian_phone: string; }

export default function MembersPage() {
  const { business } = useBusiness();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  useEffect(() => {
    if (!business) return;
    fetch(`/api/batches?business_id=${business.id}`).then((r) => r.json()).then((data) => {
      setBatches(data);
      if (data[0]) setBatchId(data[0].id);
    });
  }, [business]);

  function loadMembers() {
    if (!batchId) return;
    fetch(`/api/members?batch_id=${batchId}`).then((r) => r.json()).then(setMembers);
  }

  useEffect(loadMembers, [batchId]);

  async function addMember() {
    if (!name || !guardianPhone || !business) return;
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, batch_id: batchId, name, guardian_name: guardianName, guardian_phone: guardianPhone }),
    });
    setName(""); setGuardianName(""); setGuardianPhone("");
    loadMembers();
  }

  if (batches.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
        <h1 className="text-2xl font-bold mb-2">Members</h1>
        <p className="text-sm text-[#5C7A6C]">Add a batch first from the Batches tab.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Members</h1>

      <select className="w-full rounded-lg border px-3 py-2 mb-6" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <div className="bg-white rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Add a member</p>
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Member name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Guardian name (optional)" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2 mb-3" placeholder="Guardian WhatsApp number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
        <button onClick={addMember} className="w-full bg-teal text-white rounded-lg py-2 font-medium">Add member</button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl px-4 py-3">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-[#5C7A6C]">{m.guardian_phone}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
