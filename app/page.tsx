import Link from "next/link";
import Image from "next/image";
export default function Home() {
  return (
    <main className="max-w-md mx-auto pt-24 px-6 text-center">
      <Image src="/logo.png" alt="Nishchint" width={280} height={80} className="h-16 w-auto mx-auto mb-6" priority />
      <p className="text-[#4B6459] mb-8">Attendance, fee reminders and parent updates for local classes and studios.</p>
      <Link href="/login" className="inline-block bg-teal text-white rounded-lg px-6 py-3 font-medium">
        Sign in
      </Link>
    </main>
  );
}

