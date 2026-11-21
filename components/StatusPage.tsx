import type { ReactNode } from "react";
import Link from "next/link";
import ContourBackdrop from "@/components/landing/ContourBackdrop";

// For 404 and error screens: say what happened, then give a way back.
export default function StatusPage({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-night">
      <div className="opacity-50">
        <ContourBackdrop />
      </div>
      <header className="relative z-10 mx-auto flex h-[72px] max-w-5xl items-center px-4 md:px-10">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-[1.75rem] font-bold leading-none">
          Ladda
        </Link>
      </header>
      <main id="main" className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-10 md:px-10 md:pt-20">
        <h1 className="display max-w-[12ch]">{title}</h1>
        <div className="measure mt-6 text-lg text-text-soft">{children}</div>
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </main>
    </div>
  );
}
