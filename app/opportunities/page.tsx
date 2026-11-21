"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  opportunities,
  getStatus,
  sortOpportunities,
  type OpportunityStatus,
} from "@/content/opportunities";

const STATUS: Record<OpportunityStatus, { label: string; cls: string }> = {
  "closing-soon": { label: "Closing soon", cls: "badge-needs-work" },
  open: { label: "Open", cls: "badge-progress" },
  "check-site": { label: "Check the site", cls: "badge-todo" },
  closed: { label: "Closed", cls: "badge-locked" },
};

export default function OpportunitiesPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [tab, setTab] = useState<"opportunities" | "challenges">("opportunities");
  const [type, setType] = useState("All");
  const [hideClosed, setHideClosed] = useState(false);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const types = useMemo(() => ["All", ...Array.from(new Set(opportunities.map((o) => o.type)))], []);

  const list = useMemo(() => {
    if (!now) return [];
    return sortOpportunities(opportunities, now).filter(
      (o) => (type === "All" || o.type === type) && (!hideClosed || getStatus(o, now) !== "closed")
    );
  }, [now, type, hideClosed]);

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 pb-20 pt-8 md:px-10 md:pt-12">
      <h1 className="display-md">Compete, intern, get seen</h1>
      <p className="measure mt-3 text-lg text-text-soft">
        Hand-picked competitions and hackathons. Open ones come first.
      </p>

      <div role="group" aria-label="Section" className="mt-8 flex flex-wrap gap-2">
        <button type="button" className="chip" aria-pressed={tab === "opportunities"} onClick={() => setTab("opportunities")}>
          Opportunities
        </button>
        <button type="button" className="chip" aria-pressed={tab === "challenges"} onClick={() => setTab("challenges")}>
          Ladda challenges
        </button>
      </div>

      {tab === "opportunities" ? (
        <>
          <div role="group" aria-label="Filters" className="mt-4 flex flex-wrap items-center gap-2">
            {types.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={hideClosed} onClick={() => setHideClosed((v) => !v)}>
              Hide closed
            </button>
          </div>

          {!now && (
            <div className="mt-8 space-y-3" aria-busy="true">
              <p className="sr-only">Loading opportunities</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-20 rounded-[1.25rem]" />
              ))}
            </div>
          )}

          {now && list.length === 0 && (
            <div className="mt-8 border-y border-line py-10">
              <p className="text-lg font-medium">Nothing matches these filters.</p>
              <p className="mt-1 text-text-soft">Show all types and closed ones to see everything.</p>
              <button
                type="button"
                className="btn btn-secondary mt-4"
                onClick={() => {
                  setType("All");
                  setHideClosed(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {now && list.length > 0 && (
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {list.map((o) => {
                const s = STATUS[getStatus(o, now)];
                const closed = getStatus(o, now) === "closed";
                return (
                  <li key={o.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                        <span className="text-sm text-text-mute">{o.type}</span>
                      </div>
                      <h2 className="mt-2 font-display text-3xl font-bold leading-none">{o.title}</h2>
                      <p className={`mt-2 max-w-[56ch] ${closed ? "text-text-mute" : "text-text-soft"}`}>{o.blurb}</p>
                      <p className="mt-2 text-sm text-text-mute">
                        <span className="font-medium text-text-soft">{o.prize}</span>. {o.dateLabel}.
                      </p>
                    </div>
                    <Link href={`/opportunities/${o.id}`} className="btn btn-secondary shrink-0 self-start sm:self-center">
                      View details
                      <span className="sr-only"> for {o.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="mt-8 border-y border-line py-10">
          <span className="badge badge-locked">Coming soon</span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-none">Ladda weekly challenge</h2>
          <p className="measure mt-3 text-text-soft">
            One timed task a week, reviewed on real code. Winners climb the leaderboard.
          </p>
          <p className="mt-4 font-medium">Check back on Sunday.</p>
        </div>
      )}
    </main>
  );
}
