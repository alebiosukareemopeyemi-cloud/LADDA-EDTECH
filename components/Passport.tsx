"use client";

import { motion } from "framer-motion";
import { guillochePaths } from "@/lib/guilloche";
import { mrzLines } from "@/lib/credential/mrz";
import { sealTransition, usePlay } from "@/lib/motion";

export type PassportStatus = "valid" | "invalid" | "revoked";

type Props = {
  name: string;
  university: string;
  track: string;
  hours: number | string | null;
  projects: number;
  /** Shown as written, for example "14 Nov 2026". */
  issued: string;
  /** ISO date, used for the machine-readable strip. */
  issuedIso: string;
  id: string;
  summary?: string;
  signature?: string;
  status?: PassportStatus;
  /** Change this to stamp the seal again. */
  stampKey?: string | number;
  /** Use "h1" when the passport is the main heading of its page. */
  nameAs?: "h1" | "p";
  className?: string;
};

const BAND = guillochePaths({ width: 720, height: 96 });
const SEAL_TEXT: Record<PassportStatus, string> = { valid: "Valid", invalid: "Invalid", revoked: "Revoked" };

const soft = { color: "var(--ink-soft)" } as const;
const serif = { fontFamily: "var(--font-serif)" } as const;
const rule = { borderColor: "rgb(11 24 18 / 0.22)" } as const;

// The credential as a paper passport page: the one light surface in the product.
export default function Passport({
  name,
  university,
  track,
  hours,
  projects,
  issued,
  issuedIso,
  id,
  summary,
  signature,
  status = "valid",
  stampKey = 0,
  nameAs: Name = "p",
  className = "",
}: Props) {
  const play = usePlay();
  const mrz = mrzLines({ name, id, hours: hours ?? 0, projects, issuedIso });
  const shortSig = signature && signature.length > 36 ? `${signature.slice(0, 24)}…${signature.slice(-8)}` : signature;

  const ledger = [
    { label: "University", value: university },
    { label: "Verified hours", value: hours === null ? "Not recorded" : `${hours}h`, data: hours !== null },
    { label: "Projects reviewed", value: String(projects), data: true },
    { label: "Issued", value: issued },
  ];

  return (
    <article className={`passport overflow-hidden ${className}`} aria-label={`Credential for ${name}`}>
      {/* Guilloche band */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 720 96"
        preserveAspectRatio="none"
        className="block h-20 w-full md:h-24"
      >
        <g fill="none" stroke="#6E9A7E" strokeOpacity="0.55" strokeWidth="0.8">
          {BAND.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>

      <motion.div
        key={stampKey}
        initial={play ? { scale: 1.7, rotate: -16, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ ...sealTransition, delay: 0.3 }}
        className="seal absolute right-6 top-10 size-24 text-center text-lg leading-tight md:right-10 md:top-12 md:size-28 md:text-xl"
        style={
          status === "invalid"
            ? { background: "var(--color-ember)", boxShadow: "inset 0 0 0 3px var(--color-ember), inset 0 0 0 4.5px rgb(11 24 18 / 0.7)" }
            : undefined
        }
      >
        {SEAL_TEXT[status]}
      </motion.div>

      <div className="px-6 pb-8 pt-6 md:px-10 md:pb-10">
        <p className="text-lg italic" style={{ ...serif, ...soft }}>
          <span className="font-semibold not-italic" style={{ color: "var(--ink)" }}>
            Ladda
          </span>{" "}
          Verified skills credential
        </p>

        <Name
          className="mt-5 max-w-[16ch] text-[clamp(2.25rem,7vw,3.375rem)] font-semibold leading-[1.02]"
          style={{ ...serif, fontWeight: 600, letterSpacing: 0 }}
        >
          {name}
        </Name>
        <h2 className="mt-2 font-display text-[clamp(2.75rem,9vw,4rem)] font-bold leading-[0.95]">{track}</h2>

        <dl className="mt-8 grid grid-cols-2 border-y" style={rule}>
          {ledger.map((f, i) => (
            <div
              key={f.label}
              className={`px-0 py-4 ${i % 2 === 1 ? "border-l pl-5" : "pr-5"} ${i > 1 ? "border-t" : ""}`}
              style={rule}
            >
              <dt className="text-sm italic" style={{ ...serif, ...soft }}>
                {f.label}
              </dt>
              <dd className={`mt-1 ${f.data ? "data text-xl font-semibold" : "text-lg"}`} style={f.data ? undefined : serif}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        {summary && (
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.65]" style={serif}>
            {summary}
          </p>
        )}

        <p className="mt-6 text-sm italic" style={{ ...serif, ...soft }}>
          Credential ID <span className="data not-italic font-semibold" style={{ color: "var(--ink)" }}>{id}</span>
        </p>
        {shortSig && (
          <p className="data mt-1 break-all text-xs" style={soft}>
            signature {shortSig}
          </p>
        )}

        {/* Machine-readable strip */}
        <div
          aria-hidden="true"
          className="data mt-6 select-none overflow-hidden rounded-[2px] px-3 py-2 text-[0.72rem] leading-[1.5] tracking-[0.12em]"
          style={{ background: "rgb(11 24 18 / 0.07)", color: "var(--ink-soft)" }}
        >
          <p className="whitespace-nowrap">{mrz[0]}</p>
          <p className="whitespace-nowrap">{mrz[1]}</p>
        </div>
      </div>
    </article>
  );
}
