"use client";
import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/context/business";

interface Batch { id: string; name: string; }
interface MessageLog { id: string; message_text: string; batch_id: string | null; sent_at: string; }

export default function BroadcastPage() {
  const { business } = useBusiness();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<MessageLog[]>([]);

  useEffect(() => {
    if (!business) return;
    fetch(`/api/batches?business_id=${business.id}`).then((r) => r.json()).then(setBatches);
    loadHistory();
  }, [business]);

  function loadHistory() {
    if (!business) return;
    fetch(`/api/messages/send?business_id=${business.id}`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setHistory(data);
    });
  }

  async function send() {
    if (!text.trim() || !business) return;
    setSending(true);
    setResult("");
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id, batch_id: batchId || undefined, message_text: text }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`Sent to ${data.sent} of ${data.recipients} guardians.`);
      setText("");
      loadHistory();
    } else {
      setResult(data.error ?? "Something went wrong.");
    }
  }

  function batchName(id: string | null) {
    if (!id) return "Everyone";
    return batches.find((b) => b.id === id)?.name ?? "Batch";
  }

  return (
    <main className="max-w-lg mx-auto px-6 pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-4">Broadcast</h1>

      <div className="bg-white rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Send a WhatsApp message</p>
        <select className="w-full rounded-lg border px-3 py-2 mb-2" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Everyone</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name} only</option>
          ))}
        </select>
        <textarea
          className="w-full rounded-lg border px-3 py-2 mb-3 h-24"
          placeholder="Write your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {result && <p className="text-sm text-[#5C7A6C] mb-2">{result}</p>}
        <button onClick={send} disabled={sending || !text.trim()} className="w-full bg-teal text-white rounded-lg py-2 font-medium disabled:opacity-60">
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      <p className="text-sm font-semibold mb-2">Recent broadcasts</p>
      <div className="space-y-2">
        {history.length === 0 && <p className="text-sm text-[#5C7A6C]">No broadcasts sent yet.</p>}
        {history.map((h) => (
          <div key={h.id} className="bg-white rounded-xl px-4 py-3">
            <p className="text-sm">{h.message_text}</p>
            <p className="text-xs text-[#5C7A6C] mt-1">{batchName(h.batch_id)} - {new Date(h.sent_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
