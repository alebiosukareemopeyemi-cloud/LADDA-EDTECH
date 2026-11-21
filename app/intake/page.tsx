"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import catalog from "@/content/catalog/backend.json";
import { IntakeShell } from "@/components/intake/IntakeShell";
import { StageStep } from "@/components/intake/StageStep";
import { TargetStep, targetCopy } from "@/components/intake/TargetStep";
import { KnownStep, type KnownSkill } from "@/components/intake/KnownStep";
import { TimeStep } from "@/components/intake/TimeStep";
import { BuildingStep } from "@/components/intake/BuildingStep";
import { buildRoadmap, completeIntake, suggestPaths } from "@/lib/api/client";
import { hoursSavedBy, knowableSkills, planPace } from "@/lib/intake/planner";
import type { BuildRoadmapRequest, PathSuggestion, Roadmap, Stage } from "@/lib/contract";

const KNOWABLE: KnownSkill[] = knowableSkills().map((s) => ({
  id: s.id,
  title: s.title,
  phase: s.phase as "foundations" | "core",
  hours: s.hours,
}));

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [interests, setInterests] = useState("");
  const [paths, setPaths] = useState<PathSuggestion[] | null>(null);
  const [known, setKnown] = useState<string[]>([]);
  const [hours, setHours] = useState(10);
  const [horizon, setHorizon] = useState<number | null>(12);
  const [built, setBuilt] = useState<Roadmap | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const finished = useRef(false);

  function go(n: number) {
    setProblem(null);
    setStep(n);
  }

  function pickStage(s: Stage) {
    setProblem(null);
    if (s !== stage) {
      setStage(s);
      setRole(null);
      setPaths(null);
    }
  }

  // University is not asked here: the server reads it from the profile made at sign-up.
  // The contract needs 2+ characters, so a placeholder goes in this field.
  function request(s: Stage): BuildRoadmapRequest {
    return {
      stage: s,
      university: "From profile",
      targetRoleId: role ?? catalog.roleId,
      hoursPerWeek: hours,
      horizonWeeks: horizon,
      knownSkillIds: known,
    };
  }

  async function buildPath() {
    if (!stage || busy) return;
    setBusy(true);
    setProblem(null);
    const res = await buildRoadmap(request(stage));
    setBusy(false);
    if (!res.ok) {
      setProblem(`We could not build your path: ${res.message} Check your connection and select Build my path again.`);
      return;
    }
    setBuilt(res.data.roadmap);
    go(4);
  }

  async function finish() {
    if (finished.current || !stage) return;
    finished.current = true;
    const res = await completeIntake(request(stage));
    if (!res.ok) console.warn("Intake answers were not saved:", res.message);
    router.push("/roadmap");
  }

  if (step === 0 || !stage) {
    return (
      <IntakeShell
        step={0}
        title="Where are you right now?"
        subtitle="Pick one. We tailor everything to it."
        problem={problem}
        primaryLabel="Continue"
        onPrimary={() => {
          if (!stage) setProblem("Pick one option to continue: aspirant, studying or graduating.");
          else go(1);
        }}
      >
        <StageStep value={stage} onChange={pickStage} />
      </IntakeShell>
    );
  }

  if (step === 1) {
    const copy = targetCopy(stage);
    return (
      <IntakeShell
        step={1}
        title={copy.title}
        subtitle={copy.subtitle}
        problem={problem}
        onBack={() => go(0)}
        primaryLabel="Continue"
        onPrimary={() => {
          if (!role) {
            setProblem(
              stage === "aspirant"
                ? "Pick a path from your results to continue. Write what you enjoy and select Find my paths first."
                : "Pick a path to continue. Only Backend Engineer is open right now."
            );
          } else go(2);
        }}
      >
        <TargetStep
          stage={stage}
          value={role}
          onChange={(id) => {
            setProblem(null);
            setRole(id);
          }}
          availableRoleIds={[catalog.roleId]}
          interests={interests}
          onInterests={setInterests}
          paths={paths}
          onPaths={setPaths}
          onSuggest={async (text) => {
            const res = await suggestPaths(text);
            return res.ok ? res.data.paths : [];
          }}
        />
      </IntakeShell>
    );
  }

  if (step === 2) {
    return (
      <IntakeShell
        step={2}
        title="Anything you already know?"
        subtitle="Select what you are comfortable with. We skip the learning and you go straight to proving it."
        onBack={() => go(1)}
        primaryLabel="Continue"
        onPrimary={() => go(3)}
        secondaryLabel={known.length === 0 ? "Skip for now" : undefined}
        onSecondary={() => go(3)}
      >
        <KnownStep skills={KNOWABLE} value={known} onChange={setKnown} hoursSaved={hoursSavedBy(known)} />
      </IntakeShell>
    );
  }

  if (step === 4 && built) {
    return <BuildingStep nodes={built.nodes} weeks={built.weeksLeft} onDone={finish} />;
  }

  const p = planPace(known, hours, horizon);

  return (
    <IntakeShell
      step={3}
      title="How much time can you give?"
      subtitle="We plan your path around it."
      problem={problem}
      onBack={() => go(2)}
      primaryLabel={busy ? "Building your path" : "Build my path"}
      primaryDisabled={busy}
      onPrimary={buildPath}
    >
      <TimeStep
        hoursPerWeek={hours}
        onHours={setHours}
        horizon={horizon}
        onHorizon={setHorizon}
        pace={{ message: p.message, fits: p.fits !== false, suggestedHours: p.suggestedHours }}
      />
    </IntakeShell>
  );
}
