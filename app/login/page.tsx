"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function sendLink() {
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="max-w-sm mx-auto pt-20 px-6">
      <h1 className="text-2xl font-bold mb-1">Sign in</h1>
      <p className="text-sm text-[#4B6459] mb-6">We will email you a login link.</p>

      {!sent ? (
        <>
          <input
            className="w-full rounded-lg border px-3 py-2 mb-3"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={sendLink} className="w-full bg-teal text-white rounded-lg py-2 font-medium">
            Send login link
          </button>
        </>
      ) : (
        <p className="text-sm text-[#4B6459]">Check your email and click the link to continue.</p>
      )}
      {error && <p className="text-coral text-sm mt-3">{error}</p>}
    </main>
  );
}
