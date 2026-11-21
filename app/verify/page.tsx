import type { Metadata } from "next";
import Link from "next/link";
import VerifyLookup from "@/components/credential/VerifyLookup";

export const metadata: Metadata = {
  title: "Check a Ladda credential",
  description: "Check a Ladda credential in your browser. No account needed.",
};

export default function VerifyIndexPage() {
  return (
    <div className="contour flex min-h-dvh flex-col">
      <header className="mx-auto flex h-[72px] w-full max-w-5xl items-center px-4 md:px-10">
        <Link href="/" className="font-display text-[1.75rem] font-bold leading-none">
          Ladda
        </Link>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 md:px-10 md:pt-16">
        <h1 className="display-md max-w-[18ch]">Check a credential</h1>
        <p className="measure mt-4 text-lg text-text-soft">
          Enter the ID from the credential link. The check runs in your browser and needs no account.
        </p>
        <div className="mt-8">
          <VerifyLookup />
        </div>
        <p className="mt-6 text-sm text-text-mute">
          Want to see one first? Open the{" "}
          <Link href="/verify/demo-001" className="underline underline-offset-4">
            sample credential
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
