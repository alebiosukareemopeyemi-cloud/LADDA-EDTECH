import type { NodeStatus, Roadmap, RoadmapNode } from "@/lib/contract";

const finished = (s: NodeStatus) => s === "verified" || s === "known";

// Mark nodes verified, then recompute everything the server would: what blocks what,
// what is locked, the next step and the counts. The same rules as the mock roadmap.
export function applyVerified(roadmap: Roadmap, verifiedIds: string[]): Roadmap {
  const verified = new Set(verifiedIds);
  const status = new Map<string, NodeStatus>(
    roadmap.nodes.map((n) => [n.id, verified.has(n.id) ? "verified" : n.status])
  );

  const nodes: RoadmapNode[] = roadmap.nodes.map((n) => {
    const s = status.get(n.id) as NodeStatus;
    const blockedBy = n.prereqs.filter((p) => !finished(status.get(p) ?? "todo"));
    return {
      ...n,
      status: s,
      source: s === "verified" && verified.has(n.id) ? "task" : n.source,
      blockedBy,
      locked: s === "todo" && blockedBy.length > 0,
      nextStep: s === "verified" ? "done" : s === "todo" ? "learn" : "build",
    };
  });

  const hoursLeft = nodes
    .filter((n) => !n.isStretch && !finished(n.status))
    .reduce((t, n) => t + n.hours, 0);

  return {
    ...roadmap,
    nodes,
    progress: {
      verified: nodes.filter((n) => n.status === "verified").length,
      known: nodes.filter((n) => n.status === "known").length,
      total: nodes.length,
    },
    weeksLeft: Math.ceil(hoursLeft / Math.max(1, roadmap.hoursPerWeek)),
  };
}

// Every required (not stretch) skill has a passed project.
export function isTrackComplete(roadmap: Roadmap): boolean {
  const required = roadmap.nodes.filter((n) => !n.isStretch);
  return required.length > 0 && required.every((n) => n.status === "verified");
}

// "38h of 96": hours on verified required skills, out of all required hours.
export function hoursSummary(nodes: RoadmapNode[]): { done: number; total: number } {
  const required = nodes.filter((n) => !n.isStretch);
  return {
    done: required.filter((n) => n.status === "verified").reduce((t, n) => t + n.hours, 0),
    total: required.reduce((t, n) => t + n.hours, 0),
  };
}

// The skill to work on now: the one in progress, else the first open one that is not done.
export function pickNext(nodes: RoadmapNode[]): RoadmapNode | null {
  return (
    nodes.find((n) => n.status === "in_progress") ??
    nodes.find((n) => !n.locked && n.status !== "verified" && n.status !== "known") ??
    null
  );
}

// Skills that were locked before and are open now.
export function newlyUnlocked(before: Roadmap, after: Roadmap): RoadmapNode[] {
  const wasLocked = new Set(before.nodes.filter((n) => n.locked).map((n) => n.id));
  return after.nodes.filter((n) => wasLocked.has(n.id) && !n.locked);
}
