"use client";

import type { ReactNode } from "react";
import { Check, Clock, ShieldCheck, ShieldX, Wrench } from "lucide-react";
import NodeMarker from "@/components/NodeMarker";
import Passport from "@/components/Passport";
import ContourBackdrop from "@/components/landing/ContourBackdrop";
import TrailMap from "@/components/landing/TrailMap";
import {
  CV_HOURS_SAVED,
  CV_LINES,
  CV_MATCHES,
  DEMO_CREDENTIALS,
  DEMO_LEARNER,
  DEMO_ROADMAP,
  NODE_EXPRESS,
} from "@/lib/demo";
import type { NodeState } from "@/lib/node-shapes";

function Frame({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <header className="mb-6">
        <p className="font-display text-4xl font-bold leading-none md:text-5xl">{title}</p>
        {note && <p className="mt-3 max-w-[60ch] text-text-mute">{note}</p>}
      </header>
      {children}
    </section>
  );
}

/* Steps 1 and 3: the trail */
export function TrailScene() {
  return (
    <Frame title={DEMO_LEARNER.track} note={`${DEMO_LEARNER.name}, ${DEMO_LEARNER.university}. Sample data.`}>
      <div
        data-tour="trail"
        className="contour relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-line sm:aspect-[16/10]"
      >
        <ContourBackdrop />
        <TrailMap dimOnMobile={false} />
      </div>
    </Frame>
  );
}

/* Step 2: the CV and the gap result */
export function CvScene() {
  const matched = new Set(CV_MATCHES.map((m) => m.nodeId));
  const nodes = DEMO_ROADMAP.filter((n) => !n.summit);
  const known = CV_MATCHES.length;
  return (
    <Frame title="Upload your CV" note="Amina uploads a PDF. Nothing leaves this demo.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <article className="surface p-6">
          <h3 className="font-display text-2xl font-semibold">Amina_Bello_CV.pdf</h3>
          <ul className="mt-4 space-y-3">
            {CV_LINES.map((line) => {
              const hit = CV_MATCHES.some((m) => line.startsWith(m.evidence));
              return (
                <li
                  key={line}
                  className={`border-l-2 pl-3 text-base ${hit ? "border-lake text-text" : "border-line text-text-mute"}`}
                >
                  {line}
                  {hit && <span className="badge badge-known ml-2">Matched</span>}
                </li>
              );
            })}
          </ul>
        </article>

        <article data-tour="cv-result" className="surface p-6">
          <h3 className="font-display text-3xl font-bold leading-none">
            {known} known, {nodes.length - known} to walk
          </h3>
          <p className="mt-2 text-text-soft">
            About <span className="data">{CV_HOURS_SAVED}</span> hours of learning skipped.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-1 gap-y-2">
            {nodes.map((n) => (
              <NodeMarker
                key={n.id}
                size={104}
                label={n.label}
                state={(matched.has(n.id) ? "known" : "todo") as NodeState}
              />
            ))}
          </div>
        </article>
      </div>
    </Frame>
  );
}

/* Steps 4 and 5: the project and the reviewer's notes */
export type ReviewProgress = { status: "idle" | "running" | "done"; resolved: number };

function CheckIcon({ state }: { state: "pass" | "fail" | "checking" | "waiting" }) {
  if (state === "pass") return <Check className="size-5 text-volt" aria-hidden="true" />;
  if (state === "fail") return <Wrench className="size-5 text-kola" aria-hidden="true" />;
  return <Clock className="size-5 text-node-mute" aria-hidden="true" />;
}

