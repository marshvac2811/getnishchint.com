"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  vertical: string;
  plan_tier: string;
  status: string;
  contact_phone: string | null;
  created_at: string;
  zone: string | null;
}

interface Feedback {
  id: string;
  message: string;
  created_at: string;
  businesses: { name: string } | null;
}

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVertical, setNewVertical] = useState("play_school");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showDistForm, setShowDistForm] = useState(false);
  const [distName, setDistName] = useState("");
  const [distEmail, setDistEmail] = useState("");
  const [distZone, setDistZone] = useState("");
  const [distError, setDistError] = useState("");
  const [addingDist, setAddingDist] = useState(false);
  const [distSuccess, setDistSuccess] = useState("");
  const [zoneEdits, setZoneEdits] = useState<Record<string, string>>({});

  function load() {
    fetch("/api/admin/businesses")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.error ?? "failed");
        }
        return r.json();
      })
      .then(setBusinesses)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function loadFeedback() {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFeedback(data); });
  }

  function toggleFeedback() {
    if (!showFeedback) loadFeedback();
    setShowFeedback(!showFeedback);
  }

  async function addClient() {
    setAddError("");
    if (!newName || !newEmail) {
      setAddError("Name and email are required.");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/businesses/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, vertical: newVertical, contact_phone: newPhone, email: newEmail }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setAddError(data.error ?? "Something went wrong.");
      return;
    }
    setNewName(""); setNewPhone(""); setNewEmail("");
    setShowAddForm(false);
    load();
  }

  async function addDistributor() {
    setDistError("");
    setDistSuccess("");
    if (!distEmail || !distZone) {
      setDistError("Email and zone are required.");
      return;
    }
    setAddingDist(true);
    const res = await fetch("/api/admin/distributors/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: distName, email: distEmail, zone: distZone }),
    });
    const data = await res.json();
    setAddingDist(false);
    if (!res.ok) {
      setDistError(data.error ?? "Something went wrong.");
      return;
    }
    setDistSuccess(`Zone Head invited for "${distZone}".`);
    setDistName(""); setDistEmail(""); setDistZone("");
  }

  async function saveZone(b: Business) {
    const zone = zoneEdits[b.id] !== undefined ? zoneEdits[b.id] : (b.zone ?? "");
    await fetch(`/api/admin/businesses/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone }),
    });
    load();
  }

  async function deleteBusiness(b: Business) {
    const confirmed = window.confirm(
      `Delete "${b.name}" permanently? This removes all their batches, members, attendance, and fee records. This cannot be undone.`
    );
    if (!confirmed) return;
    await fetch(`/api/admin/businesses/${b.id}`, { method: "DELETE" });
    load();
  }

  async function toggleStatus(b: Business) {
    const next = b.status === "active" ? "suspended" : "active";
    await fetch(`/api/admin/businesses/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function changeTier(b: Business, tier: string) {
    await fetch(`/api/admin/businesses/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_tier: tier }),
    });
    load();
  }

  if (error === "not_authorized") {
    return (
      <main className="max-w-lg mx-auto px-6 pt-16 text-center">
        <p className="text-coral font-medium">Not authorized - this page is for the platform owner only.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-10 pb-16">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-sm text-[#4B6459] mb-6">Every business on the platform - for your eyes only.</p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-1 bg-teal text-white rounded-lg py-2.5 font-medium"
        >
          {showAddForm ? "Cancel" : "+ Add Client"}
        </button>
        <button
          onClick={toggleFeedback}
          className="flex-1 bg-[#EEF4EC] text-teal rounded-lg py-2.5 font-medium"
        >
          {showFeedback ? "Hide Feedback" : "View Feedback"}
        </button>
      </div>

      <button
        onClick={() => setShowDistForm(!showDistForm)}
        className="w-full bg-[#EEF4EC] text-teal rounded-lg py-2.5 font-medium mb-4"
      >
        {showDistForm ? "Cancel" : "+ Add Zone Head"}
      </button>

      {showDistForm && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold mb-3">New Zone Head</p>
          <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Name (optional)" value={distName} onChange={(e) => setDistName(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Email (they'll get an invite)" value={distEmail} onChange={(e) => setDistEmail(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 mb-3" placeholder="Zone (e.g. Northwest, Gurgaon)" value={distZone} onChange={(e) => setDistZone(e.target.value)} />
          {distError && <p className="text-coral text-sm mb-2">{distError}</p>}
          {distSuccess && <p className="text-teal text-sm mb-2">{distSuccess}</p>}
          <button onClick={addDistributor} disabled={addingDist} className="w-full bg-teal text-white rounded-lg py-2 font-medium disabled:opacity-60">
            {addingDist ? "Inviting..." : "Invite Zone Head"}
          </button>
          <p className="text-xs text-[#5C7A6C] mt-2">
            They'll see a read-only list of every business with a matching zone. Set each business's zone below in the list.
          </p>
        </div>
      )}

      {showFeedback && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold mb-3">Client feedback</p>
          {feedback.length === 0 && <p className="text-sm text-[#5C7A6C]">No feedback yet.</p>}
          <div className="space-y-3">
            {feedback.map((f) => (
              <div key={f.id} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="text-sm">{f.message}</p>
                <p className="text-xs text-[#5C7A6C] mt-1">{f.businesses?.name ?? "Unknown"} - {new Date(f.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold mb-3">New client</p>
          <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Business name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <select className="w-full rounded-lg border px-3 py-2 mb-2" value={newVertical} onChange={(e) => setNewVertical(e.target.value)}>
            <option value="play_school">Play school</option>
            <option value="gym">Gym</option>
            <option value="dance">Dance / yoga studio</option>
            <option value="tuition">Tuition / coaching</option>
            <option value="other">Other</option>
          </select>
          <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="WhatsApp number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 mb-3" placeholder="Client's email (they'll get an invite)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          {addError && <p className="text-coral text-sm mb-2">{addError}</p>}
          <button onClick={addClient} disabled={adding} className="w-full bg-teal text-white rounded-lg py-2 font-medium disabled:opacity-60">
            {adding ? "Creating..." : "Create client"}
          </button>
        </div>
      )}

      {!businesses && !error && <p className="text-sm text-[#5C7A6C]">Loading...</p>}

      {businesses && businesses.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <SummaryStat label="Total" value={businesses.length} />
          <SummaryStat label="Active" value={businesses.filter((b) => b.status === "active").length} />
          <SummaryStat label="Suspended" value={businesses.filter((b) => b.status === "suspended").length} accent="coral" />
        </div>
      )}

      {businesses && businesses.length > 0 && (
        <input
          type="text"
          placeholder="Search by name, type, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-4"
        />
      )}

      <div className="space-y-3">
        {businesses
          ?.filter((b) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
              b.name.toLowerCase().includes(q) ||
              b.vertical.toLowerCase().includes(q) ||
              (b.contact_phone ?? "").toLowerCase().includes(q)
            );
          })
          .map((b) => (
          <div key={b.id} className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs text-[#5C7A6C]">{b.vertical} | {b.contact_phone ?? "no phone"}</p>
                <p className="text-xs text-[#5C7A6C]">Member since {new Date(b.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${b.status === "active" ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"}`}>
                {b.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Link
                href={`/admin/${b.id}`}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#EEF4EC] text-teal"
              >
                View
              </Link>
              <select
                className="text-sm rounded-lg border px-2 py-1"
                value={b.plan_tier}
                onChange={(e) => changeTier(b, e.target.value)}
              >
                <option value="basic">basic</option>
                <option value="standard">standard</option>
                <option value="premium">premium</option>
              </select>
              <button
                onClick={() => toggleStatus(b)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg ${b.status === "active" ? "bg-coral text-white" : "bg-teal text-white"}`}
              >
                {b.status === "active" ? "Suspend" : "Reactivate"}
              </button>
              <button
                onClick={() => deleteBusiness(b)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white border border-coral text-coral"
              >
                Delete
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                className="text-sm rounded-lg border px-2 py-1 flex-1"
                placeholder="Zone (e.g. Northwest)"
                value={zoneEdits[b.id] !== undefined ? zoneEdits[b.id] : (b.zone ?? "")}
                onChange={(e) => setZoneEdits((prev) => ({ ...prev, [b.id]: e.target.value }))}
              />
              <button
                onClick={() => saveZone(b)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#EEF4EC] text-teal whitespace-nowrap"
              >
                Save zone
              </button>
            </div>
          </div>
        ))}
        {businesses?.length === 0 && <p className="text-sm text-[#5C7A6C]">No businesses yet.</p>}
      </div>
    </main>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: number; accent?: "coral" }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${accent === "coral" ? "text-coral" : "text-teal"}`}>{value}</p>
      <p className="text-xs text-[#5C7A6C]">{label}</p>
    </div>
  );
}
