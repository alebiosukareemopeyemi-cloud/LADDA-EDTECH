"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// One place for how every modal, drawer and sheet behaves:
// focus moves in, Tab stays inside, Escape closes, the page behind does not scroll,
// and focus goes back to whatever opened it.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Locks are counted so a modal opened over another one does not unlock the page early.
let locks = 0;
let saved = "";
function lock() {
  if (locks++ === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
}
function unlock() {
  if (--locks === 0) document.body.style.overflow = saved;
}

/** Stop the page behind from scrolling while `active` is true. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}

export function useModal(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  opts: { onClose: () => void; returnTo?: RefObject<HTMLElement | null> }
) {
  const onClose = useRef(opts.onClose);
  useEffect(() => {
    onClose.current = opts.onClose;
  });
  const returnTo = opts.returnTo;

  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    lock();

    const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (items()[0] ?? ref.current)?.focus({ preventScroll: true });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const here = document.activeElement;
      const outside = !ref.current?.contains(here);
      if (e.shiftKey && (here === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (here === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
      // Read at close time on purpose: the opener is still on the page and may have been re-rendered.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (returnTo?.current ?? opener)?.focus({ preventScroll: true });
    };
  }, [active, ref, returnTo]);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}
