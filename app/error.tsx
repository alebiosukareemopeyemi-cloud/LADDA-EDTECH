"use client";

import Link from "next/link";
import StatusPage from "@/components/StatusPage";

// Something broke while a page was running. Offer a retry and a way out.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusPage
      title="That did not load"
      actions={
        <>
          <button type="button" className="btn btn-primary btn-lg" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Back to home
          </Link>
        </>
      }
    >
      <p>
        Something went wrong on our side, and nothing you did caused it. Select Try again. If it keeps happening, go back
        to the home page and open it from there. Your progress is saved.
      </p>
    </StatusPage>
  );
}
