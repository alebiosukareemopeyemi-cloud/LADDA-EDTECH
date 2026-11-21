import type { RoadmapNode } from "@/lib/contract";

// "38h of 96 verified hours" as a stepped profile line: one step per required
// skill. A verified step is solid volt, the rest are dotted.
export default function HoursStrip({ nodes }: { nodes: RoadmapNode[] }) {
  const required = nodes.filter((n) => !n.isStretch);
  const total = required.reduce((t, n) => t + n.hours, 0);
  const done = required.filter((n) => n.status === "verified").reduce((t, n) => t + n.hours, 0);

  const W = 1000;
  const H = 56;
  const stepW = required.length ? W / required.length : W;
  let cum = 0;
  const steps = required.map((n, i) => {
    const y0 = H - (cum / (total || 1)) * (H - 6) - 3;
    cum += n.hours;
    const y1 = H - (cum / (total || 1)) * (H - 6) - 3;
    return { id: n.id, verified: n.status === "verified", x0: i * stepW, x1: (i + 1) * stepW, y0, y1 };
  });

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-night px-4 py-4 md:flex-row md:items-center md:gap-8 md:px-10">
      <p className="shrink-0 text-lg font-medium">
        <span className="data text-xl font-semibold">{done}h</span> of <span className="data">{total}h</span> verified hours
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${done} of ${total} verified hours, shown as a stepped line`}
        className="h-14 w-full min-w-0 flex-1"
      >
        {steps.map((s) => (
          <path
            key={s.id}
            d={`M${s.x0} ${s.y0} H${s.x1} V${s.y1}`}
            fill="none"
            stroke={s.verified ? "#BEF264" : "#6E8A7A"}
            strokeWidth={s.verified ? 3 : 2}
            strokeDasharray={s.verified ? undefined : "1 7"}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
