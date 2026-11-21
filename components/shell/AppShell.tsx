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
  { label: "Notes", href: null },
  { label: "Leaderboard", href: null },
  { label: "Connect", href: null },
];

// The tabs in the top bar. Notes and Leaderboard are not built yet.
const TABS: { label: string; href: string | null }[] = [
  { label: "Roadmap", href: "/roadmap" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Notes", href: null },
  { label: "Leaderboard", href: null },
];

function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-display text-2xl font-bold leading-none ${className}`}>Ladda</span>;
}

export default function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Menu drawer: move focus in, keep Tab inside, give focus back on close.
  useEffect(() => {
    if (!menuOpen) return;
    const trigger = triggerRef.current;
    const drawer = drawerRef.current;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(drawer?.querySelectorAll<HTMLElement>(selector) ?? []);
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !drawer?.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [menuOpen]);

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
      {/* In the flow and sticky, so it takes its own 56px and never covers the page. */}
      <header className="topbar">
        <nav aria-label="Main" className="topbar-inner">
          <div className="flex items-center gap-2">
            <button
              ref={triggerRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="nav-link size-11 justify-center !p-0 md:hidden"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-5 rounded bg-text" />
                <span className="h-0.5 w-5 rounded bg-text" />
                <span className="h-0.5 w-3 rounded bg-text" />
              </span>
            </button>
            <Link href="/dashboard" aria-label="Ladda home" className="rounded-full px-1">
              <Wordmark />
            </Link>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {TABS.map((m) =>
              m.href ? (
                <Link
                  key={m.label}
                  href={m.href}
                  className="nav-link"
                  aria-current={pathname.startsWith(m.href) ? "page" : undefined}
                >
                  {m.label}
                </Link>
              ) : (
                <span
                  key={m.label}
                  aria-disabled="true"
                  title="Coming soon"
                  className="nav-link cursor-default text-text-mute hover:bg-transparent hover:text-text-mute"
                >
                  {m.label}
                  <span className="sr-only"> (coming soon)</span>
                </span>
              )
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-understory font-display text-lg font-bold text-volt"
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="surface-raised absolute right-0 top-13 z-50 w-64 p-2"
                >
                  {email && <p className="truncate px-4 py-3 text-sm text-text-mute">{email}</p>}
                  <span className="flex items-center justify-between rounded-full px-4 py-2.5 text-sm text-text-mute">
                    Profile <span className="badge badge-locked">Coming soon</span>
                  </span>
                  <span className="flex items-center justify-between rounded-full px-4 py-2.5 text-sm text-text-mute">
                    Settings <span className="badge badge-locked">Coming soon</span>
                  </span>
                  <Link
                    href="/verify/demo-001"
                    className="block rounded-full px-4 py-2.5 text-sm transition-colors hover:bg-line"
                  >
                    Sample credential
                  </Link>
                  <button
                    onClick={signOut}
                    className="mt-1 block w-full rounded-full px-4 py-2.5 text-left text-sm text-volt transition-colors hover:bg-line"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line-strong bg-understory p-6"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Wordmark className="text-3xl" />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="btn btn-secondary">
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
                            active ? "bg-volt text-[#04110a]" : "text-text-soft hover:bg-line"
                          }`}
                        >
                          {m.label}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="flex items-center justify-between rounded-full px-5 py-3 text-text-mute"
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
