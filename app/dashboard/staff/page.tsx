"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";
import { Batch, Staff } from "@/lib/types";

export default function StaffPage() {
  const { business } = useBusiness();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"instructor" | "manager">("instructor");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function loadData() {
    if (!business) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/staff?business_id=${business.id}`).then((r) => r.json()),
      fetch(`/api/batches?business_id=${business.id}`).then((r) => r.json()),
    ])
      .then(([staffData, batchData]) => {
        setStaffList(Array.isArray(staffData) ? staffData : []);
        setBatches(Array.isArray(batchData) ? batchData : []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [business]);

  function toggleBatch(batchId: string) {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  }

  async function addStaff() {
    if (!name || !phone || !business) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          name,
          phone,
          email,
          role,
          assigned_batch_ids: selectedBatches,
        }),
      });
      if (res.ok) {
        setName("");
        setPhone("");
        setEmail("");
        setSelectedBatches([]);
        loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteStaff(id: string) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
    loadData();
  }

  function getBatchNames(assignedIds: string[]) {
    if (!assignedIds || assignedIds.length === 0) return "All Batches";
    return batches
      .filter((b) => assignedIds.includes(b.id))
      .map((b) => b.name)
      .join(", ") || "No batches assigned";
  }

  return (
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Instructors</h1>
          <p className="text-xs text-[#5C7A6C]">Manage instructors and grant attendance marking access</p>
        </div>
      </div>

      {/* Add Staff Form */}
      <div className="bg-white border border-[#E2ECE5] rounded-2xl p-5 mb-6 shadow-sm">
        <p className="text-sm font-bold text-gray-900 mb-3">Add Instructor / Staff</p>

        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-[#E2ECE5] px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal"
            placeholder="Full Name (e.g. Coach Ramesh)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="w-full rounded-xl border border-[#E2ECE5] px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal"
              placeholder="Phone (WhatsApp)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-[#E2ECE5] px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal"
              placeholder="Email (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5C7A6C] block mb-1.5">Role</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("instructor")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  role === "instructor"
                    ? "bg-teal text-white border-teal shadow-xs"
                    : "bg-white text-gray-700 border-[#E2ECE5]"
                }`}
              >
                Instructor (Attendance Only)
              </button>
              <button
                type="button"
                onClick={() => setRole("manager")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  role === "manager"
                    ? "bg-teal text-white border-teal shadow-xs"
                    : "bg-white text-gray-700 border-[#E2ECE5]"
                }`}
              >
                Manager (Full Ops)
              </button>
            </div>
          </div>

          {batches.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[#5C7A6C] block mb-1.5">
                Assign Batches (select which batches this instructor manages)
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#F8FAF8] rounded-xl border border-[#EEF4EC]">
                {batches.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer p-1 rounded hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatches.includes(b.id)}
                      onChange={() => toggleBatch(b.id)}
                      className="rounded text-teal focus:ring-teal"
                    />
                    <span className="font-medium">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={addStaff}
            disabled={submitting || !name || !phone}
            className="w-full bg-teal text-white rounded-xl py-2.5 font-bold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Adding..." : "+ Add Staff Member"}
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Current Staff ({staffList.length})</h2>

        {loading ? (
          <p className="text-xs text-[#5C7A6C]">Loading staff members...</p>
        ) : staffList.length === 0 ? (
          <div className="bg-white border border-[#E2ECE5] rounded-2xl p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-800">No staff members yet</p>
            <p className="text-xs text-[#5C7A6C] mt-1">
              Add your teachers or coaches above so they can mark attendance without seeing fee revenue.
            </p>
          </div>
        ) : (
          staffList.map((s) => (
            <div key={s.id} className="bg-white border border-[#E2ECE5] rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{s.name}</p>
                    <span className="px-2 py-0.5 bg-[#EEF4EC] text-teal text-[10px] font-bold rounded uppercase">
                      {s.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C7A6C] mt-0.5">📞 +91 {s.phone}</p>
                  {s.email && <p className="text-xs text-[#5C7A6C]">✉️ {s.email}</p>}
                </div>
                <button
                  onClick={() => deleteStaff(s.id)}
                  className="text-xs text-coral hover:bg-coral/10 px-2 py-1 rounded transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#EEF4EC] flex items-center justify-between text-xs">
                <span className="text-[#5C7A6C]">
                  Batches: <strong className="text-gray-800">{getBatchNames(s.assigned_batch_ids)}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
