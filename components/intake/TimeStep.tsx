"use client";

import { Check, Clock } from "lucide-react";
import { HORIZON_OPTIONS, HOURS_PER_WEEK_OPTIONS } from "@/lib/contract";

export type Pace = { message: string; fits: boolean; suggestedHours: number | null };

type Props = {
  hoursPerWeek: number;
  onHours: (h: number) => void;
  horizon: number | null; // null = until graduation
  onHorizon: (w: number | null) => void;
  pace: Pace | null;
};

export function TimeStep({ hoursPerWeek, onHours, horizon, onHorizon, pace }: Props) {
  const suggested = pace?.suggestedHours ?? null;

  return (
    <div className="space-y-10">
      <section aria-labelledby="hours-label">
        <h2 id="hours-label" className="font-display text-2xl font-semibold leading-none">
          Hours a week
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOURS_PER_WEEK_OPTIONS.map((h) => (
            <button key={h} type="button" className="chip" aria-pressed={hoursPerWeek === h} onClick={() => onHours(h)}>
              {h} hours
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="horizon-label">
        <h2 id="horizon-label" className="font-display text-2xl font-semibold leading-none">
          How long do you want to take?
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {HORIZON_OPTIONS.map((w) => (
            <button
              key={String(w)}
              type="button"
              className="chip"
              aria-pressed={horizon === w}
              onClick={() => onHorizon(w)}
            >
              {w === null ? "Until graduation" : `${w} weeks`}
            </button>
          ))}
        </div>
      </section>

      {pace && (
        <div role="status" className={`border-l-2 pl-4 ${pace.fits ? "border-volt" : "border-kola"}`}>
          <p className="flex items-start gap-2 text-lg font-medium">
            {pace.fits ? (
              <Check className="mt-1 size-5 shrink-0 text-volt" aria-hidden="true" />
            ) : (
              <Clock className="mt-1 size-5 shrink-0 text-kola" aria-hidden="true" />
            )}
            {pace.message}
          </p>
          {!pace.fits && suggested !== null && (
            <button type="button" onClick={() => onHours(suggested)} className="btn btn-secondary mt-3">
              Try {suggested} hours a week
            </button>
          )}
        </div>
      )}
    </div>
  );
}
