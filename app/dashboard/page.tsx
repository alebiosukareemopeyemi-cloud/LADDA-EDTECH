"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoadmap } from "@/lib/api/client";
import type { Roadmap } from "@/lib/contract";
import ContourBackdrop from "@/components/landing/ContourBackdrop";
import RoadmapTrail from "@/components/roadmap/RoadmapTrail";
import HacktoberfestPopup from "@/components/announcements/HacktoberfestPopup";
import { applyVerified, hoursSummary, isTrackComplete, newlyUnlocked, pickNext } from "@/lib/roadmap/progress";
import { latestLocalReview } from "@/lib/review/local";
import { opportunities, getStatus, sortOpportunities, type OpportunityStatus } from "@/content/opportunities";

const OPP: Record<OpportunityStatus, { label: string; cls: string }> = {
  "closing-soon": { label: "Closing soon", cls: "badge-needs-work" },
  open: { label: "Open", cls: "badge-progress" },
  "check-site": { label: "Check the site", cls: "badge-todo" },
  closed: { label: "Closed", cls: "badge-locked" },
};

type Load = { kind: "loading" } | { kind: "ready"; roadmap: Roadmap } | { kind: "error"; message: string };

export default function DashboardPage() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [latest, setLatest] = useState<ReturnType<typeof latestLocalReview>>(null);

  useEffect(() => {
    setNow(new Date());
    setLatest(latestLocalReview());
  }, []);

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    getRoadmap().then((res) => {
      if (!alive) return;
      setLoad(res.ok ? { kind: "ready", roadmap: res.data } : { kind: "error", message: res.message });
    });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const picks = now
    ? sortOpportunities(opportunities, now)
        .filter((o) => getStatus(o, now) !== "closed")
        .slice(0, 3)
    : [];

  /* ---- states that replace the page ---- */
  if (load.kind === "error") {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">Your dashboard did not load</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          {load.message}. Check your connection, then try again. Your progress is not affected.
        </p>
        <button type="button" className="btn btn-primary mt-8" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </button>
      </main>
    );
  }

  if (load.kind === "ready" && load.roadmap.nodes.length === 0) {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">Welcome to Ladda</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          You have no roadmap yet. Answer four short questions and Ladda builds your trail from them.
        </p>
        <Link href="/intake" className="btn btn-primary mt-8">
          Build my roadmap
        </Link>
      </main>
    );
  }

  const roadmap = load.kind === "ready" ? load.roadmap : null;
  const next = roadmap ? pickNext(roadmap.nodes) : null;
  const hours = roadmap ? hoursSummary(roadmap.nodes) : null;
  const complete = roadmap ? isTrackComplete(roadmap) : false;
  const unlockNames =
    roadmap && next
      ? newlyUnlocked(roadmap, applyVerified(roadmap, [next.id])).map((n) => n.title)
      : [];
  const latestNode = roadmap && latest ? roadmap.nodes.find((n) => n.id === latest.nodeId) : null;

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-10 md:pt-12">
      <h1 className="display-md">Welcome back</h1>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Your track */}
        <section aria-labelledby="track-title">
          <h2 id="track-title" className="font-display text-3xl font-bold leading-none">
            {roadmap ? roadmap.roleTitle : "Your track"}
          </h2>

          <div className="contour relative mt-4 aspect-[1100/760] overflow-hidden rounded-[1.25rem] border border-line">
            {!roadmap ? (
              <div className="skeleton absolute inset-0" aria-busy="true">
                <p className="sr-only">Loading your trail</p>
              </div>
            ) : (
              <>
                <ContourBackdrop />
                <div className="absolute inset-0 p-1">
                  <RoadmapTrail nodes={roadmap.nodes} />
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {complete ? (
              <Link href="/roadmap/complete" className="btn btn-primary btn-lg">
                Get your credential
              </Link>
            ) : next ? (
              <Link href={`/roadmap/${next.id}`} className="btn btn-primary btn-lg">
                Continue: {next.title}
              </Link>
            ) : roadmap ? (
              <p className="text-text-soft">Nothing is open to start right now. The roadmap shows what unlocks next.</p>
            ) : (
              <div className="skeleton h-[54px] w-64 rounded-full" />
            )}
            <Link href="/roadmap" className="btn btn-secondary btn-lg">
              See full roadmap
            </Link>
          </div>
        </section>

        {/* Where you stand: a plain list */}
        <section aria-labelledby="stand-title">
          <h2 id="stand-title" className="font-display text-3xl font-bold leading-none">
            Where you stand
          </h2>
          {!roadmap ? (
            <div className="mt-4 space-y-4" aria-busy="true">
              <p className="sr-only">Loading your progress</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-14 rounded-[1.25rem]" />
              ))}
            </div>
          ) : (
            <dl className="mt-4 divide-y divide-line border-y border-line">
              <div className="py-4">
                <dt className="text-sm text-text-mute">Verified hours</dt>
                <dd className="mt-1 text-lg">
                  <span className="data text-xl font-semibold">{hours?.done}h</span> of <span className="data">{hours?.total}h</span>
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-text-mute">Next unlock</dt>
                <dd className="mt-1 text-lg">
                  {complete
                    ? "Everything is verified."
                    : next && unlockNames.length > 0
                      ? `Finish ${next.title} to open ${unlockNames.join(", ")}.`
                      : next
                        ? `${next.title} does not open anything new yet.`
                        : "Nothing to unlock right now."}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-text-mute">Latest review</dt>
                <dd className="mt-1 text-lg">
                  {latest ? (
                    <>
                      {latestNode?.title ?? latest.nodeId}: <span className="font-semibold text-volt">Approved</span>
                      <span className="mt-1 block text-sm text-text-mute">
                        {new Date(latest.review.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.{" "}
                        <a href={latest.review.repoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                          Open the repo<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </span>
                    </>
                  ) : (
                    <span className="text-text-soft">No reviews yet. Submit a repo link on a skill to get your first one.</span>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      {/* Opportunities and the weekly challenge */}
      <section aria-labelledby="opp-title" className="mt-14 max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <h2 id="opp-title" className="font-display text-3xl font-bold leading-none">
            Opportunities
          </h2>
          <Link href="/opportunities" className="underline underline-offset-4">
            See all
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {!now &&
            [0, 1, 2].map((i) => (
              <li key={i} className="py-4">
                <div className="skeleton h-12 rounded-[1.25rem]" />
              </li>
            ))}
          {now && picks.length === 0 && (
            <li className="py-4 text-text-soft">Nothing is open right now. Check back soon.</li>
          )}
          {picks.map((o) => {
            const b = OPP[getStatus(o, now!)];
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                <span className={`badge ${b.cls}`}>{b.label}</span>
                <Link href={`/opportunities/${o.id}`} className="min-w-0 flex-1 font-semibold underline-offset-4 hover:underline">
                  {o.title}
                </Link>
                <span className="text-sm text-text-mute">{o.dateLabel}</span>
              </li>
            );
          })}
          <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 text-text-mute">
            <span className="badge badge-locked">Coming soon</span>
            <span className="min-w-0 flex-1">Ladda weekly challenge. Check back on Sunday.</span>
          </li>
        </ul>
      </section>

      <HacktoberfestPopup />
    </main>
  );
}
