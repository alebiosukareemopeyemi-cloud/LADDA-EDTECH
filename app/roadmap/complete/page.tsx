"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Passport from "@/components/Passport";
import QrCode from "@/components/credential/QrCode";
import { issueMyCredential } from "@/lib/api/client";
import { envelope, VerifyResponseSchema, type VerifyResponse } from "@/lib/contract";

type Load =
  | { kind: "loading" }
  | { kind: "notyet"; message: string }
  | { kind: "error" }
  | { kind: "ready"; id: string; data: VerifyResponse };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function CompletePage() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    (async () => {
      const issued = await issueMyCredential();
      if (!alive) return;
      if (!issued.ok) {
        // 409 means the path is not finished: say what is left.
        return setLoad(issued.code === "VALIDATION" && /^Verify \d+ more/.test(issued.message)
          ? { kind: "notyet", message: issued.message }
          : { kind: "error" });
      }
      try {
        const r = await fetch(`/api/verify/${encodeURIComponent(issued.data.credentialId)}`);
        const parsed = envelope(VerifyResponseSchema).safeParse(await r.json());
        if (!alive) return;
        if (!parsed.success || !parsed.data.ok) return setLoad({ kind: "error" });
        setLoad({ kind: "ready", id: issued.data.credentialId, data: parsed.data.data });
      } catch {
        if (alive) setLoad({ kind: "error" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);

  // The public link. NEXT_PUBLIC_SITE_URL wins so a printed QR points at the real site.
  useEffect(() => {
    if (load.kind !== "ready") return;
    const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
    setLink(`${base}/verify/${load.id}`);
  }, [load]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  if (load.kind === "loading") {
    return (
      <main id="main" className="mx-auto max-w-5xl px-4 py-10 md:px-10" aria-busy="true">
        <p className="sr-only">Preparing your credential</p>
        <div className="skeleton h-12 w-2/3 rounded-full" />
        <div className="skeleton mt-8 h-[560px] rounded-[6px]" />
      </main>
    );
  }

  if (load.kind === "notyet") {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">Not quite there yet</h1>
        <p className="measure mt-4 text-lg text-text-soft">{load.message}</p>
        <Link href="/roadmap" className="btn btn-primary mt-8">
          Back to your roadmap
        </Link>
      </main>
    );
  }

  if (load.kind === "error") {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">We could not issue your credential</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          Check your connection and try again. Your verified skills are safe.
        </p>
        <button type="button" className="btn btn-primary mt-8" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </button>
      </main>
    );
  }

  const { data, id } = load;
  const p = data.payload;
  const passport = (
    <Passport
      nameAs="p"
      name={p.candidateName}
      university={p.university}
      track={p.roleTitle}
      hours={p.verifiedHours ?? null}
      projects={p.skills.length}
      issued={fmt(p.issuedAt)}
      issuedIso={p.issuedAt}
      id={p.id}
      summary={data.summary}
      signature={data.signature}
    />
  );

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 pb-20 pt-8 md:px-10">
      <h1 className="display-md">Your credential is ready</h1>
      <p className="measure mt-3 text-lg text-text-soft">
        Every skill on your path is verified. Share the link or the QR code. Anyone can check it without an account.
      </p>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {passport}

        <div className="space-y-8">
          <section aria-labelledby="share-title">
            <h2 id="share-title" className="font-display text-3xl font-bold leading-none">
              Share it
            </h2>
            <label htmlFor="verify-link" className="mt-4 block text-sm font-medium">
              Verify link
            </label>
            <input id="verify-link" readOnly className="field data mt-2" value={link} onFocus={(e) => e.currentTarget.select()} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={copy} disabled={!link}>
                Copy verify link
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                Download as PDF
              </button>
            </div>
            <p role="status" className="mt-2 min-h-6 text-sm">
              {copied === "done" && <span className="font-medium text-volt">Link copied.</span>}
              {copied === "failed" && <span className="font-medium text-ember">Copying was blocked. Select the link above and copy it.</span>}
              {copied === "idle" && <span className="text-text-mute">To save a PDF, choose Save as PDF in the print window.</span>}
            </p>
          </section>

          <section aria-labelledby="qr-title" className="flex items-center gap-5">
            {link && <QrCode value={link} label={`QR code for ${link}`} />}
            <div>
              <h2 id="qr-title" className="font-display text-2xl font-semibold leading-none">
                Scan to check
              </h2>
              <p className="mt-2 text-text-soft">Opens the public page for credential {id}.</p>
              <Link href={`/verify/${id}`} className="mt-3 inline-block underline underline-offset-4">
                Open the public page
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Print only: the passport and its QR code, and nothing else. */}
      {mounted &&
        link &&
        createPortal(
          <div className="print-only">
            <div className="print-sheet">
              {passport}
              <div className="print-qr">
                <QrCode value={link} label={`QR code for ${link}`} size={150} />
                <p>
                  Scan to check this credential, or open <span className="data">{link}</span>
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
