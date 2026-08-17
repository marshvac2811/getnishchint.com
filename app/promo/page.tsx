import Image from "next/image";
import Link from "next/link";
import { Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"] });

const VERTICALS = [
  { label: "Play Schools", icon: "playschool" },
  { label: "Gyms", icon: "gym" },
  { label: "Dance & Yoga", icon: "dance" },
  { label: "Tuition & Coaching", icon: "tuition" },
] as const;

function VerticalIcon({ type }: { type: string }) {
  const stroke = "#F7F6F1";
  if (type === "playschool") {
    return (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <circle cx="24" cy="14" r="6" stroke={stroke} strokeWidth="2.5" />
        <path d="M10 40c0-8 6-13 14-13s14 5 14 13" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 30l4-4M42 30l-4-4" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "gym") {
    return (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <rect x="4" y="19" width="6" height="10" rx="1.5" stroke={stroke} strokeWidth="2.5" />
        <rect x="38" y="19" width="6" height="10" rx="1.5" stroke={stroke} strokeWidth="2.5" />
        <rect x="10" y="15" width="5" height="18" rx="1.5" stroke={stroke} strokeWidth="2.5" />
        <rect x="33" y="15" width="5" height="18" rx="1.5" stroke={stroke} strokeWidth="2.5" />
        <path d="M15 24h18" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "dance") {
    return (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <circle cx="24" cy="10" r="4" stroke={stroke} strokeWidth="2.5" />
        <path d="M24 14v14M24 28l-9 12M24 28l9 12M24 20l-10-4M24 20l10-4" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
      <path d="M8 14c6-3 12-3 16 0v22c-4-3-10-3-16 0V14z" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 14c-6-3-12-3-16 0v22c4-3 10-3 16 0V14z" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0 mt-0.5">
      <circle cx="10" cy="10" r="10" fill="#1F5C4F" />
      <path d="M6 10l2.5 2.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PromoPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F1]">
      {/* Hero */}
      <section className="bg-[#123832] px-6 pt-10 pb-14 text-center">
        <div className="bg-white/95 inline-block rounded-2xl px-5 py-3 mb-8">
          <Image src="/logo.png" alt="Nishchint" width={160} height={46} className="h-9 w-auto" priority />
        </div>

        <p className="text-[#7FBFAE] text-xs font-semibold tracking-widest uppercase mb-4">
          Play Schools &middot; Gyms &middot; Dance Studios &middot; Tuition Centres
        </p>

        <h1 className={`${sora.className} text-white text-[2rem] leading-[1.15] font-extrabold mb-4 max-w-sm mx-auto`}>
          Stop Chasing Fees.
          <br />
          Start Getting Paid On Time.
        </h1>

        <p className="text-[#C9E4DC] text-[15px] leading-relaxed max-w-xs mx-auto mb-10">
          One link tracks attendance, reminds parents automatically, and sends payments straight to your account.
        </p>

        <div className="flex justify-center gap-4 flex-wrap max-w-sm mx-auto">
          {VERTICALS.map((v) => (
            <div key={v.label} className="flex flex-col items-center gap-2 w-20">
              <div className="w-14 h-14 rounded-2xl bg-[#1F5C4F] border border-[#2E7A69] flex items-center justify-center">
                <VerticalIcon type={v.icon} />
              </div>
              <p className="text-[#C9E4DC] text-[11px] font-medium leading-tight">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-10 max-w-md mx-auto">
        <div className="space-y-4 mb-10">
          <div className="flex items-start gap-3">
            <CheckIcon />
            <p className="text-[15px] text-[#14302C]">Members mark attendance in two taps &mdash; no more paper registers</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckIcon />
            <p className="text-[15px] text-[#14302C]">Parents get automatic WhatsApp reminders before fees are due</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckIcon />
            <p className="text-[15px] text-[#14302C]">Payments go straight to your own bank account &mdash; every rupee</p>
          </div>
        </div>

        {/* Pricing */}
        <p className="text-[#5C7A6C] text-xs font-semibold tracking-widest uppercase text-center mb-4">Simple Pricing</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-2xl p-4 border border-[#E4E9E6]">
            <p className="text-xs font-semibold text-[#5C7A6C] mb-2">Pay as you grow</p>
            <p className={`${sora.className} text-2xl font-extrabold text-[#1F5C4F]`}>
              &#8377;20<span className="text-sm font-semibold text-[#5C7A6C]">/member</span>
            </p>
            <p className="text-xs text-[#5C7A6C] mt-1">per month, first 200 members</p>
          </div>
          <div className="bg-[#F2A93B]/10 rounded-2xl p-4 border border-[#F2A93B]/40">
            <p className="text-xs font-semibold text-[#8A6412] mb-2">Unlimited</p>
            <p className={`${sora.className} text-2xl font-extrabold text-[#8A6412]`}>
              &#8377;2,000<span className="text-sm font-semibold">/mo</span>
            </p>
            <p className="text-xs text-[#8A6412] mt-1">flat, unlimited members</p>
          </div>
        </div>

        <p className="text-center text-xs text-[#5C7A6C] mb-8">14 days free. No card required to start.</p>

        <Link
          href="/trial"
          className="block text-center bg-[#E85D42] text-white rounded-xl py-4 font-bold text-[15px] shadow-sm"
        >
          Start Your Free Trial &rarr;
        </Link>

        <div className="flex items-center justify-center gap-2 mt-10 opacity-70">
          <Image src="/logo.png" alt="Nishchint" width={90} height={26} className="h-5 w-auto" />
        </div>
      </section>
    </main>
  );
}
