"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { RoadmapNode } from "@/lib/contract";
import RoadmapTrail from "@/components/roadmap/RoadmapTrail";
import ContourBackdrop from "@/components/landing/ContourBackdrop";

type Props = {
  nodes: RoadmapNode[];
  weeks: number;
  onDone: () => void;
  durationMs?: number;
};

export function BuildingStep({ nodes, weeks, onDone, durationMs = 6500 }: Props) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(0);

  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDoneRef.current();
  }, []);

  // Three lines tick off, then move on by itself.
  useEffect(() => {
    const ids = [
      setTimeout(() => setShown(1), 900),
      setTimeout(() => setDone(1), 1700),
      setTimeout(() => setShown(2), 2200),
      setTimeout(() => setDone(2), 3000),
      setTimeout(() => setShown(3), 3500),
      setTimeout(() => setDone(3), 4300),
      setTimeout(finish, durationMs),
    ];
    return () => ids.forEach(clearTimeout);
  }, [durationMs, finish]);

  const lines = ["Mapping your gaps", "Ordering skills", `Planning ${weeks} week${weeks === 1 ? "" : "s"}`];

  return (
    <div className="contour min-h-dvh">
      <header className="mx-auto flex h-[72px] max-w-5xl items-center px-5">
        <span className="font-display text-[1.75rem] font-bold leading-none">Ladda</span>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:pt-10">
        <h1 className="display-md">Laying down your trail</h1>
        <p className="mt-3 text-lg text-text-soft">Built from your answers. This takes a few seconds.</p>

        <div className="relative mt-8 aspect-[1100/760] overflow-hidden rounded-[1.25rem] border border-line bg-understory">
          <ContourBackdrop />
          <div className="absolute inset-0">
            <RoadmapTrail nodes={nodes} layout="wide" />
          </div>
        </div>

        <ul className="mt-6 flex min-h-12 flex-wrap gap-x-6 gap-y-2" aria-live="polite">
          {lines.slice(0, shown).map((text, i) => (
            <li key={text} className="flex items-center gap-2 font-medium">
              <span
                aria-hidden="true"
                className={`grid size-5 place-items-center rounded-full border-2 ${
                  i < done ? "border-volt bg-volt text-[#04110a]" : "border-node-mute"
                }`}
              >
                {i < done && <Check className="size-3" strokeWidth={3} />}
              </span>
              {text}
              <span className="sr-only">{i < done ? ", done" : ", working"}</span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={finish} className="btn btn-secondary mt-6">
          Skip to my roadmap
        </button>
      </main>
    </div>
  );
}
