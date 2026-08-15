"use client";
import { useState } from "react";
import Image from "next/image";

export default function TrialSignupPage() {
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("play_school");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    if (!name || !email) {
      setError("Business name and email are required.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/public/trial-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, vertical, contact_phone: phone, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="max-w-md mx-auto pt-24 px-6 text-center">
        <Image src="/logo.png" alt="Nishchint" width={200} height={57} className="h-12 w-auto mx-auto mb-6" priority />
        <p className="font-semibold mb-2">You're all set.</p>
        <p className="text-sm text-[#5C7A6C]">
          Check {email} for an email to set your password and get started. Your 14-day trial has begun.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto pt-16 px-6 pb-16">
      <Image src="/logo.png" alt="Nishchint" width={200} height={57} className="h-12 w-auto mx-auto mb-6" priority />
      <h1 className="text-2xl font-bold text-center mb-2">Start your free trial</h1>
      <p className="text-sm text-[#5C7A6C] text-center mb-8">14 days, no card required.</p>

      <div className="bg-white rounded-xl p-4">
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="w-full rounded-lg border px-3 py-2 mb-2" value={vertical} onChange={(e) => setVertical(e.target.value)}>
          <option value="play_school">Play school</option>
          <option value="gym">Gym</option>
          <option value="dance">Dance / yoga studio</option>
          <option value="tuition">Tuition / coaching</option>
          <option value="other">Other</option>
        </select>
        <input className="w-full rounded-lg border px-3 py-2 mb-2" placeholder="WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2 mb-3" placeholder="Your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p className="text-coral text-sm mb-2">{error}</p>}
        <button onClick={submit} disabled={submitting} className="w-full bg-teal text-white rounded-lg py-2.5 font-medium disabled:opacity-60">
          {submitting ? "Starting..." : "Start free trial"}
        </button>
      </div>
    </main>
  );
}
