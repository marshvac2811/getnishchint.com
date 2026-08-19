"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BusinessProvider, useBusiness } from "@/lib/context/business";
import { ToastProvider } from "@/components/Toast";
import OnboardingTour from "@/components/OnboardingTour";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/attendance", label: "Attendance" },
  { href: "/dashboard/fees", label: "Fees" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/batches", label: "Batches" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/broadcast", label: "Broadcast" },
  { href: "/dashboard/settings", label: "Settings" },
];

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "📝" },
  { href: "/dashboard/fees", label: "Fees", icon: "💳" },
  { href: "/dashboard/members", label: "Members", icon: "👥" },
  { href: "/dashboard/reports", label: "Reports", icon: "📊" },
];

function Nav() {
  const pathname = usePathname();
  const { business, businesses, switchBusiness } = useBusiness();

  return (
    <div className="sticky top-0 bg-white border-b border-[#E2ECE5] z-30 shadow-xs">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="BatchMate" width={120} height={32} className="h-7 w-auto" priority />
        </Link>
        {businesses.length > 1 ? (
          <select
            className="font-bold text-teal bg-[#EEF4EC] px-3 py-1 rounded-lg text-xs border-none focus:outline-none cursor-pointer"
            value={business?.id ?? ""}
            onChange={(e) => switchBusiness(e.target.value)}
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <span className="font-bold text-xs bg-[#EEF4EC] text-teal px-3 py-1 rounded-lg">
            {business?.name ?? "BatchMate"}
          </span>
        )}
      </div>
      <div className="max-w-lg mx-auto flex overflow-x-auto px-4 pb-2.5 gap-1.5 scrollbar-none">
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? "bg-teal text-white shadow-xs"
                  : "bg-[#F4F7F5] text-[#5C7A6C] hover:bg-[#EEF4EC] hover:text-teal"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2ECE5] z-30 px-3 py-2 flex justify-around items-center shadow-lg">
      {BOTTOM_NAV.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
              isActive ? "text-teal font-bold" : "text-[#5C7A6C]"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-lg mx-auto px-6 pt-24 text-center">
      <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-sm font-medium text-[#5C7A6C]">Loading your business workspace...</p>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { business, loading } = useBusiness();
  if (loading) return <Loading />;
  if (!business) return <Loading />;
  return (
    <>
      <OnboardingTour />
      {children}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <ToastProvider>
        <Nav />
        <Gate>{children}</Gate>
        <MobileBottomNav />
      </ToastProvider>
    </BusinessProvider>
  );
}
