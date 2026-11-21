"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Type a credential ID, go to /verify/<id>. Used for the empty and not-found states.
export default function VerifyLookup({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [id, setId] = useState(initial);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = id.trim();
    if (!value) {
      setError(true);
      return;
    }
    router.push(`/verify/${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-xl">
      <label htmlFor="lookup-id" className="text-sm font-medium">
        Credential ID
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="lookup-id"
          className="field min-w-0 flex-1"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (error) setError(false);
          }}
          placeholder="For example demo-001"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? "lookup-error" : undefined}
        />
        <button type="submit" className="btn btn-primary">
          Check credential
        </button>
      </div>
      {error && (
        <p id="lookup-error" role="alert" className="mt-3 text-sm font-medium text-ember">
          Enter the credential ID from the link or the passport page, for example demo-001.
        </p>
      )}
    </form>
  );
}
