"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verifyAsync } from "@noble/ed25519";
import { envelope, VerifyResponseSchema, type VerifyResponse } from "@/lib/contract";
import { base64ToBytes, payloadBytes } from "@/lib/credential/encoding";
import { NODE_EXPRESS } from "@/lib/demo";
import { usePlay } from "@/lib/motion";
import NarratorCard from "./NarratorCard";
import Spotlight from "./Spotlight";
import { CredentialScene, CvScene, EmployerScene, ProjectScene, TrailScene, type ReviewProgress, type Verdict } from "./scenes";
import { STEPS } from "./steps";
import { useTargetRect } from "./useTargetRect";
import { useTour } from "./useTour";

const SEGMENTS = STEPS.length;
const REVIEW_STEP_MS = 700;

export default function TourApp() {
  const play = usePlay();
  const tour = useTour(SEGMENTS, (i) => STEPS[i].seconds);
  const step = STEPS[tour.index];

  const rect = useTargetRect(step.target, tour.open, step.id);
  const [card, setCard] = useState<DOMRect | null>(null);
  const restartRef = useRef<HTMLButtonElement>(null);

  /* Step 4: the simulated review. Nothing is sent anywhere. */
  const [repo, setRepo] = useState("");
  const [repoError, setRepoError] = useState(false);
  const [review, setReview] = useState<ReviewProgress>({ status: "idle", resolved: 0 });
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const total = NODE_EXPRESS.checks.length;
  function runReview() {
    let ok = false;
    try {
      const u = new URL(repo.trim());
      ok = u.protocol === "https:" || u.protocol === "http:";
    } catch {}
    setRepoError(!ok);
    if (!ok) return;
    clearTimers();
    if (!play) {
      setReview({ status: "done", resolved: total });
      return;
    }
    setReview({ status: "running", resolved: 0 });
    for (let i = 1; i <= total; i++) {
      timers.current.push(
        window.setTimeout(
          () => setReview({ status: i === total ? "done" : "running", resolved: i }),
          i * REVIEW_STEP_MS
        )
      );
    }
  }
  const failed = NODE_EXPRESS.checks.filter((c) => c.result === "fail").length;

  /* Step 7: the real signature check, in the browser. */
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [hours, setHours] = useState("96");
  const [hoursError, setHoursError] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>("loading");

  const verify = useCallback(async (value: string, d: VerifyResponse) => {
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n)) {
      setHoursError(true);
      return;
    }
    setHoursError(false);
    try {
      const ok = await verifyAsync(
        base64ToBytes(d.signature),
        payloadBytes({ ...d.payload, verifiedHours: n }),
        base64ToBytes(d.publicKey)
      );
      setVerdict(ok ? "valid" : "invalid");
    } catch {
      setVerdict("invalid");
    }
  }, []);

  // Load the signed sample once, then check it as issued.
  useEffect(() => {
    let alive = true;
    fetch("/api/verify/demo-001")
      .then((r) => r.json())
      .then((json) => {
        const parsed = envelope(VerifyResponseSchema).safeParse(json);
        if (!alive) return;
        if (!parsed.success || !parsed.data.ok) return setVerdict("error");
        setData(parsed.data.data);
        void verify("96", parsed.data.data);
      })
      .catch(() => alive && setVerdict("error"));
    return () => {
      alive = false;
    };
  }, [verify]);

  /* Keep Tab inside the tour (top bar and card) while it is open. */
  useEffect(() => {
    if (!tour.open) return;
    const selector =
      '[data-tour-ui] a[href], [data-tour-ui] button:not([disabled]), [data-tour-ui] input, [data-tour-ui] [tabindex="0"]';
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && items.includes(active);
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tour.open]);

  // When the tour closes, hand focus to "Restart tour".
  const wasOpen = useRef(true);
  useEffect(() => {
    if (wasOpen.current && !tour.open) restartRef.current?.focus();
    wasOpen.current = tour.open;
  }, [tour.open]);

  const scene =
    step.id === "problem" || step.id === "roadmap" ? (
      <TrailScene key={step.id} />
    ) : step.id === "cv" ? (
      <CvScene />
    ) : step.id === "project" ? (
      <ProjectScene mode="project" review={review} />
    ) : step.id === "feedback" ? (
      <ProjectScene mode="feedback" review={review} />
    ) : step.id === "credential" ? (
      <CredentialScene />
    ) : (
      <EmployerScene hours={hours} verdict={verdict} />
    );

  const interactive =
    step.id === "project" ? (
      <div data-tour-ui className="rounded-[0.75rem] border border-line bg-night/60 p-3" onFocus={() => tour.setBusy(true)}>
        <label htmlFor="tour-repo" className="text-sm font-medium">
          Repo link
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="tour-repo"
            className="field min-w-0 flex-1"
            value={repo}
            onChange={(e) => {
              setRepo(e.target.value);
              if (repoError) setRepoError(false);
            }}
            placeholder="https://github.com/your-name/notes-api"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={repoError}
            aria-describedby="tour-repo-hint"
          />
          <button type="button" className="btn btn-secondary" onClick={runReview} disabled={review.status === "running"}>
            Run simulated review
          </button>
        </div>
        <p id="tour-repo-hint" className={`mt-2 text-sm ${repoError ? "font-medium text-ember" : "text-text-mute"}`}>
          {repoError ? "Enter a full link that starts with https://." : "Simulation: no repo is fetched, and the result is the same for any link."}
        </p>
        {review.status === "done" && (
          <p role="status" className="mt-2 text-sm font-medium text-text">
            Simulated result: {total - failed} of {total} checks passed. {failed} needs work.
          </p>
        )}
      </div>
    ) : step.id === "employer" ? (
      <div data-tour-ui className="rounded-[0.75rem] border border-line bg-night/60 p-3" onFocus={() => tour.setBusy(true)}>
        <label htmlFor="tour-hours" className="text-sm font-medium">
          Verified hours on the passport
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="tour-hours"
            className="field data min-w-0 flex-1"
            inputMode="numeric"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value);
              if (hoursError) setHoursError(false);
            }}
            aria-invalid={hoursError}
            aria-describedby="tour-hours-hint"
          />
          <button type="button" className="btn btn-secondary" disabled={!data} onClick={() => data && verify(hours, data)}>
            Check signature
          </button>
        </div>
        <p id="tour-hours-hint" className={`mt-2 text-sm ${hoursError ? "font-medium text-ember" : "text-text-mute"}`}>
          {hoursError ? "Enter a number of hours." : "The check runs in your browser. Nothing is saved."}
        </p>
        <button
          type="button"
          className="btn btn-ghost mt-1 !min-h-10 !px-4 !text-sm"
          disabled={!data}
          onClick={() => {
            setHours("96");
            if (data) void verify("96", data);
          }}
        >
          Put back 96
        </button>
      </div>
    ) : null;

  return (
    <>
      {/* Top bar */}
      <header data-tour-ui className="fixed inset-x-0 top-0 z-[70] border-b border-line bg-night">
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
          <span className="font-display text-2xl font-bold leading-none">Ladda tour</span>
          <div className="flex items-center gap-1">
            {tour.open ? (
              <>
                <button type="button" onClick={tour.togglePause} className="btn btn-ghost !min-h-10 !px-4 !text-sm">
                  {tour.paused ? "Resume" : "Pause"}
                </button>
                <button type="button" onClick={tour.skip} className="btn btn-ghost !min-h-10 !px-4 !text-sm">
                  Skip tour
                </button>
                <button type="button" onClick={tour.restart} className="btn btn-ghost hidden !min-h-10 !px-4 !text-sm sm:inline-flex">
                  Restart tour
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="btn btn-ghost !min-h-10 !px-4 !text-sm">
                  Back to home
                </Link>
                <button ref={restartRef} type="button" onClick={tour.restart} className="btn btn-secondary !min-h-10 !px-4 !text-sm">
                  Restart tour
                </button>
              </>
            )}
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Tour progress"
          aria-valuemin={1}
          aria-valuemax={SEGMENTS}
          aria-valuenow={tour.index + 1}
          className="flex h-1 gap-1 px-4 md:px-8"
        >
          {STEPS.map((s, i) => (
            <span key={s.id} className="h-full flex-1 rounded-full" style={{ background: i <= tour.index ? "#BEF264" : "#16301F" }} />
          ))}
        </div>
      </header>

      <main id="main" className="min-h-dvh bg-night pb-[60dvh] pt-[3.75rem] md:pb-24">
        <h1 className="sr-only">Ladda judge tour</h1>
        <div inert={tour.open}>{scene}</div>
      </main>

      {tour.open && (
        <>
          <Spotlight rect={rect} card={card} />
          <NarratorCard
            step={step}
            index={tour.index}
            total={SEGMENTS}
            rect={rect}
            paused={tour.paused}
            isFirst={tour.isFirst}
            isLast={tour.isLast}
            onNext={tour.next}
            onBack={tour.back}
            onSkip={tour.skip}
            onTogglePause={tour.togglePause}
            onMeasure={setCard}
          >
            {interactive}
          </NarratorCard>
        </>
      )}

      <footer className="fixed left-3 top-[4.4rem] z-[66] max-w-[calc(100vw-1.5rem)] rounded-full border border-line bg-night/90 px-4 py-2 text-sm text-text-soft md:bottom-4 md:left-4 md:top-auto">
        Judge mode. Sample data, nothing here is saved.
      </footer>
    </>
  );
}
