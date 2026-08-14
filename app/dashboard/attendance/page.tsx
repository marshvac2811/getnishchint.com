"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

interface Batch { id: string; name: string; }
interface Member { id: string; name: string; }

export default function AttendancePage() {
  const { business } = useBusiness();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "present" | "absent">>({});
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!business) return;
    fetch(`/api/batches?business_id=${business.id}`).then((r) => r.json()).then((data) => {
      setBatches(data);
      if (data[0]) setBatchId(data[0].id);
    });
  }, [business]);

  useEffect(() => {
    if (!batchId) return;
    fetch(`/api/members?batch_id=${batchId}`).then((r) => r.json()).then((data) => {
      setMembers(data);
      const initial: Record<string, "present" | "absent"> = {};
      data.forEach((m: Member) => (initial[m.id] = "present"));
      setStatuses(initial);
    });
  }, [batchId]);

  function toggle(memberId: string) {
    setStatuses((prev) => ({
      ...prev,
      [memberId]: prev[memberId] === "present" ? "absent" : "present",
    }));
  }

  async function save() {
    if (!business) return;
    const records = Object.entries(statuses).map(([member_id, status]) => ({ member_id, status }));
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, batch_id: batchId, session_date: today, records }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (batches.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
        <h1 className="text-2xl font-bold mb-2">Today's attendance</h1>
        <p className="text-sm text-[#5C7A6C]">Add a batch first from the Batches tab.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-1">Today's attendance</h1>
      <p className="text-sm text-[#4B6459] mb-6">{today} — tap a name to mark absent</p>

      <select className="w-full rounded-lg border px-3 py-2 mb-4" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <div className="space-y-2 mb-6">
        {members.length === 0 && <p className="text-sm text-[#5C7A6C]">No members in this batch yet — add some from the Members tab.</p>}
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className={`w-full flex justify-between items-center rounded-xl px-4 py-3 font-medium ${
              statuses[m.id] === "present" ? "bg-white" : "bg-coral/10 text-coral"
            }`}
          >
            <span>{m.name}</span>
            <span className="text-sm">{statuses[m.id] === "present" ? "Present" : "Absent"}</span>
          </button>
        ))}
      </div>

      {members.length > 0 && (
        <button onClick={save} className="w-full bg-teal text-white rounded-lg py-3 font-medium">
          {saved ? "Saved ✓" : "Save attendance"}
        </button>
      )}
    </main>
  );
}
