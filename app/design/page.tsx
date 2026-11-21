"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Wrench } from "lucide-react";
import RevealText from "@/components/ui/RevealText";
import SparkBurst from "@/components/ui/SparkBurst";
import {
  unlockChain,
  unlockStep,
  useCountUp,
  useMagnetic,
  useTilt,
} from "@/lib/motion";

type NodeState = "verified" | "known" | "progress" | "todo" | "locked";

const palette = [
  { name: "Pitch", hex: "#050E0A", use: "Page background" },
  { name: "Canopy", hex: "#0C1B14", use: "Raised surfaces" },
  { name: "Moss", hex: "#047857", use: "Gradient start, verified edges" },
  { name: "Volt", hex: "#BEF264", use: "Gradient end, primary action, focus" },
  { name: "Kola", hex: "#F2A93B", use: "Needs work, credential seal" },
  { name: "Bone", hex: "#EDF2E4", use: "Text" },
];

const nodeKinds: { state: NodeState; label: string; note: string }[] = [
  { state: "verified", label: "Verified", note: "Project approved" },
  { state: "known", label: "Known", note: "Matched from your CV" },
  { state: "progress", label: "In progress", note: "You are here" },
  { state: "todo", label: "Not started", note: "Ready when you are" },
  { state: "locked", label: "Locked", note: "Finish the step before" },
];

function Node({ state, n }: { state: NodeState; n?: number }) {
  return (
    <span className={`node node-${state}`}>
      {state === "locked" ? <Lock aria-label="Locked" /> : state === "verified" ? <Check aria-label="Verified" /> : n}
    </span>
  );
}

function MagneticButton({ children }: { children: React.ReactNode }) {
  const magnet = useMagnetic(0.3);
  return (
    <motion.button className="btn btn-primary" {...magnet}>
      {children}
    </motion.button>
  );
}

function Heading({ children, note }: { children: string; note?: string }) {
  return (
    <div className="mb-8">
      <h2 className="display-md">{children}</h2>
      {note && <p className="measure mt-3 text-muted-foreground">{note}</p>}
    </div>
  );
}