export function ProjectScene({ mode, review }: { mode: "project" | "feedback"; review: ReviewProgress }) {
  const feedback = mode === "feedback";
  return (
    <Frame
      title={NODE_EXPRESS.title}
      note={`${NODE_EXPRESS.verifiedHours} of ${NODE_EXPRESS.totalHours} verified hours, ${NODE_EXPRESS.percent} percent through this node.`}
    >
      <div data-tour={feedback ? undefined : "project"} className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="surface p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-3xl font-bold leading-none">{NODE_EXPRESS.projectTitle}</h3>
            <NodeMarker state="in_progress" percent={NODE_EXPRESS.percent} label="Node and Express" size={96} labelClassName="hidden" />
          </div>
          <p className="mt-3 max-w-[60ch] text-text-soft">{NODE_EXPRESS.brief}</p>
          <p className="mt-4 text-sm text-text-mute">
            Sample repo: <span className="data text-text-soft">{NODE_EXPRESS.repoUrl}</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span data-tour="submit" className="btn btn-primary">
              Submit a repo link
            </span>
            <span className="badge badge-todo">Simulation</span>
          </div>
        </article>

        <article data-tour={feedback ? "feedback" : undefined} className="surface p-6">
          <h3 className="font-display text-2xl font-semibold">Reviewer checks</h3>
          <ul className="mt-4 space-y-4">
            {NODE_EXPRESS.checks.map((c, i) => {
              const resolved = feedback || (review.status !== "idle" && i < review.resolved);
              const checking = !feedback && review.status === "running" && i === review.resolved;
              const state = resolved ? c.result : checking ? "checking" : "waiting";
              const failed = resolved && c.result === "fail";
              return (
                <li key={c.id} className={failed ? "border-l-2 border-kola pl-3" : "pl-[calc(0.75rem+2px)]"}>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckIcon state={state} />
                    {c.label}
                    <span className={`ml-auto text-sm font-semibold ${failed ? "text-kola" : "text-text-mute"}`}>
                      {state === "pass" && "Passed"}
                      {state === "fail" && "Needs work"}
                      {state === "checking" && "Checking"}
                      {state === "waiting" && "Waiting"}
                    </span>
                  </p>
                  {resolved && feedback && <p className="mt-1 text-sm text-text-soft">{c.note}</p>}
                  {failed && feedback && c.fix && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-kola">How to fix it: </span>
                      <span className="text-text-soft">{c.fix}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </Frame>
  );
}

/* Step 6: the passport */
export function CredentialScene() {
  const c = DEMO_CREDENTIALS["demo-001"];
  return (
    <Frame title="Your credential">
      <div data-tour="passport" className="mx-auto max-w-xl">
        <Passport
          name={c.payload.candidateName}
          university={c.payload.university}
          track={c.payload.roleTitle}
          hours={c.hours}
          projects={c.projects}
          issued={c.issuedLabel}
          id={c.payload.id}
          stampKey="step6"
        />
      </div>
    </Frame>
  );
}

/* Step 7: what the employer sees */
export type Verdict = "loading" | "valid" | "invalid" | "error";

export function EmployerScene({ hours, verdict }: { hours: string; verdict: Verdict }) {
  const c = DEMO_CREDENTIALS["demo-001"];
  const bad = verdict === "invalid";
  return (
    <Frame title="Employer check" note="No account. The check runs in the employer's browser.">
      <div data-tour="verify" className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Passport
          name={c.payload.candidateName}
          university={c.payload.university}
          track={c.payload.roleTitle}
          hours={hours || "?"}
          projects={c.projects}
          issued={c.issuedLabel}
          id={c.payload.id}
          stampKey="step7"
        />
        <article
          className={`surface p-6 ${bad ? "!border-ember" : ""}`}
          role="status"
          aria-label="Signature check result"
        >
          <p className="text-sm text-text-mute">Credential ID</p>
          <p className="data mt-1 rounded-full border border-node-mute px-5 py-3 text-base">demo-001</p>

          <div className="mt-6 flex items-center gap-4">
            {bad ? (
              <ShieldX className="size-12 shrink-0 text-ember" aria-hidden="true" />
            ) : (
              <ShieldCheck className="size-12 shrink-0 text-volt" aria-hidden="true" />
            )}
            <div>
              <p className={`font-display text-6xl font-bold leading-none ${bad ? "text-ember" : "text-volt"}`}>
                {verdict === "loading" && "Checking"}
                {verdict === "valid" && "Valid"}
                {verdict === "invalid" && "Invalid"}
                {verdict === "error" && "Unavailable"}
              </p>
              <p className="mt-2 text-text-soft">
                {verdict === "valid" && "Issued by Ladda and not changed since."}
                {verdict === "invalid" && "The record does not match its signature. Do not trust it."}
                {verdict === "loading" && "Checking the signature in your browser."}
                {verdict === "error" && "The sample credential could not be loaded."}
              </p>
            </div>
          </div>
        </article>
      </div>
    </Frame>
  );
}
