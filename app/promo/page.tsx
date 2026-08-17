import Image from "next/image";
import Link from "next/link";
import { Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"] });

const VERTICALS = [
  { label: "Play Schools", src: "/promo/promo-playschool.jpg" },
  { label: "Gyms", src: "/promo/promo-gym.jpg" },
  { label: "Dance Studios", src: "/promo/promo-dance.jpg" },
  { label: "Yoga & Fitness", src: "/promo/promo-yoga.jpg" },
];

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
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#7FBFAE]">
                <Image src={v.src} alt={v.label} width={64} height={64} className="w-full h-full object-cover" />
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

        <div className="bg-white rounded-2xl p-6 border border-[#E4E9E6] text-center mb-3">
          <p className={`${sora.className} text-4xl font-extrabold text-[#1F5C4F] mb-1`}>
            &#8377;2,000<span className="text-base font-semibold text-[#5C7A6C]">/month</span>
          </p>
          <p className="text-sm text-[#5C7A6C] mb-4">Flat. Unlimited members, unlimited batches.</p>
          <div className="bg-[#F2A93B]/10 rounded-xl px-4 py-3 inline-block">
            <p className="text-xs text-[#8A6412] font-medium">
              Example: with 100 members, that&apos;s just &#8377;20 per child, per month
            </p>
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
