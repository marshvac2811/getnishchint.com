"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  vertical: string;
}

interface BusinessContextValue {
  business: Business | null;
  businesses: Business[];
  loading: boolean;
  switchBusiness: (id: string) => void;
}

const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  businesses: [],
  loading: true,
  switchBusiness: () => {},
});

export function useBusiness() {
  return useContext(BusinessContext);
}

const LAST_BUSINESS_KEY = "batchmate:lastBusinessId";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((data: Business[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBusinesses(data);
          const lastId = typeof window !== "undefined" ? localStorage.getItem(LAST_BUSINESS_KEY) : null;
          const match = data.find((b) => b.id === lastId);
          setBusiness(match ?? data[0]);
        } else {
          router.push("/onboarding");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  function switchBusiness(id: string) {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setBusiness(found);
      if (typeof window !== "undefined") localStorage.setItem(LAST_BUSINESS_KEY, id);
    }
  }

  return (
    <BusinessContext.Provider value={{ business, businesses, loading, switchBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}
