"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const SHOW_ON = ["/dashboard", "/roadmap", "/opportunities"];

const MENU: { label: string; href: string | null }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Leaderboard", href: null },
  { label: "Your Notes", href: null },
  { label: "Connect", href: null },
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-heading font-extrabold ${className}`}>
      Ladda
      <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
    </span>
  );
}

export default function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close everything when the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Who is signed in (best effort).
  useEffect(() => {
    let alive = true;
    try {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          if (alive) setEmail(data.user?.email ?? null);
        })
        .catch(() => {});
    } catch {}
    return () => {
      alive = false;
    };
  }, []);

  // Escape closes menus; clicking outside closes the profile menu.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {}
    setProfileOpen(false);
    router.push("/auth");
    router.refresh();
  }

  const visible = SHOW_ON.some((p) => pathname.startsWith(p));
  if (!visible) return null;

  const initial = email ? email[0].toUpperCase() : null;

  return (
    <>
      {/* Floating glass nav: one of the three glass surfaces. */}
      <header className="pointer-events-none fixed inset-x-0 top-2 z-40 flex justify-center">
        <nav aria-label="Main" className="nav-float glass">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="nav-link size-11 justify-center !p-0"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 rounded bg-foreground" />
                <span className="h-0.5 w-4 rounded bg-foreground" />
                <span className="h-0.5 w-2.5 rounded bg-foreground" />
              </span>
            </button>
            <Link href="/dashboard" className="px-2 text-lg" aria-label="Ladda home">
              <Wordmark />
            </Link>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {MENU.filter((m) => m.href).map((m) => (
              <Link
                key={m.label}
                href={m.href as string}
                className="nav-link"
                aria-current={pathname.startsWith(m.href as string) ? "page" : undefined}
              >
                {m.label}
              </Link>
            ))}
          </div>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-s3 font-heading font-bold text-primary transition-transform hover:scale-105 active:scale-95"
            >
              {initial ?? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="surface-3 absolute right-0 top-14 w-64 p-2"
                >
                  {email && (
                    <p className="truncate px-4 py-3 text-sm text-muted-foreground">{email}</p>
                  )}
                  <span className="flex items-center justify-between rounded-full px-4 py-2.5 text-sm text-muted-foreground/70">
                    Profile <span className="badge badge-locked">Coming soon</span>
                  </span>
                  <span className="flex items-center justify-between rounded-full px-4 py-2.5 text-sm text-muted-foreground/70">
                    Settings <span className="badge badge-locked">Coming soon</span>
                  </span>
                  <Link
                    href="/verify/demo-001"
                    className="block rounded-full px-4 py-2.5 text-sm transition-colors hover:bg-foreground/5"
                  >
                    Sample credential
                  </Link>
                  <button
                    onClick={signOut}
                    className="mt-1 block w-full rounded-full px-4 py-2.5 text-left text-sm text-primary transition-colors hover:bg-foreground/5"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>
      <div className="h-16" aria-hidden="true" />

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              role="dialog"
              aria-label="Menu"
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-border bg-s3 p-6 shadow-[var(--shadow-s3)]"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Wordmark className="text-xl" />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="btn btn-glass btn-sm">
                  Close
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {MENU.map((m) => {
                  const active = m.href ? pathname.startsWith(m.href) : false;
                  return (
                    <li key={m.label}>
                      {m.href ? (
                        <Link
                          href={m.href}
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-full px-5 py-3 font-medium transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-foreground/5"
                          }`}
                        >
                          {m.label}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="flex items-center justify-between rounded-full px-5 py-3 text-muted-foreground/70"
                        >
                          {m.label} <span className="badge badge-locked">Coming soon</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
