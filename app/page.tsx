import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-md mx-auto pt-24 px-6 text-center">
      <h1 className="text-3xl font-bold mb-3">BatchMate</h1>
      <p className="text-[#4B6459] mb-8">Attendance, fee reminders and parent updates for local classes and studios.</p>
      <Link href="/login" className="inline-block bg-teal text-white rounded-lg px-6 py-3 font-medium">
        Sign in
      </Link>
    </main>
  );
}
