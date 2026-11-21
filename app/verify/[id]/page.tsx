"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { verifyAsync } from "@noble/ed25519";
import { Check, ExternalLink, ShieldAlert, ShieldCheck, ShieldX, X } from "lucide-react";
import Passport, { type PassportStatus } from "@/components/Passport";
import VerifyLookup from "@/components/credential/VerifyLookup";
import {
  envelope,
  VerifyResponseSchema,
  type CredentialPayload,
  type VerifyResponse,
} from "@/lib/contract";
import { base64ToBytes, payloadBytes } from "@/lib/credential/encoding";

type Load =
  | { kind: "loading" }
  | { kind: "ready"; data: VerifyResponse }
  | { kind: "notfound" }
  | { kind: "error" };
type Check = "idle" | "checking" | "valid" | "invalid";

// Tamper test: change one number after signing, then re-check the ORIGINAL signature.
function tamper(p: CredentialPayload): CredentialPayload {
  const copy: CredentialPayload = JSON.parse(JSON.stringify(p));
  if (typeof copy.verifiedHours === "number") {
    copy.verifiedHours = copy.verifiedHours * 10;
    return copy;
  }
  const last = copy.skills[copy.skills.length - 1];
  if (last) last.overall = Math.min(99, last.overall + 10);
  return copy;
}

const LOOK: Record<PassportStatus, { word: string; color: string; Icon: typeof ShieldCheck }> = {
  valid: { word: "Valid", color: "text-volt", Icon: ShieldCheck },
  invalid: { word: "Invalid", color: "text-ember", Icon: ShieldX },
  revoked: { word: "Revoked", color: "text-kola", Icon: ShieldAlert },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="contour flex min-h-dvh flex-col">
      <header className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4 md:px-10">
        <Link href="/" className="font-display text-[1.75rem] font-bold leading-none">
          Ladda
        </Link>
        <Link href="/verify" className="nav-link">
          Check another
        </Link>
      </header>
      {children}
    </div>
  );
}

