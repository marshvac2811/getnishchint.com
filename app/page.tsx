import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="max-w-md mx-auto pt-16 px-6 pb-16 text-center">
      <Image src="/logo.png" alt="Nishchint" width={280} height={80} className="h-16 w-auto mx-auto mb-3" priority />
      <p className="text-[#4B6459] mb-10">Attendance, fee reminders and parent updates for local classes and studios.</p>

      <div className="space-y-4 text-left">
        <div className="bg-white rounded-xl p-5">
          <p className="font-semibold mb-1">I run the platform</p>
          <p className="text-sm text-[#5C7A6C] mb-3">See every business, manage clients and trials.</p>
          <Link href="/admin" className="block text-center bg-teal text-white rounded-lg py-2.5 font-medium">
            Go to Admin
          </Link>
        </div>

        <div className="bg-white rounded-xl p-5">
          <p className="font-semibold mb-1">I run a business here</p>
          <p className="text-sm text-[#5C7A6C] mb-3">Manage attendance, members, fees and broadcasts.</p>
          <Link href="/login" className="block text-center bg-teal text-white rounded-lg py-2.5 font-medium">
            Sign in
          </Link>
        </div>

        <div className="bg-white rounded-xl p-5">
          <p className="font-semibold mb-1">Member / Guardian</p>
          <p className="text-sm text-[#5C7A6C]">
            You don't need to sign in here. Use the private link sent to you on WhatsApp to view attendance, fees, and pay directly.
          </p>
        </div>
      </div>
    </main>
  );
}
