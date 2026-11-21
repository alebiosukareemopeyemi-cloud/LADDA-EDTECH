"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Wrench, X } from "lucide-react";
import NodeMarker, { type NodeState } from "@/components/NodeMarker";
import Trail from "@/components/Trail";
import { NODE_SHAPES } from "@/lib/node-shapes";
import { sealStamp, unlockChain, unlockStep, usePlayProps } from "@/lib/motion";

const palette = [
  { name: "night", hex: "#050B08", use: "Page" },
  { name: "understory", hex: "#0B1812", use: "Surfaces" },
  { name: "line", hex: "#16301F", use: "Hairlines" },
  { name: "line-strong", hex: "#2B4A39", use: "Raised edges" },
  { name: "moss", hex: "#047857", use: "Gradient start" },
  { name: "volt", hex: "#BEF264", use: "Verified, primary, focus" },
  { name: "lake", hex: "#7FD8C4", use: "Known" },
  { name: "kola", hex: "#F2A93B", use: "Seal, needs work" },
  { name: "ember", hex: "#FF6B57", use: "Invalid, error" },
  { name: "paper", hex: "#E9EDDF", use: "Credential only" },
  { name: "text", hex: "#EDF2E4", use: "Text" },
  { name: "text-soft", hex: "#C9D6CC", use: "Secondary text" },
  { name: "text-mute", hex: "#A7B8AB", use: "Hints" },
  { name: "node-mute", hex: "#6E8A7A", use: "Todo, locked, input edges" },
];

const states: { state: NodeState; label: string }[] = [
  { state: "verified", label: "Git and GitHub" },
  { state: "known", label: "HTTP basics" },
  { state: "in_progress", label: "SQL and Postgres" },
  { state: "todo", label: "Build an API" },
  { state: "locked", label: "Auth and security" },
];

// One winding route. Waypoints sit along it.
const ROUTE = "M70 230 C 190 230, 220 90, 360 90 S 540 240, 650 200 S 790 90, 840 90";
const stops: { x: number; y: number; state: NodeState; label: string; percent?: number }[] = [
  { x: 70, y: 230, state: "verified", label: "JS and TS" },
  { x: 360, y: 90, state: "known", label: "Git" },
  { x: 650, y: 200, state: "in_progress", label: "SQL", percent: 60 },
  { x: 840, y: 90, state: "locked", label: "Deploy" },
];
const M = 104; // marker render size inside the trail svg