export default function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [tampered, setTampered] = useState(false);
  const [check, setCheck] = useState<Check>("idle");

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    fetch(`/api/verify/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) return alive && setLoad({ kind: "notfound" });
        const parsed = envelope(VerifyResponseSchema).safeParse(await r.json());
        if (!alive) return;
        if (!parsed.success || !parsed.data.ok) setLoad({ kind: "error" });
        else setLoad({ kind: "ready", data: parsed.data.data });
      })
      .catch(() => alive && setLoad({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [id, attempt]);

  async function runCheck(data: VerifyResponse, payload: CredentialPayload) {
    setCheck("checking");
    try {
      const ok = await verifyAsync(
        base64ToBytes(data.signature),
        payloadBytes(payload),
        base64ToBytes(data.publicKey)
      );
      setCheck(ok ? "valid" : "invalid");
    } catch {
      setCheck("invalid");
    }
  }

  if (load.kind === "loading") {
    return (
      <Shell>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-10" aria-busy="true">
          <p className="sr-only">Loading the credential</p>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="skeleton h-[640px] rounded-[6px]" />
            <div className="space-y-4">
              <div className="skeleton h-24 w-3/4 rounded-[1.25rem]" />
              <div className="skeleton h-16 rounded-[1.25rem]" />
              <div className="skeleton h-12 w-2/3 rounded-full" />
            </div>
          </div>
        </main>
      </Shell>
    );
  }

  if (load.kind === "notfound") {
    return (
      <Shell>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:px-10 md:pt-12">
          <h1 className="display-md max-w-[16ch]">No credential with that ID</h1>
          <p className="measure mt-4 text-lg text-text-soft">
            We could not find <span className="data">{id}</span>. Check the ID for typos, or ask the candidate to send the
            link again. Sample IDs look like demo-001.
          </p>
          <div className="mt-8">
            <VerifyLookup initial={id} />
          </div>
        </main>
      </Shell>
    );
  }

  if (load.kind === "error") {
    return (
      <Shell>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:px-10 md:pt-12">
          <h1 className="display-md max-w-[16ch]">The check did not load</h1>
          <p className="measure mt-4 text-lg text-text-soft">
            Your connection may have dropped. Check it and try again. The credential itself is not affected.
          </p>
          <button type="button" className="btn btn-primary mt-8" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </main>
      </Shell>
    );
  }

  const { data } = load;
  const shown = tampered ? tamper(data.payload) : data.payload;
  const status: PassportStatus =
    data.status === "revoked" ? "revoked" : check === "invalid" ? "invalid" : "valid";
  const { word, color, Icon } = LOOK[status];
  const signedHours = data.payload.verifiedHours;
  const baseHours = signedHours ?? 96;

  const explanation =
    status === "valid"
      ? "Issued by Ladda and not changed since. The signature matches every field on this page."
      : status === "revoked"
        ? "Ladda has withdrawn this credential. Ask the candidate for a current one."
        : tampered
          ? `The hours on this page (${shown.verifiedHours ?? "changed"}) are not what Ladda signed (${signedHours ?? "original"}). The signature fails, so do not trust this record.`
          : "The signature does not match this record, so something changed after Ladda signed it. Do not trust it.";

  return (
    <Shell>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Passport
            nameAs="h1"
            name={shown.candidateName}
            university={shown.university}
            track={shown.roleTitle}
            hours={shown.verifiedHours ?? null}
            projects={shown.skills.length}
            issued={new Date(shown.issuedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
            issuedIso={shown.issuedAt}
            id={shown.id}
            summary={data.summary}
            signature={data.signature}
            status={status}
          />

          <div className="lg:sticky lg:top-8">
            <div role="status" aria-live="polite">
              <div className="flex items-center gap-4">
                <Icon className={`size-14 shrink-0 ${color}`} aria-hidden="true" />
                <p className={`font-display text-[clamp(4rem,12vw,5.75rem)] font-bold leading-[0.9] ${color}`}>
                  {check === "checking" ? "Checking" : word}
                </p>
              </div>
              <p className="mt-4 max-w-[44ch] text-lg text-text-soft">
                {check === "checking" ? "Checking the signature in your browser." : explanation}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={check === "checking"}
                onClick={() => runCheck(data, shown)}
              >
                Check it in your browser
              </button>
              {!tampered ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setTampered(true);
                    void runCheck(data, tamper(data.payload));
                  }}
                >
                  Try the tamper test
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setTampered(false);
                    setCheck("idle");
                  }}
                >
                  Undo the tamper test
                </button>
              )}
            </div>

            <div className="mt-8">
              <p className="text-sm text-text-mute">Change one number and the signature stops matching.</p>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                <li className="flex items-center justify-between gap-4 py-3">
                  <span className="text-text-soft">As issued</span>
                  <span className="data">{baseHours}h</span>
                  <span className="flex items-center gap-1.5 font-medium text-volt">
                    <Check className="size-4" aria-hidden="true" /> Signature matches
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4 py-3">
                  <span className="text-text-soft">Edited by hand</span>
                  <span className="data">{baseHours * 10}h</span>
                  <span className="flex items-center gap-1.5 font-medium text-ember">
                    <X className="size-4" aria-hidden="true" /> Signature fails
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <section aria-labelledby="skills-heading" className="mt-14 max-w-3xl">
          <h2 id="skills-heading" className="font-display text-4xl font-bold leading-none">
            Verified skills
          </h2>
          <p className="mt-2 text-text-mute">Open a skill to see its scores, repo and commit.</p>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {shown.skills.map((s) => (
              <details key={s.skillId} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[0.5rem]">
                  <span>
                    <span className="block text-lg font-semibold">{s.skillName}</span>
                    <span className="text-sm text-text-mute">{s.taskTitle}</span>
                  </span>
                  <span className="data text-xl font-semibold">{s.overall}</span>
                </summary>
                <div className="mt-4 space-y-2">
                  {Object.entries(s.scores).map(([name, v]) => (
                    <p key={name} className="flex justify-between gap-4 text-sm text-text-soft">
                      <span>{name}</span>
                      <span className="data">{v}</span>
                    </p>
                  ))}
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-text-mute">
                    <a
                      href={s.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4"
                    >
                      Open the repo <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                    <span>
                      Commit <span className="data">{s.commitHash}</span>
                    </span>
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-10">
        <p className="measure text-sm text-text-mute">
          The signature proves Ladda issued this record and that it was not changed afterwards. It does not prove the
          review was perfect, which is why the repo and commit behind every score are open for you to inspect. This is a
          sample credential made for the demo.
        </p>
      </footer>
    </Shell>
  );
}
