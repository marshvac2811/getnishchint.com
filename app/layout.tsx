import "./globals.css";

export const metadata = {
  title: "BatchMate — Attendance & Fees",
  description: "Attendance, fee reminders and parent updates for local classes and studios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#EEF4EC] text-[#16332B] min-h-screen">{children}</body>
    </html>
  );
}
