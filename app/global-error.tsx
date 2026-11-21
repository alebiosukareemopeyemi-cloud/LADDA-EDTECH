"use client";

import "./globals.css";

// Last resort: the root layout itself failed, so this page brings its own html and body.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-night text-text antialiased">
        <main id="main" className="mx-auto max-w-2xl px-5 py-20">
          <h1 className="display-md">Ladda did not start</h1>
          <p className="measure mt-4 text-lg text-text-soft">
            Something went wrong while loading the app. Select Try again. If that does not help, reload the page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary btn-lg" onClick={reset}>
              Try again
            </button>
            <a href="/" className="btn btn-secondary btn-lg">
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
