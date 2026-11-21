"use client";

import type { ReactNode } from "react";

const TOTAL = 4; // Stage, target, known, time. The building screen has no progress bar.

type Props = {
  step: number; // 0-based question index (0 to 3)
  title: string;
  subtitle?: string;
  /** Something to fix before moving on. Say what and how. */
  problem?: string | null;
  onBack?: () => void; // leave out to hide the back button
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string; // for example "Skip for now"
  onSecondary?: () => void;
  children: ReactNode;
};

export function IntakeShell({
  step,
  title,
  subtitle,
  problem,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  children,
}: Props) {
  const n = Math.min(step + 1, TOTAL);
  return (
    <div className="contour min-h-dvh">
      <header className="mx-auto flex h-[72px] max-w-2xl items-center justify-between gap-6 px-5">
        <span className="font-display text-[1.75rem] font-bold leading-none">Ladda</span>
        <div className="flex-1 sm:max-w-60">
          <p className="mb-1.5 text-right text-sm text-text-mute">
            Question {n} of {TOTAL}
          </p>
          <div
            role="progressbar"
            aria-label="Intake progress"
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-valuenow={n}
            className="h-1.5 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-volt transition-[width] duration-300" style={{ width: `${(n / TOTAL) * 100}%` }} />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-2xl px-5 pb-44 pt-8 md:pb-16 md:pt-14">
        <h1 className="display-md">{title}</h1>
        {subtitle && <p className="mt-3 max-w-[56ch] text-lg text-text-soft">{subtitle}</p>}

        <div className="mt-8">{children}</div>

        {problem && (
          <p role="alert" className="mt-6 max-w-[56ch] font-medium text-ember">
            {problem}
          </p>
        )}

        {/* Actions: inline on desktop, pinned to the bottom on phones */}
        {(primaryLabel || secondaryLabel || onBack) && (
          <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-stretch gap-2 border-t border-line bg-night px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:static md:mt-10 md:flex-row md:items-center md:gap-3 md:border-0 md:bg-transparent md:p-0">
            {primaryLabel && (
              <button type="button" onClick={onPrimary} disabled={primaryDisabled} className="btn btn-primary btn-lg">
                {primaryLabel}
              </button>
            )}
            {secondaryLabel && (
              <button type="button" onClick={onSecondary} className="btn btn-secondary btn-lg">
                {secondaryLabel}
              </button>
            )}
            {onBack && (
              <button type="button" onClick={onBack} className="btn btn-ghost">
                Back
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
