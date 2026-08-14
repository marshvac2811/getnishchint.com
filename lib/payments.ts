// Creates a Razorpay Payment Link for a single fee. The link is what gets
// sent inside the WhatsApp reminder. Your Razorpay account is the one
// collecting the money — businesses never see or touch these API keys.

export async function createPaymentLink(
  amount: number,
  memberName: string,
  feeId: string
): Promise<string | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn("Razorpay not configured — skipping payment link creation");
    return null;
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      description: `Fee for ${memberName}`,
      reference_id: feeId,
      notify: { sms: false, email: false }, // we send our own WhatsApp reminder
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.short_url ?? null;
}
