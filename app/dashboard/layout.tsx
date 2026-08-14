"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BusinessProvider, useBusiness } from "@/lib/context/business";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/attendance", label: "Attendance" },
  { href: "/dashboard/fees", label: "Fees" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/batches", label: "Batches" },
  { href: "/dashboard/settings", label: "Settings" },
];

function Nav() {
  const pathname = usePathname();
  const { business, businesses, switchBusiness } = useBusiness();
  return (
    <div className="sticky top-0 bg-white border-b z-10">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center gap-3">
        <Image src="/logo.png" alt="Nishchint" width={120} height={32} className="h-7 w-auto" priority />
        {businesses.length > 1 ? (
          <select
            className="font-bold text-teal bg-transparent border-none focus:outline-none"
            value={business?.id ?? ""}
            onChange={(e) => switchBusiness(e.target.value)}
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <span className="font-bold text-teal">{business?.name ?? "BatchMate"}</span>
        )}
      </div>
      <div className="max-w-lg mx-auto flex overflow-x-auto px-4 pb-2 gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
              pathname === item.href ? "bg-teal text-white" : "bg-[#EEF4EC]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-lg mx-auto px-6 pt-24 text-center text-[#5C7A6C]">
      Loading your business...
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { business, loading } = useBusiness();
  if (loading) return <Loading />;
  if (!business) return <Loading />;
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <Nav />
      <Gate>{children}</Gate>
    </BusinessProvider>
  );
}
