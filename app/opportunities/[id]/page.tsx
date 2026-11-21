"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { opportunities, getStatus, type OpportunityStatus } from "@/content/opportunities";

const STATUS: Record<OpportunityStatus, { label: string; cls: string }> = {
  "closing-soon": { label: "Closing soon", cls: "badge-needs-work" },
  open: { label: "Open", cls: "badge-progress" },
  "check-site": { label: "Check the site", cls: "badge-todo" },
  closed: { label: "Closed", cls: "badge-locked" },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8">
      <dt className="w-44 shrink-0 text-text-mute">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const o = opportunities.find((x) => x.id === id);
  if (!o) notFound();

  const status = now ? getStatus(o, now) : null;
  const s = status ? STATUS[status] : null;

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-10">
      <Link href="/opportunities" className="btn btn-ghost -ml-4">
        Back to opportunities
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {s ? <span className={`badge ${s.cls}`}>{s.label}</span> : <span className="skeleton h-7 w-24 rounded-full" />}
          <span className="text-sm text-text-mute">
            {o.type} from {o.organiser}
          </span>
        </div>
        <h1 className="display-md mt-3">{o.title}</h1>
        <p className="measure mt-3 text-lg text-text-soft">{o.blurb}</p>
      </header>

      <dl className="mt-8 divide-y divide-line border-y border-line">
        <Row label="Prize" value={o.prize} />
        <Row label="When" value={o.dateLabel} />
        {o.eligibility && <Row label="Who can apply" value={o.eligibility} />}
        <Row label="Type" value={o.type} />
      </dl>

      <div className="mt-8">
        {status === "closed" ? (
          <p className="text-text-soft">This one has closed. Check back for the next one.</p>
        ) : o.applyUrl ? (
          <a href={o.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
            Apply on the official page
            <ExternalLink aria-hidden="true" />
            <span className="sr-only">Opens in a new tab</span>
          </a>
        ) : (
          <p className="text-text-soft">{o.applyNote ?? "Check the organiser's site for details."}</p>
        )}
      </div>
    </main>
  );
}
