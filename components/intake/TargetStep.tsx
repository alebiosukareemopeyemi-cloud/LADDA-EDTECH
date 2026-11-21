"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { PathSuggestion, Stage } from "@/lib/contract";
import { ChoiceRow } from "./ChoiceRow";

// Title and subtitle for the shell, depending on the stage.
export function targetCopy(stage: Stage) {
  return stage === "aspirant"
    ? { title: "What do you enjoy?", subtitle: "Tell us in your own words. We rank the paths that fit you." }
    : { title: "What do you want to be?", subtitle: "Pick the path you want to climb." };
}

const ROLES: { id: string; title: string; text: string; meta?: string }[] = [
  { id: "backend", title: "Backend Engineer", text: "APIs, databases and servers", meta: "12 skills, about 105 hours" },
  { id: "frontend", title: "Frontend Engineer", text: "The interfaces people use" },
  { id: "data", title: "Data Analyst", text: "Turning data into answers" },
  { id: "devops", title: "DevOps Engineer", text: "Shipping and running software" },
];

const EXAMPLES = [
  "I love solving puzzles",
  "I like building things that work",
  "I enjoy design and visuals",
  "Numbers and patterns excite me",
];

type Props = {
  stage: Stage;
  value: string | null; // chosen role id
  onChange: (roleId: string) => void;
  availableRoleIds: string[]; // roles that are really built, for example ["backend"]
  interests: string;
  onInterests: (text: string) => void;
  paths: PathSuggestion[] | null;
  onPaths: (paths: PathSuggestion[]) => void;
  onSuggest: (interests: string) => Promise<PathSuggestion[]>;
};

function SoonBadge() {
  return (
    <span className="badge badge-locked">
      <Lock aria-hidden="true" /> Coming soon
    </span>
  );
}

function Aspirant({ value, onChange, availableRoleIds, interests, onInterests, paths, onPaths, onSuggest }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function find() {
    if (interests.trim().length < 3) {
      setError("Write a few words about what you enjoy, for example \"I like building things\". Then select Find my paths.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      onPaths(await onSuggest(interests.trim()));
    } catch {
      setError("We could not find paths right now. Check your connection and select Find my paths again.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="interests" className="text-sm font-medium">
          What do you enjoy?
        </label>
        <textarea
          id="interests"
          rows={3}
          maxLength={500}
          value={interests}
          onChange={(e) => onInterests(e.target.value)}
          placeholder="For example: I like building things, solving puzzles, and I am not great at drawing"
          className="field mt-2 resize-none"
          aria-invalid={!!error}
          aria-describedby={error ? "interests-error" : undefined}
        />
        {error && (
          <p id="interests-error" role="alert" className="mt-2 text-sm font-medium text-ember">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip"
            onClick={() => onInterests(interests.trim() ? `${interests.trim()}. ${ex}` : ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      <button type="button" onClick={find} disabled={loading} className="btn btn-secondary">
        {loading ? "Finding paths" : paths ? "Find again" : "Find my paths"}
      </button>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <p className="sr-only">Finding paths that fit you</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-[1.25rem]" />
          ))}
        </div>
      )}

      {!loading && paths && paths.length === 0 && (
        <p className="text-text-soft">
          No paths matched. Add a sentence about what you like doing, then select Find again.
        </p>
      )}

      {!loading && paths && paths.length > 0 && (
        <fieldset>
          <legend className="sr-only">Paths that fit you</legend>
          <div className="divide-y divide-line border-y border-line">
            {paths.map((p) => {
              const available = availableRoleIds.includes(p.roleId);
              return (
                <ChoiceRow
                  key={p.roleId}
                  name="role"
                  value={p.roleId}
                  checked={value === p.roleId}
                  disabled={!available}
                  onChange={() => onChange(p.roleId)}
                  title={p.title}
                  text={p.why}
                  meta={`${p.fit} percent fit`}
                  aside={available ? undefined : <SoonBadge />}
                />
              );
            })}
          </div>
          <p className="mt-3 text-sm text-text-mute">Only Backend Engineer is open for now.</p>
        </fieldset>
      )}
    </div>
  );
}

export function TargetStep(props: Props) {
  if (props.stage === "aspirant") return <Aspirant {...props} />;

  return (
    <fieldset>
      <legend className="sr-only">Choose a path</legend>
      <div className="divide-y divide-line border-y border-line">
        {ROLES.map((r) => {
          const available = props.availableRoleIds.includes(r.id);
          return (
            <ChoiceRow
              key={r.id}
              name="role"
              value={r.id}
              checked={props.value === r.id}
              disabled={!available}
              onChange={() => props.onChange(r.id)}
              title={r.title}
              text={r.text}
              meta={available ? r.meta : undefined}
              aside={available ? undefined : <SoonBadge />}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
