"use client";

import { Info } from "lucide-react";

export type KnownSkill = {
  id: string;
  title: string;
  phase: "foundations" | "core";
  hours: number;
};

type Props = {
  skills: KnownSkill[];
  value: string[]; // ticked skill ids
  onChange: (ids: string[]) => void;
  hoursSaved: number;
};

const GROUPS = [
  { id: "foundations", label: "Foundations" },
  { id: "core", label: "Core" },
] as const;

export function KnownStep({ skills, value, onChange, hoursSaved }: Props) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="space-y-8">
      {GROUPS.map((g) => {
        const list = skills.filter((s) => s.phase === g.id);
        if (list.length === 0) return null;
        return (
          <section key={g.id} aria-labelledby={`known-${g.id}`}>
            <h2 id={`known-${g.id}`} className="font-display text-2xl font-semibold leading-none">
              {g.label}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {list.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  aria-pressed={value.includes(s.id)}
                  onClick={() => toggle(s.id)}
                >
                  {s.title}
                  <span className="data text-text-mute">{s.hours}h</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <p role="status" className="min-h-7 text-lg font-medium">
        {hoursSaved > 0 ? (
          <>
            This saves you about <span className="data">{hoursSaved}h</span> of learning.
          </>
        ) : null}
      </p>

      <p className="flex items-start gap-2 text-sm text-text-mute">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Known skills still need a project to be verified. This only skips the learning.
      </p>
    </div>
  );
}
