"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fades `.reveal` elements up as they scroll into view. Anything already on screen
// is shown at once, and nothing is hidden if this script never runs.
export default function ScrollReveal() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = (first: boolean) => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (first && r.top < window.innerHeight * 0.92) el.classList.add("in");
        else io.observe(el);
      });
    };
    scan(true);
    root.classList.add("reveal-on");
    const mo = new MutationObserver(() => scan(false));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);
  return null;
}
