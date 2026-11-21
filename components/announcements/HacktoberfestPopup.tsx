"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { opportunities, getStatus } from "@/content/opportunities";
import { useModal } from "@/lib/use-modal";

const OPPORTUNITY_ID = "aws-hacktoberfest";
const STORAGE_KEY = "ladda:hacktoberfest-popup-dismissed";

// A one-time notice while the event is still running.
export default function HacktoberfestPopup() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const lookRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const o = opportunities.find((x) => x.id === OPPORTUNITY_ID);

  // Show once, only while the event is still running.
  useEffect(() => {
    if (!o) return;
    if (getStatus(o) === "closed") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [o]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }

  function lookInto() {
    dismiss();
    router.push(`/opportunities/${OPPORTUNITY_ID}`);
  }

  // Focus trap, Escape, scroll lock, and focus back to where the person was.
  useModal(open, dialogRef, { onClose: dismiss });

  if (!o || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={dismiss} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hacktoberfest-title"
        className="surface-raised relative w-full max-w-md p-8"
      >
        <p className="text-sm font-semibold text-volt">AWS Hacktoberfest is live</p>
        <h2 id="hacktoberfest-title" className="mt-2 font-display text-4xl font-bold leading-none">
          Check it out now
        </h2>
        <p className="mt-3 text-text-soft">{o.blurb}</p>
        <p className="mt-4 text-sm text-text-mute">
          <span className="font-medium text-text-soft">{o.prize}</span>. {o.dateLabel}.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button ref={lookRef} type="button" onClick={lookInto} className="btn btn-primary">
            Look into it
          </button>
          <button type="button" onClick={dismiss} className="btn btn-secondary">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
