"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Employers paste a credential ID and land on /verify/<id>. No account.
export default function EmployerCheck() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = id.trim();
    if (!value) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/verify/${encodeURIComponent(value)}`);
  }

  return (
    <form id="check" onSubmit={submit} noValidate className="surface scroll-mt-8 p-5">
      <label htmlFor="credential-id" className="font-display text-2xl font-semibold leading-none">
        Employer? Check a credential
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="credential-id"
          name="credential-id"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Credential ID, for example demo-001"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? "credential-error" : undefined}
          className="field min-w-0 flex-1"
        />
        <button type="submit" className="btn btn-secondary">
          Check
        </button>
      </div>
      {error && (
        <p id="credential-error" role="alert" className="mt-3 text-sm font-medium text-ember">
          Enter a credential ID, for example demo-001.
        </p>
      )}
    </form>
  );
}
