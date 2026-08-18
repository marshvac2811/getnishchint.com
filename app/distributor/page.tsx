"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Business {
  id: string;
  name: string;
  vertical: string;
  status: string;
  plan_tier: string;
  contact_phone: string | null;
  created_at: string;
}

export default function DistributorPage() {
  const [zone, setZone] = useState("");
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/distributor/businesses")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.error ?? "failed");
        }
        return r.json();
      })
      .then((data) => {
        setZone(data.zone);
        setBusinesses(data.businesses);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error === "not_authorized") {
    return (
      <main className="max-w-lg mx-auto px-6 pt-16 text-center">
        <p className="text-coral font-medium">Not authorized - this page is for Zone Heads only.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-10 pb-16">
      <Image src="/logo.png" alt="Nishchint" width={140} height={40} className="h-8 w-auto mb-6" priority />
      <h1 className="text-2xl font-bold mb-1">Zone Head Dashboard</h1>
      <p className="text-sm text-[#4B6459] mb-6">
        {zone ? `Businesses in your zone: ${zone}` : "Loading your zone..."}
      </p>

      {!businesses && !error && <p className="text-sm text-[#5C7A6C]">Loading...</p>}

      {businesses && businesses.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-teal">{businesses.length}</p>
            <p className="text-xs text-[#5C7A6C]">Total</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-teal">{businesses.filter((b) => b.status === "active").length}</p>
            <p className="text-xs text-[#5C7A6C]">Active</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-coral">{businesses.filter((b) => b.status === "suspended").length}</p>
            <p className="text-xs text-[#5C7A6C]">Suspended</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {businesses?.map((b) => (
          <div key={b.id} className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold">{b.name}</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${b.status === "active" ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"}`}>
                {b.status}
              </span>
            </div>
            <p className="text-xs text-[#5C7A6C]">{b.vertical} - {b.plan_tier} plan</p>
            <p className="text-xs text-[#5C7A6C]">{b.contact_phone ?? "no phone on file"}</p>
            <p className="text-xs text-[#5C7A6C]">Joined {new Date(b.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {businesses?.length === 0 && (
          <p className="text-sm text-[#5C7A6C]">No businesses in your zone yet.</p>
        )}
      </div>
    </main>
  );
}
