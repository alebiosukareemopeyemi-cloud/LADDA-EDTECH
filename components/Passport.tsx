"use client";

import { motion } from "framer-motion";
import { sealTransition, usePlay } from "@/lib/motion";

type Props = {
  name: string;
  university: string;
  track: string;
  hours: number | string;
  projects: number;
  issued: string;
  id: string;
  signature?: string;
  /** Change this to stamp the seal again. */
  stampKey?: string | number;
  className?: string;
};

// The credential as a paper passport page. The only light surface in the product.
export default function Passport({
  name,
  university,
  track,
  hours,
  projects,
  issued,
  id,
  signature,
  stampKey = 0,
  className = "",
}: Props) {
  const play = usePlay();
  return (
    <article className={`passport p-8 md:p-10 ${className}`} aria-label={`Credential for ${name}`}>
      <motion.div
        key={stampKey}
        initial={play ? { scale: 1.7, rotate: -16, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ ...sealTransition, delay: 0.3 }}
        className="seal absolute right-8 top-8 size-20 text-center text-base leading-tight md:right-10 md:top-10 md:size-24 md:text-lg"
      >
        Signed
      </motion.div>

      <p className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
        Ladda credential
      </p>
      <h3 className="mt-2 max-w-[10ch] font-display text-5xl font-bold leading-[0.95] md:text-6xl">{track}</h3>
      <p className="mt-6 max-w-[34ch] text-lg">
        This passport confirms that <em>{name}</em> of {university} completed {projects} reviewed projects.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-6" style={{ borderColor: "rgb(11 24 18 / 0.25)" }}>
        <div>
          <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Verified hours
          </dt>
          <dd className="data text-xl font-semibold">{hours}h</dd>
        </div>
        <div>
          <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Projects
          </dt>
          <dd className="data text-xl font-semibold">{projects}</dd>
        </div>
        <div>
          <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Issued
          </dt>
          <dd className="text-lg">{issued}</dd>
        </div>
        <div>
          <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Credential ID
          </dt>
          <dd className="data text-lg font-semibold">{id}</dd>
        </div>
      </dl>

      {signature && (
        <p className="data mt-6 break-all text-xs" style={{ color: "var(--ink-soft)" }}>
          signature {signature}
        </p>
      )}
    </article>
  );
}
