"use client";
import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "Welcome to GetNishChint",
    body: "This is a quick tour of the main things you'll use every day. Takes about a minute.",
  },
  {
    title: "Members",
    body: "Add your students or members here. Each one gets a private link you copy and send them on WhatsApp \u2014 no login needed for them.",
  },
  {
    title: "Attendance",
    body: "Mark who showed up each day. Members see their own attendance percentage through their private link.",
  },
  {
    title: "Fees",
    body: "Fees are created automatically based on the due day you set per batch. Overdue fees calculate a late penalty automatically, if you've set one.",
  },
  {
    title: "Broadcast",
    body: "Send a WhatsApp update to everyone at once, or just one batch \u2014 useful for holiday notices or reminders.",
  },
  {
    title: "Settings",
    body: "Add your UPI ID here so members can pay fees directly to you. You can also send us feedback anytime from this tab.",
  },
];

const STORAGE_KEY = "nishchint:tourSeen";

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : "1";
    if (!seen) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setEntered(false);
    const t = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(t);
  }, [step, visible]);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full transition-all duration-200"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
        }}
      >
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-teal" : "bg-[#EEF4EC]"
              }`}
            />
          ))}
        </div>

        <h2 className="text-lg font-bold mb-2">{current.title}</h2>
        <p className="text-sm text-[#4B6459] mb-6 leading-relaxed">{current.body}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={close}
            className="text-sm text-[#5C7A6C] font-medium"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={back}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#EEF4EC] text-teal"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-teal text-white"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
