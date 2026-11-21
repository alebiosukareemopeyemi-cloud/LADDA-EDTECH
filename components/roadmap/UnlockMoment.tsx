"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NodeMarker from "@/components/NodeMarker";
import type { RoadmapNode } from "@/lib/contract";
import { unlockChain, unlockStep, usePlayProps } from "@/lib/motion";

// The verified skill lights up, then each skill it opens lights up in turn.
export default function UnlockMoment({
  verified,
  unlocked,
  complete,
}: {
  verified: RoadmapNode;
  unlocked: RoadmapNode[];
  complete: boolean;
}) {
  const play = usePlayProps();
  const shown = unlocked.slice(0, 3);

  return (
    <div className="mt-8 border-t border-line pt-6">
      <motion.div
        variants={unlockChain(0.4, 0.15)}
        initial={play.initial}
        animate="show"
        className="flex flex-wrap items-start gap-x-2"
      >
        <motion.div variants={unlockStep}>
          <NodeMarker state="verified" label={verified.title.replace(/ (and|with) /i, "\n$1 ")} size={150} />
        </motion.div>
        {shown.map((n) => (
          <motion.div key={n.id} variants={unlockStep}>
            <NodeMarker state="todo" label={n.title.replace(/ (and|with) /i, "\n$1 ")} size={150} />
          </motion.div>
        ))}
      </motion.div>

      <p role="status" className="mt-2 text-lg font-medium">
        {complete
          ? "Every skill on your path is verified."
          : unlocked.length > 0
            ? `Unlocked: ${unlocked.map((n) => n.title).join(", ")}.`
            : "Nothing new unlocked yet. Your next skills are waiting on other skills."}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {complete ? (
          <Link href="/roadmap/complete" className="btn btn-primary">
            Get your credential
          </Link>
        ) : (
          <Link href="/roadmap" className="btn btn-primary">
            Back to roadmap
          </Link>
        )}
      </div>
    </div>
  );
}