export default function DesignPage() {
  const [light, setLight] = useState(false);
  const [chips, setChips] = useState<string[]>(["10 hours"]);
  const [unlock, setUnlock] = useState(0);
  const [spark, setSpark] = useState(0);
  const [counting, setCounting] = useState(false);
  const tilt = useTilt(9);
  const hours = useCountUp(96, { start: counting });

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    setLight((v) => !v);
  }
  function toggleChip(c: string) {
    setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-28 px-6 pb-32 pt-24">
      {/* Floating glass nav (glass surface 1 of 3) */}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex justify-center">
        <nav aria-label="Design page" className="nav-float glass">
          <span className="px-4 font-heading text-lg font-extrabold">Ladda</span>
          <div className="flex items-center gap-1">
            <a className="nav-link" href="#type">Type</a>
            <a className="nav-link" href="#controls">Controls</a>
            <a className="nav-link" href="#nodes">Nodes</a>
            <a className="nav-link" href="#glass">Glass</a>
          </div>
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
            {light ? "Dark mode" : "Light mode"}
          </button>
        </nav>
      </div>

      {/* Hero: the headline is the shape */}
      <section className="relative">
        <RevealText as="h1" className="display max-w-4xl" text="Pick right. Learn real. Get hired." />
        <p className="measure mt-8 text-lg text-muted-foreground">
          Build backend projects that get checked. Earn a signed credential an employer can verify
          in seconds, with no account.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <MagneticButton>Start free</MagneticButton>
          <button className="btn btn-glass">Sign in</button>
          <button className="btn btn-ghost">Check a credential</button>
        </div>
      </section>

      {/* Palette: one dominant swatch, the rest in a row */}
      <section>
        <Heading note="Six names. The gradient is Moss to Volt and appears only on verified, primary actions and the seal ring.">
          Colour
        </Heading>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-56 overflow-hidden rounded-surface bg-brand p-6 text-pitch">
            <p className="font-heading text-3xl font-extrabold">Moss to Volt</p>
            <p className="data mt-2">#047857 to #BEF264</p>
          </div>
          <div className="surface-1 flex flex-col justify-between p-6">
            <p className="text-muted-foreground">Kola only means a person looked.</p>
            <div className="flex items-center gap-4">
              <span className="seal grid size-16 place-items-center font-heading text-xl font-extrabold">
                L
              </span>
              <span className="badge badge-needs-work">
                <Wrench /> Needs work
              </span>
            </div>
          </div>
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
          {palette.map((c) => (
            <li key={c.name} className="flex items-center gap-3">
              <span
                className="size-9 rounded-inner border border-border"
                style={{ background: c.hex }}
                aria-hidden="true"
              />
              <span>
                <span className="block font-medium leading-tight">{c.name}</span>
                <span className="data text-muted-foreground">{c.hex}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Surfaces: nested to show the steps */}
      <section>
        <Heading note="Depth comes from surface level. Each step is lighter and has a crisper top edge. Menus are opaque, never glass.">
          Surfaces
        </Heading>
        <div className="surface-0 rounded-surface border border-border p-5">
          <p className="mb-3 text-sm text-muted-foreground">Page</p>
          <div className="surface-1 p-5">
            <p className="mb-3 text-sm text-muted-foreground">Panel</p>
            <div className="flex flex-wrap gap-3">
              <div className="surface-2 px-5 py-4">Inner block</div>
              <div className="surface-3 px-6 py-4">Menu or popover</div>
            </div>
          </div>
        </div>
      </section>

      {/* Type */}
      <section id="type">
        <Heading note="Anybody for headlines, set wide for the hero and narrower for sections. Onest for everything you read. System mono for data only.">
          Type
        </Heading>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p className="display">Verified, not claimed.</p>
            <p className="display-md">Projects a reviewer actually ran</p>
            <p className="font-heading text-2xl font-bold">Card title in display, width 108</p>
          </div>
          <div className="space-y-4">
            <p className="measure">
              Onest body at 1rem, line height 1.55, capped at 68 characters so lines never run past
              eighty. Sentence case, no tracked capitals.
            </p>
            <p className="text-muted-foreground">Muted text for secondary lines.</p>
            <p className="tag-label text-muted-foreground">Label: plain, sentence case</p>
            <p>
              Real data only: <span className="data">a91f3c07</span>, <span className="data">demo-001</span>,{" "}
              <span className="data">96h</span>
            </p>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section id="controls">
        <Heading note="Pills for controls. Large radius for main surfaces. Small for inner elements. Near-sharp for the credential.">
          Controls
        </Heading>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary">Start free</button>
              <button className="btn btn-glass">Sign in</button>
              <button className="btn btn-ghost">Maybe later</button>
              <button className="btn btn-glass" disabled>
                Disabled
              </button>
              <button className="btn btn-primary btn-sm">Submit project</button>
            </div>
            <div className="space-y-3">
              <label htmlFor="d-email" className="text-sm font-medium">
                Email address
              </label>
              <input id="d-email" className="field" type="email" placeholder="you@university.edu.ng" />
              <input className="field" aria-label="Invalid example" aria-invalid="true" defaultValue="not-an-email" />
              <p className="text-sm text-destructive">Enter an email like name@school.edu.ng.</p>
              <textarea className="field" aria-label="Project notes" placeholder="What did you build, and how can a reviewer run it?" />
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-medium">How many hours a week can you give?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Hours per week">
                {["5 hours", "10 hours", "15 hours", "20+ hours"].map((c) => (
                  <button
                    key={c}
                    className="chip"
                    aria-pressed={chips.includes(c)}
                    onClick={() => toggleChip(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-verified"><Check /> Verified</span>
              <span className="badge badge-known">Known</span>
              <span className="badge badge-progress">In progress</span>
              <span className="badge badge-todo">Not started</span>
              <span className="badge badge-locked"><Lock /> Locked</span>
              <span className="badge badge-needs-work"><Wrench /> Needs work</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Loading</p>
              <div className="skeleton h-4 w-64 rounded-full" />
              <div className="skeleton h-4 w-44 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Node states and unlock chain */}
      <section id="nodes">
        <Heading note="Verified is the only node that glows. Known keeps its tint, in progress pulses, locked recedes.">
          Node states
        </Heading>
        <ul className="flex flex-wrap items-start gap-x-10 gap-y-6">
          {nodeKinds.map((k, i) => (
            <li key={k.state} className="flex items-center gap-3">
              <Node state={k.state} n={i + 1} />
              <span>
                <span className="block font-medium leading-tight">{k.label}</span>
                <span className="text-sm text-muted-foreground">{k.note}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="surface-1 mt-10 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">Unlock chain</p>
            <button className="btn btn-glass btn-sm" onClick={() => setUnlock((u) => u + 1)}>
              Play unlock
            </button>
          </div>
          <motion.div
            key={unlock}
            variants={unlockChain(0.28, 0.1)}
            initial="hidden"
            animate="show"
            className="flex items-center gap-3"
          >
            {(["verified", "known", "progress", "todo"] as NodeState[]).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-3 last:flex-none">
                <motion.span variants={unlockStep} className="relative inline-flex">
                  <Node state={s} n={i + 1} />
                </motion.span>
                {i < 3 && <span className="h-0.5 flex-1 rounded-full bg-border" />}
              </div>
            ))}
          </motion.div>
          <div className="mt-8 flex items-center gap-4">
            <span className="relative inline-flex">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSpark((s) => s + 1)}
              >
                Approve project
              </button>
              <SparkBurst fire={spark} />
            </span>
            <span className="text-sm text-muted-foreground">Spark burst plays on approval.</span>
          </div>
        </div>
      </section>

      {/* Glass: the credential and narrator card, plus tilt and count-up */}
      <section id="glass">
        <Heading note="Glass lives on three surfaces only: the floating nav above, the tour narrator card, and the credential.">
          Glass and depth
        </Heading>
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="glass rounded-surface p-6">
            <p className="font-medium">Your next step</p>
            <p className="measure mt-2 text-muted-foreground">
              Build a small API that stores notes, then submit the repo link. A reviewer will run it.
            </p>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-primary btn-sm">Open the brief</button>
              <button className="btn btn-ghost btn-sm">Skip tour</button>
            </div>
          </div>

          <motion.div
            {...tilt}
            className="glass credential relative p-8"
            onViewportEnter={() => setCounting(true)}
          >
            <span className="seal absolute right-6 top-6 grid size-16 place-items-center font-heading font-extrabold">
              Valid
            </span>
            <p className="text-sm text-muted-foreground">Ladda credential</p>
            <p className="display-md mt-2">Backend with Node.js</p>
            <p className="mt-4 text-muted-foreground">Amina Bello completed every required project.</p>
            <dl className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-muted-foreground">Verified hours</dt>
                <dd className="data text-2xl font-bold">{hours}h</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Credential ID</dt>
                <dd className="data text-lg">demo-001</dd>
              </div>
            </dl>
            <p className="data mt-6 break-all text-muted-foreground">
              sig 9f2ac3e18b47d05a6c1e
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
