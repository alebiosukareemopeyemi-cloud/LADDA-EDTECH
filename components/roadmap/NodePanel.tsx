"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Lock } from "lucide-react";
import { getNodeDetail } from "@/lib/api/client";
import type { NodeDetail, Roadmap, RoadmapNode } from "@/lib/contract";
import { markerState } from "./RoadmapTrail";

const STATUS: Record<ReturnType<typeof markerState>, { word: string; cls: string }> = {
  verified: { word: "Verified", cls: "badge-verified" },
  known: { word: "Known", cls: "badge-known" },
  in_progress: { word: "In progress", cls: "badge-progress" },
  todo: { word: "Not started", cls: "badge-todo" },
  locked: { word: "Locked", cls: "badge-locked" },
};

type Load = { kind: "loading" } | { kind: "ready"; detail: NodeDetail } | { kind: "error" };

// The detail for the selected stop: status, reviewer checks, and the next action.
export default function NodePanel({
  node,
  roadmap,
  onSelectNode,
}: {
  node: RoadmapNode;
  roadmap: Roadmap;
  onSelectNode: (id: string) => void;
}) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    getNodeDetail(node.id).then((res) => {
      if (!alive) return;
      setLoad(res.ok ? { kind: "ready", detail: res.data } : { kind: "error" });
    });
    return () => {
      alive = false;
    };
  }, [node.id, attempt]);

  const state = markerState(node);
  const look = STATUS[state];
  const blockers = node.blockedBy
    .map((id) => roadmap.nodes.find((n) => n.id === id))
    .filter((n): n is RoadmapNode => !!n);
  const project = load.kind === "ready" ? load.detail.projects.find((p) => p.kind === "assigned") : undefined;
  const passed = node.status === "verified";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${look.cls}`}>
          {state === "verified" && <Check aria-hidden="true" />}
          {state === "locked" && <Lock aria-hidden="true" />}
          {look.word}
        </span>
        <span className="badge badge-todo">
          <span className="data">{node.hours}h</span>
        </span>
        {node.isStretch && <span className="badge badge-todo">Stretch</span>}
      </div>

      <h2 className="mt-4 font-display text-4xl font-bold leading-[0.98]">{node.title}</h2>
      <p className="mt-3 max-w-[48ch] text-text-soft">{node.blurb}</p>

      {state === "locked" && (
        <div className="mt-5 border-l-2 border-node-mute pl-4">
          <p className="font-medium">
            Locked. Finish {blockers.map((b) => b.title).join(" and ")} first.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {blockers.map((b) => (
              <button key={b.id} type="button" className="chip" onClick={() => onSelectNode(b.id)}>
                Go to {b.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <h3 className="mt-7 font-display text-2xl font-semibold leading-none">Reviewer checks</h3>
      {load.kind === "loading" && (
        <div className="mt-3 space-y-3" aria-busy="true">
          <p className="sr-only">Loading the checks</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-6 rounded-full" />
          ))}
        </div>
      )}
      {load.kind === "error" && (
        <div className="mt-3">
          <p className="text-text-soft">The checks did not load. Check your connection, then try again.</p>
          <button type="button" className="btn btn-secondary mt-3" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </div>
      )}
      {load.kind === "ready" &&
        (project ? (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {project.criteria.map((c) => (
              <li key={c} className="flex items-center gap-3 py-3">
                {passed ? (
                  <Check className="size-5 shrink-0 text-volt" aria-hidden="true" />
                ) : (
                  <Clock className="size-5 shrink-0 text-node-mute" aria-hidden="true" />
                )}
                <span className="flex-1">{c}</span>
                <span className={`text-sm font-medium ${passed ? "text-volt" : "text-text-mute"}`}>
                  {passed ? "Passed" : "Waiting"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-text-soft">No project is assigned to this skill yet.</p>
        ))}

      <div className="mt-6 flex flex-wrap gap-3">
        {state === "locked" ? (
          <p className="text-sm text-text-mute">The brief opens when the skills above are finished.</p>
        ) : (
          <>
            {!passed && (
              <Link href={`/roadmap/${node.id}#submit`} className="btn btn-primary">
                Submit a repo link
              </Link>
            )}
            <Link href={`/roadmap/${node.id}`} className="btn btn-secondary">
              Open the brief
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
