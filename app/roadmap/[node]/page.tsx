"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Clock, ExternalLink, Lock, Wrench } from "lucide-react";
import { getNodeDetail, getRoadmap, rememberApproval, reviewRepo } from "@/lib/api/client";
import type {
  NodeDetail,
  NodeStatus,
  ProjectBrief,
  Resource,
  ReviewedResponse,
  Roadmap,
  RoadmapNode,
  StepId,
} from "@/lib/contract";
import { CertificatesPanel } from "@/components/roadmap/CertificatesPanel";
import UnlockMoment from "@/components/roadmap/UnlockMoment";
import { applyVerified, isTrackComplete, newlyUnlocked } from "@/lib/roadmap/progress";
import { usePlay } from "@/lib/motion";

const statusText: Record<NodeStatus, string> = {
  todo: "Not started",
  known: "Known",
  in_progress: "In progress",
  verified: "Verified",
};

const STEP_MS = 450;

// ---- Learn ----
function LearnPanel({ resources, hasRepo }: { resources: Resource[]; hasRepo: boolean }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold leading-none">Resources</h2>
      {resources.length === 0 ? (
        <p className="mt-3 text-text-soft">
          Hand-checked resources for this skill are on the way. You can start the project from the Build step now.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {resources.map((r) => (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 py-4 hover:underline"
              >
                <span className="font-medium">{r.title}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-text-mute">
                  {r.cost === "free" ? "Free" : "Paid"}
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">Opens in a new tab</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {hasRepo && <p className="mt-4 text-sm text-text-mute">Study it in a real repo is coming soon.</p>}
    </div>
  );
}

// ---- Build ----
type Phase = "idle" | "pending" | "done" | "unavailable";

function BuildPanel({
  nodeId,
  project,
  suggested,
  approved,
  onApproved,
}: {
  nodeId: string;
  project: ProjectBrief | undefined;
  suggested: ProjectBrief[];
  approved: boolean;
  onApproved: (r: ReviewedResponse) => void;
}) {
  const play = usePlay();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ReviewedResponse | null>(null);
  const [resolved, setResolved] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  if (!project) {
    return (
      <p className="text-text-soft">
        No project is assigned to this skill yet. Check back after the next catalog update.
      </p>
    );
  }
  const brief = project;
  const n = brief.criteria.length;

  async function submit() {
    const v = url.trim();
    if (!/^https:\/\/github\.com\/[^\s/]+\/[^\s/]+/i.test(v)) {
      setProblem("Paste a full GitHub repo link that starts with https://github.com/, for example https://github.com/you/project.");
      return;
    }
    setProblem(null);
    setNotice(null);
    setResult(null);
    setResolved(0);
    setPhase("pending");

    const res = await reviewRepo(nodeId, v);
    if (!res.ok) {
      setPhase("idle");
      setProblem(
        res.code === "RATE_LIMITED"
          ? res.message
          : res.code === "VALIDATION"
            ? res.message
            : "We could not reach the review service. Check your connection and select Submit project again."
      );
      return;
    }
    if (res.data.status === "unavailable") {
      setPhase("unavailable");
      setNotice(res.data.message);
      return;
    }

    const r = res.data;
    setResult(r);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    const finish = () => {
      setResolved(n);
      setPhase("done");
      if (r.approved) {
        rememberApproval(nodeId, r);
        onApproved(r);
      }
    };
    if (!play) return finish();
    // The checks resolve one by one, now that the verdict is in.
    for (let i = 1; i <= n; i++) {
      timers.current.push(window.setTimeout(() => (i === n ? finish() : setResolved(i)), i * STEP_MS));
    }
  }

  const reviewing = phase === "pending" || (phase === "done" ? false : result !== null);
  const showChecks = phase !== "idle" && phase !== "unavailable";

  return (
    <div>
      <h2 className="font-display text-3xl font-bold leading-none">{brief.title}</h2>
      <p className="measure mt-3 text-text-soft">{brief.brief}</p>

      <h3 className="mt-7 font-display text-2xl font-semibold leading-none">
        {showChecks ? "Review" : "What the reviewer checks"}
      </h3>
      <ul className="mt-3 divide-y divide-line border-y border-line" aria-live="polite">
        {brief.criteria.map((c, i) => {
          const check = result?.checks.find((x) => x.criterion === c);
          const settled = !!check && (phase === "done" || i < resolved);
          const state: "waiting" | "checking" | "pass" | "fail" =
            approved && phase === "idle"
              ? "pass"
              : settled
                ? check.pass
                  ? "pass"
                  : "fail"
                : phase === "pending" || reviewing
                  ? "checking"
                  : "waiting";
          return (
            <li key={c} className="py-3">
              <p className="flex items-center gap-3">
                {state === "pass" ? (
                  <Check className="size-5 shrink-0 text-volt" aria-hidden="true" />
                ) : state === "fail" ? (
                  <Wrench className="size-5 shrink-0 text-kola" aria-hidden="true" />
                ) : (
                  <Clock className="size-5 shrink-0 text-node-mute" aria-hidden="true" />
                )}
                <span className="flex-1">{c}</span>
                <span
                  className={`text-sm font-semibold ${
                    state === "pass" ? "text-volt" : state === "fail" ? "text-kola" : "text-text-mute"
                  }`}
                >
                  {state === "pass" && "Passed"}
                  {state === "fail" && "Needs work"}
                  {state === "checking" && "Checking"}
                  {state === "waiting" && (showChecks ? "Waiting" : "")}
                </span>
              </p>
              {settled && check && (
                <div className="mt-2 pl-8 text-sm">
                  <p className="text-text-mute">{check.evidence}</p>
                  {!check.pass && check.fix && (
                    <p className="mt-1 text-text-soft">
                      <span className="font-semibold text-kola">How to fix it: </span>
                      {check.fix}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Submit and result */}
      <div id="submit" className="mt-8 scroll-mt-20">
        {phase === "pending" && (
          <p role="status" className="font-medium">
            Reading your repo and reviewing it. This takes up to half a minute.
          </p>
        )}

        {phase === "unavailable" && (
          <div role="status" className="border-l-2 border-kola pl-4">
            <p className="font-medium">{notice}</p>
            <p className="mt-1 text-sm text-text-mute">Nothing was saved, and your skill status is unchanged.</p>
            <button type="button" onClick={() => setPhase("idle")} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {phase === "done" && result && (
          <div role="status" className={`border-l-2 pl-4 ${result.approved ? "border-volt" : "border-kola"}`}>
            <p className={`font-display text-4xl font-bold leading-none ${result.approved ? "text-volt" : "text-kola"}`}>
              {result.approved ? "Approved" : "Needs work"}
            </p>
            <p className="mt-2 text-lg">
              <span className="data font-semibold">{result.checks.filter((c) => c.pass).length}</span> of{" "}
              <span className="data">{result.checks.length}</span> checks passed
            </p>
            <p className="mt-1 text-sm text-text-mute">
              {result.source === "gemini"
                ? "Reviewed by the AI reviewer from your repo files."
                : "The AI reviewer was not available, so this is a file check only. The code was not run."}{" "}
              {result.remaining} reviews left this hour.
            </p>
            {!result.approved && (
              <button type="button" onClick={() => setPhase("idle")} className="btn btn-secondary mt-4">
                Resubmit
              </button>
            )}
          </div>
        )}

        {phase === "idle" && approved && (
          <p className="border-l-2 border-volt pl-4 text-lg font-medium">This skill is verified. Nice work.</p>
        )}

        {phase === "idle" && !approved && (
          <div>
            <label htmlFor="repo-url" className="text-sm font-medium">
              GitHub repo link
            </label>
            <div className="mt-2 flex flex-col gap-3 md:flex-row">
              <input
                id="repo-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (problem) setProblem(null);
                }}
                placeholder="https://github.com/you/project"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!problem}
                aria-describedby={problem ? "repo-problem" : undefined}
                className="field min-w-0 flex-1"
              />
              <button type="button" onClick={submit} className="btn btn-primary">
                Submit project
              </button>
            </div>
            {problem && (
              <p id="repo-problem" role="alert" className="mt-2 text-sm font-medium text-ember">
                {problem}
              </p>
            )}
          </div>
        )}
      </div>

      {suggested.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-2xl font-semibold leading-none">Other project ideas</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {suggested.map((p) => (
              <li key={p.id} className="py-3">
                <p className="font-medium">{p.title}</p>
                <p className="mt-0.5 text-sm text-text-soft">{p.brief}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---- Page ----
type Load = { kind: "loading" } | { kind: "ready"; detail: NodeDetail } | { kind: "error" };
type Moment = { verified: RoadmapNode; unlocked: RoadmapNode[]; complete: boolean };

export default function NodePage() {
  const { node } = useParams<{ node: string }>();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<StepId | null>(null);
  const [approved, setApproved] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    getNodeDetail(node).then((res) => {
      if (!alive) return;
      if (!res.ok) return setLoad({ kind: "error" });
      setLoad({ kind: "ready", detail: res.data });
      const wantsSubmit = typeof window !== "undefined" && window.location.hash === "#submit";
      const next = res.data.node.nextStep;
      setActive(wantsSubmit ? "build" : next !== "done" ? next : null);
    });
    getRoadmap().then((res) => alive && res.ok && setRoadmap(res.data));
    return () => {
      alive = false;
    };
  }, [node, attempt]);

  // Jump to the submit form when the link asked for it.
  useEffect(() => {
    if (load.kind === "ready" && active === "build" && window.location.hash === "#submit") {
      document.getElementById("submit")?.scrollIntoView({ block: "center" });
    }
  }, [load.kind, active]);

  if (load.kind === "loading") {
    return (
      <main id="main" className="mx-auto max-w-4xl px-4 py-8 md:px-10" aria-busy="true">
        <p className="sr-only">Loading this skill</p>
        <div className="skeleton h-10 w-40 rounded-full" />
        <div className="skeleton mt-6 h-14 w-2/3 rounded-full" />
        <div className="skeleton mt-6 h-72 rounded-[1.25rem]" />
      </main>
    );
  }

  if (load.kind === "error") {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">This skill did not load</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          The link may be wrong, or your connection dropped. Try again, or go back to your roadmap and pick it from there.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
          <Link href="/roadmap" className="btn btn-secondary">
            Back to roadmap
          </Link>
        </div>
      </main>
    );
  }

  const { detail } = load;
  const assigned = detail.projects.find((p) => p.kind === "assigned");
  const suggested = detail.projects.filter((p) => p.kind === "suggested");
  const isVerified = approved || detail.node.status === "verified";
  const statusLabel = detail.node.locked ? "Locked" : isVerified ? "Verified" : statusText[detail.node.status];

  // When a review passes: what opens up, and is the whole path done?
  function onApproved() {
    if (!roadmap) {
      setApproved(true);
      return;
    }
    const after = applyVerified(roadmap, [detail.node.id]);
    const me = after.nodes.find((n) => n.id === detail.node.id) as RoadmapNode;
    setMoment({ verified: me, unlocked: newlyUnlocked(roadmap, after), complete: isTrackComplete(after) });
    setApproved(true);
  }

  const tabs: { id: StepId; label: string; disabled: boolean; note: string | null }[] = detail.steps.map((s) => ({
    id: s.id,
    label: s.id === "learn" ? "Learn" : s.id === "build" ? "Build" : "Test",
    disabled: s.state === "locked" || s.state === "coming_soon",
    note: s.state === "coming_soon" ? "Coming soon" : s.state === "locked" ? s.lockedReason : null,
  }));
  const activeNote = tabs.find((t) => t.id === active)?.note;

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 pb-20 pt-6 md:px-10">
      <Link href="/roadmap" className="btn btn-ghost -ml-4">
        Back to roadmap
      </Link>

      <header className="mt-4">
        <h1 className="display-md">{detail.node.title}</h1>
        <p className="measure mt-3 text-lg text-text-soft">{detail.node.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`badge ${isVerified ? "badge-verified" : detail.node.locked ? "badge-locked" : "badge-todo"}`}>
            {detail.node.locked && <Lock aria-hidden="true" />}
            {isVerified && <Check aria-hidden="true" />}
            {statusLabel}
          </span>
          <span className="badge badge-todo">
            <span className="data">{detail.node.hours}h</span>
          </span>
          {detail.node.isStretch && <span className="badge badge-todo">Stretch</span>}
        </div>
      </header>

      {/* Steps */}
      <div role="group" aria-label="Steps" className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="chip"
            aria-pressed={active === t.id}
            aria-disabled={t.disabled || undefined}
            onClick={() => setActive(t.disabled ? null : active === t.id ? null : t.id)}
          >
            {t.disabled && <Lock className="size-3.5" aria-hidden="true" />}
            {t.label}
            {t.note && <span className="text-text-mute"> ({t.note.toLowerCase()})</span>}
          </button>
        ))}
      </div>

      <section className="mt-8" aria-live="polite">
        {active === null && (
          <p className="text-text-soft">
            {activeNote ?? "Pick a step above. Learn comes first, then Build. A project you submit and pass is what verifies this skill."}
          </p>
        )}
        {active === "learn" && <LearnPanel resources={detail.resources} hasRepo={detail.repoId !== null} />}
        {active === "build" && (
          <BuildPanel
            key={detail.node.id}
            nodeId={detail.node.id}
            project={assigned}
            suggested={suggested}
            approved={isVerified}
            onApproved={onApproved}
          />
        )}
      </section>

      {moment && <UnlockMoment verified={moment.verified} unlocked={moment.unlocked} complete={moment.complete} />}

      <CertificatesPanel suggested={detail.suggestedCertificates} />
    </main>
  );
}
