// Thin wrapper around your WhatsApp provider (Interakt / Gupshup / Twilio).
// Keeping it behind one function means swapping providers later only
// touches this file, not every place that sends a message.

interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  toPhone: string,
  templateName: string,
  params: Record<string, string>
): Promise<SendResult> {
  const apiKey = process.env.WHATSAPP_PROVIDER_API_KEY;
  const baseUrl = process.env.WHATSAPP_PROVIDER_BASE_URL;

  if (!apiKey || !baseUrl) {
    console.warn("WhatsApp provider not configured — message not sent:", {
      toPhone,
      templateName,
      params,
    });
    return { success: false, error: "provider_not_configured" };
  }

  try {
    // Example shape for Interakt-style APIs. Adjust the body to match
    // whichever provider you sign up with — the request/response format
    // differs slightly between Interakt, Gupshup, and Twilio.
    const res = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: toPhone,
        template: templateName,
        params,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `provider_error_${res.status}` };
    }
    const data = await res.json();
    return { success: true, providerMessageId: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Pre-built templates for the two automated flows the spec calls for.
export const templates = {
  feeReminder: (memberName: string, amount: number, dueDate: string, paymentLink?: string) => ({
    templateName: "fee_reminder",
    params: {
      member_name: memberName,
      amount: String(amount),
      due_date: dueDate,
      payment_link: paymentLink ?? "",
    },
  }),
  broadcast: (text: string) => ({
    templateName: "broadcast_update",
    params: { text },
  }),
};
