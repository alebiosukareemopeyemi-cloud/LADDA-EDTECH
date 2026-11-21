import Link from "next/link";
import type { ReactNode } from "react";
import ContourBackdrop from "@/components/landing/ContourBackdrop";

// Night with faint contour rings, and one centred form on a raised surface.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-night">
      <div className="opacity-50">
        <ContourBackdrop />
      </div>
      <main id="main" className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
        <div className="surface-raised w-full max-w-md p-6 sm:p-8">
          <Link href="/" className="inline-flex min-h-11 items-center font-display text-[1.75rem] font-bold leading-none">
            Ladda
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
