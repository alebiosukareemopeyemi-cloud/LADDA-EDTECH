import Link from "next/link";

// Two rails and three rungs, in volt.
function LadderLogo() {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden="true" focusable="false">
      <g stroke="#BEF264" strokeWidth="2.5" strokeLinecap="round">
        <line x1="5" y1="2" x2="5" y2="26" />
        <line x1="17" y1="2" x2="17" y2="26" />
        <line x1="5" y1="8" x2="17" y2="8" />
        <line x1="5" y1="14.5" x2="17" y2="14.5" />
        <line x1="5" y1="21" x2="17" y2="21" />
      </g>
    </svg>
  );
}

export default function LandingNav() {
  return (
    <header className="relative z-10">
      <nav aria-label="Main" className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-12">
        <Link href="/" aria-label="Ladda home" className="flex min-h-11 items-center gap-2.5 rounded-full">
          <LadderLogo />
          <span className="font-display text-[1.75rem] font-bold leading-none">Ladda</span>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/tour" className="nav-link hidden md:inline-flex">
            How it works
          </Link>
          <Link href="#check" className="nav-link hidden md:inline-flex">
            For employers
          </Link>
          <Link href="/auth" className="nav-link">
            Sign in
          </Link>
          <Link href="/auth" className="btn btn-secondary ml-1 hidden sm:inline-flex">
            Get started free
          </Link>
        </div>
      </nav>
    </header>
  );
}
