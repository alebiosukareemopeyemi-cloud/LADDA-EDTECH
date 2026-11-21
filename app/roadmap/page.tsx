"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getRoadmap } from "@/lib/api/client";
import type { Roadmap } from "@/lib/contract";
import { isTrackComplete } from "@/lib/roadmap/progress";
import ContourBackdrop from "@/components/landing/ContourBackdrop";
import HoursStrip from "@/components/roadmap/HoursStrip";
import NodePanel from "@/components/roadmap/NodePanel";
import RoadmapTrail from "@/components/roadmap/RoadmapTrail";
import HacktoberfestPopup from "@/components/announcements/HacktoberfestPopup";

type Load = { kind: "loading" } | { kind: "ready"; roadmap: Roadmap } | { kind: "error"; message: string };

export default function RoadmapPage() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    getRoadmap().then((res) => {
      if (!alive) return;
      if (!res.ok) return setLoad({ kind: "error", message: res.message });
      setLoad({ kind: "ready", roadmap: res.data });
      // Start on the stop you are working on.
      const nodes = res.data.nodes;
      const start = nodes.find((n) => n.status === "in_progress") ?? nodes.find((n) => !n.locked && n.status === "todo") ?? nodes[0];
      setSelectedId(start?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  // Escape closes the bottom sheet on phones.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  if (load.kind === "error") {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">Your roadmap did not load</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          {load.message}. Check your connection, then try again. Your progress is not affected.
        </p>
        <button type="button" className="btn btn-primary mt-8" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </button>
      </main>
    );
  }

  if (load.kind === "loading") {
    return (
      <main id="main" className="flex min-h-[calc(100dvh-3.5rem)] flex-col" aria-busy="true">
        <p className="sr-only">Loading your roadmap</p>
        <div className="grid flex-1 lg:grid-cols-[1fr_420px]">
          <div className="p-6 md:p-10">
            <div className="skeleton h-12 w-64 rounded-full" />
            <div className="skeleton mt-6 h-[420px] rounded-[1.25rem]" />
          </div>
          <div className="hidden space-y-4 border-l border-line p-8 lg:block">
            <div className="skeleton h-8 w-40 rounded-full" />
            <div className="skeleton h-24 rounded-[1.25rem]" />
            <div className="skeleton h-40 rounded-[1.25rem]" />
          </div>
        </div>
      </main>
    );
  }

  const { roadmap } = load;

  if (roadmap.nodes.length === 0) {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="display-md">No roadmap yet</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          Answer four short questions and Ladda builds your trail from them.
        </p>
        <Link href="/intake" className="btn btn-primary mt-8">
          Build my roadmap
        </Link>
      </main>
    );
  }

  const selected = roadmap.nodes.find((n) => n.id === selectedId) ?? roadmap.nodes[0];

  return (
    <main id="main" className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* The trail map */}
        <section aria-labelledby="roadmap-title" className="contour relative flex min-h-[460px] flex-col">
          <ContourBackdrop />
          <header className="relative z-10 px-4 pt-6 md:px-10 md:pt-8">
            <h1 id="roadmap-title" className="display-md">
              {roadmap.roleTitle}
            </h1>
            <p className="mt-2 text-text-soft">
              <span className="data">{roadmap.progress.verified}</span> verified,{" "}
              <span className="data">{roadmap.progress.known}</span> known,{" "}
              <span className="data">{roadmap.progress.total}</span> skills,{" "}
              <span className="data">{roadmap.weeksLeft}</span> weeks left
            </p>
            {isTrackComplete(roadmap) && (
              <Link href="/roadmap/complete" className="btn btn-primary mt-4">
                Get your credential
              </Link>
            )}
          </header>
          <div className="relative z-10 min-h-0 flex-1 px-2 pb-4 md:px-6">
            <RoadmapTrail nodes={roadmap.nodes} selectedId={selected.id} onSelect={(n) => select(n.id)} className="size-full min-h-[360px]" />
          </div>
        </section>

        {/* Detail panel: a column on desktop, a bottom sheet on phones */}
        <aside
          aria-label="Selected stop"
          className={`border-line bg-understory lg:static lg:block lg:max-h-none lg:overflow-visible lg:border-l lg:p-8 ${
            sheetOpen
              ? "fixed inset-x-0 bottom-0 z-30 max-h-[78dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-line-strong p-5 shadow-[0_-24px_60px_-24px_rgb(0_0_0/0.9)]"
              : "hidden"
          }`}
        >
          <div className="mb-3 flex justify-end lg:hidden">
            <button type="button" className="btn btn-secondary !min-h-10 !px-4 !text-sm" onClick={() => setSheetOpen(false)}>
              Close
            </button>
          </div>
          <NodePanel node={selected} roadmap={roadmap} onSelectNode={select} />
        </aside>
      </div>

      <HoursStrip nodes={roadmap.nodes} />
      <HacktoberfestPopup />
    </main>
  );
}
