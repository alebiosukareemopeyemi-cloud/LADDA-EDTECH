import Link from "next/link";
import ContourBackdrop from "@/components/landing/ContourBackdrop";
import CredentialStrip from "@/components/landing/CredentialStrip";
import EmployerCheck from "@/components/landing/EmployerCheck";
import LandingNav from "@/components/landing/LandingNav";
import TrailMap from "@/components/landing/TrailMap";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-night">
      {/* Map: contour rings, then the trail. Both stretch behind header and hero. */}
      <div className="relative flex flex-1 flex-col">
        <ContourBackdrop />
        <TrailMap />
        <LandingNav />

        <main id="main" className="relative z-10 flex-1">
          <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-6 md:px-12 md:pt-8">
            <div className="max-w-[560px]">
              <h1 className="font-display text-[clamp(3.75rem,8.2vw,7.375rem)] font-bold leading-[0.95]">
                <span className="block">Your CV says</span>
                <span className="block">Node.js.</span>
                <span className="block">Prove it.</span>
              </h1>
              <p className="mt-6 max-w-[48ch] text-lg text-text-soft">
                Pick a skill, build a real project, and get it reviewed. Employers can check the result in one click.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/tour" className="btn btn-primary btn-lg">
                  Watch the 90-second tour
                </Link>
                <Link href="/auth" className="btn btn-secondary btn-lg">
                  Get started free
                </Link>
              </div>

              <div className="mt-8">
                <EmployerCheck />
              </div>
            </div>
          </div>
        </main>
      </div>

      <CredentialStrip />
    </div>
  );
}