function Section({ title, note, children, id }: { title: string; note?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="space-y-6">
      <div>
        <h2 className="display-md">{title}</h2>
        {note && <p className="measure mt-3 text-text-mute">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [chips, setChips] = useState<string[]>(["10 hours"]);
  const [percent, setPercent] = useState(60);
  const [selected, setSelected] = useState(false);
  const [grey, setGrey] = useState(false);
  const [run, setRun] = useState(0);
  const play = usePlayProps();

  function toggleChip(c: string) {
    setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-24 px-6 pb-32 pt-16">
      {/* Hero */}
      <header>
        <h1 className="display max-w-3xl">Pick right. Learn real. Get hired.</h1>
        <p className="measure mt-8 text-lg text-text-soft">
          Walk a trail of backend skills, plant a flag on each one, and finish with a signed credential
          an employer can check without an account.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button className="btn btn-primary btn-lg">Start free</button>
          <button className="btn btn-secondary btn-lg">Sign in</button>
          <button className="btn btn-ghost btn-lg">Check a credential</button>
        </div>
      </header>

      {/* Trail on contour lines */}
      <Section
        title="The trail"
        note="Dotted route, finished stretch in solid volt with a soft glow. It draws itself once. Waypoints are markers, not numbers."
      >
        <div className="contour overflow-hidden rounded-[1.25rem] border border-line p-2">
          <div className="mb-1 flex justify-end">
            <button className="btn btn-secondary" onClick={() => setRun((r) => r + 1)}>
              Draw the trail again
            </button>
          </div>
          <svg key={run} viewBox="0 0 910 330" className="w-full" role="group" aria-label="Sample trail">
            <Trail d={ROUTE} progress={0.55} />
            {stops.map((s) => (
              <g key={s.label} transform={`translate(${s.x - M / 2} ${s.y - (M * 100) / 240})`}>
                <NodeMarker state={s.state} percent={s.percent} label={s.label} size={M} />
              </g>
            ))}
          </svg>
        </div>
      </Section>

      {/* Node markers */}
      <Section
        title="Waypoints"
        note="Shape carries the meaning and colour only backs it up. Switch to greyscale to check: every state is still different."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button className="chip" aria-pressed={grey} onClick={() => setGrey((g) => !g)}>
            Greyscale
          </button>
          <button className="chip" aria-pressed={selected} onClick={() => setSelected((s) => !s)}>
            Selected
          </button>
          <label className="flex items-center gap-3 text-sm text-text-soft">
            In progress
            <input
              type="range"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              aria-label="In progress percent"
              className="accent-[#BEF264]"
            />
            <span className="data w-10">{percent}%</span>
          </label>
        </div>
        <div className={`surface flex flex-wrap items-start justify-between gap-4 p-6 ${grey ? "grayscale" : ""}`}>
          {states.map((s) => (
            <div key={s.state} className="flex flex-col items-center">
              <NodeMarker
                state={s.state}
                label={s.label}
                percent={percent}
                selected={selected && s.state === "in_progress"}
                size={150}
              />
              <p className="-mt-6 text-sm text-text-mute">{NODE_SHAPES[s.state].text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge badge-verified"><Check /> Verified</span>
          <span className="badge badge-known">Known</span>
          <span className="badge badge-progress">In progress</span>
          <span className="badge badge-todo">Not started</span>
          <span className="badge badge-locked"><Lock /> Locked</span>
          <span className="badge badge-needs-work"><Wrench /> Needs work</span>
          <span className="badge badge-invalid"><X /> Invalid</span>
        </div>
      </Section>

      {/* Unlock chain */}
      <Section title="Unlock chain" note="Finish a skill and the next waypoints light up one after another.">
        <div className="surface p-6">
          <button className="btn btn-secondary mb-4" onClick={() => setRun((r) => r + 1)}>
            Play unlock
          </button>
          <motion.div
            key={`u${run}`}
            variants={unlockChain(0.35, 0.2)}
            initial={play.initial}
            animate="show"
            className="flex items-start justify-around"
          >
            {states.slice(0, 4).map((s, i) => (
              <motion.div key={s.label} variants={unlockStep}>
                <NodeMarker
                  state={i === 0 ? "verified" : i === 3 ? "todo" : "known"}
                  label={s.label}
                  size={130}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* Type and colour */}
      <Section title="Type and colour" id="type">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <p className="display">Verified, not claimed.</p>
            <p className="waypoint-name">Waypoint name: Barlow Condensed 600, 22px</p>
            <p className="measure text-text-soft">
              Barlow for all app text at 17px, line height 1.6, capped at 65 characters a line. Sentence
              case everywhere. The serif face appears on the credential and nowhere else.
            </p>
            <p>
              Data only: <span className="data">a91f3c07</span>, <span className="data">demo-001</span>
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 self-start">
            {palette.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="size-8 shrink-0 rounded-full border border-line-strong" style={{ background: c.hex }} aria-hidden="true" />
                <span className="leading-tight">
                  <span className="block text-sm font-medium">{c.name}</span>
                  <span className="data text-text-mute">{c.hex}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Controls */}
      <Section title="Controls" id="controls">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <label htmlFor="d-email" className="text-sm font-medium">
              Email address
            </label>
            <input id="d-email" className="field" type="email" placeholder="you@university.edu.ng" />
            <input className="field" aria-label="Invalid example" aria-invalid="true" defaultValue="not-an-email" />
            <p className="text-sm text-ember">Enter an email like name@school.edu.ng.</p>
            <textarea className="field" aria-label="Project notes" placeholder="What did you build, and how can a reviewer run it?" />
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium">How many hours a week can you give?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Hours per week">
                {["5 hours", "10 hours", "15 hours", "20+ hours"].map((c) => (
                  <button key={c} className="chip" aria-pressed={chips.includes(c)} onClick={() => toggleChip(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-mute">Loading</p>
              <div className="skeleton h-4 w-64 rounded-full" />
              <div className="skeleton h-4 w-44 rounded-full" />
            </div>
          </div>
        </div>
      </Section>

      {/* Passport: the only light surface */}
      <Section
        title="The passport"
        note="The credential is the one light surface. Newsreader appears here only. The seal stamps on once."
      >
        <div className="passport mx-auto max-w-2xl p-10 md:p-12">
          <motion.div
            key={`s${run}`}
            variants={sealStamp}
            initial={play.initial}
            animate="show"
            className="seal absolute right-10 top-10 size-24 text-center text-lg leading-tight"
            aria-label="Valid"
          >
            Valid
          </motion.div>
          <p className="text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Ladda credential
          </p>
          <h3 className="mt-2 max-w-[14ch] font-display text-5xl font-bold">Backend with Node.js</h3>
          <p className="mt-6 text-lg">
            This passport confirms that <em>Amina Bello</em> completed every required project and that each
            one was reviewed.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-[rgb(11_24_18/0.25)] pt-6">
            <div>
              <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Verified hours</dt>
              <dd className="data text-xl font-semibold">96h</dd>
            </div>
            <div>
              <dt className="text-sm italic" style={{ color: "var(--ink-soft)" }}>Credential ID</dt>
              <dd className="data text-xl font-semibold">demo-001</dd>
            </div>
          </dl>
          <p className="data mt-6 break-all" style={{ color: "var(--ink-soft)" }}>
            sig 9f2ac3e18b47d05a6c1e
          </p>
          <button className="btn btn-secondary mt-8" style={{ background: "transparent", color: "var(--ink)", borderColor: "var(--ink)" }} onClick={() => setRun((r) => r + 1)}>
            Stamp again
          </button>
        </div>
      </Section>
    </main>
  );
}
