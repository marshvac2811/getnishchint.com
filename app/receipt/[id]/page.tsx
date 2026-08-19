import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: fee } = await admin
    .from("fees")
    .select(`
      id, cycle_start, due_date, amount, penalty_per_day, status, paid_date, payment_method, receipt_no,
      business_id,
      businesses (name, contact_phone, upi_id, address),
      members (name, guardian_name, guardian_phone, batches (name))
    `)
    .eq("id", id)
    .single();

  if (!fee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAF8]">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <p className="text-coral font-medium text-lg mb-2">Receipt Not Found</p>
          <p className="text-sm text-[#5C7A6C] mb-6">The requested fee receipt does not exist or has expired.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const business = (fee as any).businesses;
  const member = (fee as any).members;
  const batch = member?.batches;

  const receiptNo = fee.receipt_no || `BM-${fee.id.substring(0, 8).toUpperCase()}`;
  const paymentDate = fee.paid_date ? new Date(fee.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN");
  const cycleStartFormatted = new Date(fee.cycle_start).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const penalty = (fee.penalty_per_day || 0);
  const totalAmount = Number(fee.amount);

  return (
    <div className="min-h-screen bg-[#F8FAF8] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Action bar (hidden in print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/m/${member?.access_token || ""}`} className="text-sm font-medium text-teal hover:underline flex items-center gap-1">
            &larr; Back to Member Portal
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>

        {/* Printable Receipt Card */}
        <div className="bg-white border border-[#E2ECE5] rounded-2xl p-8 shadow-sm print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="border-b border-[#E2ECE5] pb-6 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-teal">{business?.name || "Academy"}</h1>
              {business?.address && (
                <p className="text-xs text-[#5C7A6C] mt-1 max-w-sm">{business.address}</p>
              )}
              {business?.contact_phone && (
                <p className="text-xs text-[#5C7A6C]">Phone: +91 {business.contact_phone}</p>
              )}
              {business?.upi_id && (
                <p className="text-xs text-[#5C7A6C]">UPI ID: {business.upi_id}</p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-[#EEF4EC] text-teal text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                Fee Receipt
              </span>
              <p className="text-sm font-semibold text-gray-800">#{receiptNo}</p>
              <p className="text-xs text-[#5C7A6C]">Date: {paymentDate}</p>
            </div>
          </div>

          {/* Student & Bill Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#F8FAF8] p-4 rounded-xl border border-[#EEF4EC]">
              <p className="text-xs font-semibold text-[#5C7A6C] uppercase tracking-wider mb-2">Student Information</p>
              <p className="text-base font-bold text-gray-900">{member?.name}</p>
              {member?.guardian_name && (
                <p className="text-xs text-[#5C7A6C] mt-0.5">Guardian: {member.guardian_name}</p>
              )}
              {member?.guardian_phone && (
                <p className="text-xs text-[#5C7A6C]">Contact: +91 {member.guardian_phone}</p>
              )}
              {batch?.name && (
                <p className="text-xs text-teal font-medium mt-1">Batch: {batch.name}</p>
              )}
            </div>

            <div className="bg-[#F8FAF8] p-4 rounded-xl border border-[#EEF4EC]">
              <p className="text-xs font-semibold text-[#5C7A6C] uppercase tracking-wider mb-2">Payment Details</p>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#5C7A6C]">Status:</span>
                <span className={`font-semibold capitalize ${fee.status === "paid" ? "text-teal" : "text-coral"}`}>
                  {fee.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#5C7A6C]">Billing Cycle:</span>
                <span className="font-medium text-gray-800">{cycleStartFormatted}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#5C7A6C]">Payment Method:</span>
                <span className="font-medium text-gray-800 uppercase">{fee.payment_method || "Online / UPI"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5C7A6C]">Due Date:</span>
                <span className="font-medium text-gray-800">{new Date(fee.due_date).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#E2ECE5] rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EEF4EC] text-xs font-semibold text-[#5C7A6C] uppercase tracking-wider border-b border-[#E2ECE5]">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Period</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECE5]">
                <tr>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-gray-900">Tuition & Class Fee</p>
                    <p className="text-xs text-[#5C7A6C]">{batch?.name || "Regular Batch"}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-gray-700">{cycleStartFormatted}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-gray-900">₹{fee.amount}</td>
                </tr>
                {penalty > 0 && (
                  <tr>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-coral">Late Payment Fee</p>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-coral">Late surcharge</td>
                    <td className="py-3.5 px-4 text-right font-medium text-coral">₹{penalty}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-[#F8FAF8] border-t border-[#E2ECE5]">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 font-bold text-gray-900 text-right">
                    Total Paid
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal text-lg text-right">
                    ₹{totalAmount + penalty}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer & Authenticity seal */}
          <div className="pt-4 border-t border-dashed border-[#E2ECE5] flex flex-col sm:flex-row justify-between items-center text-xs text-[#5C7A6C] gap-3">
            <div>
              <p>This is a computer-generated digital receipt issued via <strong className="text-teal">BatchMate</strong>.</p>
              <p className="text-[11px] text-[#5C7A6C]/70 mt-0.5">Receipt ID: {fee.id}</p>
            </div>
            <div className="text-center sm:text-right">
              <span className="inline-block border border-teal/40 bg-teal/5 text-teal px-3 py-1 rounded-md text-[11px] font-semibold">
                ✓ VERIFIED PAYMENT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
