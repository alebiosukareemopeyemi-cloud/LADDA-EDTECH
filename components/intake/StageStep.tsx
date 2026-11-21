"use client";

import type { Stage } from "@/lib/contract";
import { ChoiceRow } from "./ChoiceRow";

const OPTIONS: { id: Stage; title: string; text: string }[] = [
  { id: "aspirant", title: "Aspirant", text: "I am picking a course or a career" },
  { id: "studying", title: "Studying", text: "I am in school and building skills" },
  { id: "graduating", title: "Graduating", text: "I am in my final year and need to get hired" },
];

type Props = {
  value: Stage | null;
  onChange: (stage: Stage) => void;
};

export function StageStep({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="sr-only">Where are you right now?</legend>
      <div className="divide-y divide-line border-y border-line">
        {OPTIONS.map((o) => (
          <ChoiceRow
            key={o.id}
            name="stage"
            value={o.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
            title={o.title}
            text={o.text}
          />
        ))}
      </div>
    </fieldset>
  );
}
