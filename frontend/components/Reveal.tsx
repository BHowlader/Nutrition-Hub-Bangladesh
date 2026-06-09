"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper with progressive enhancement.
 *
 * Content is VISIBLE by default. The fade-up animation is layered on only after
 * the component mounts on the client, and only for elements that start below the
 * fold. This guarantees the content is never stuck invisible if client JS fails
 * to hydrate or if IntersectionObserver never fires — a real failure mode on some
 * iOS Safari versions (older WebKit has IO bugs under `overflow`/`fixed`-background
 * layouts). A safety timeout also force-reveals if the observer goes silent.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "static": rendered plainly (SSR + JS-disabled fallback — always visible).
  // "hidden": JS took over and this started below the fold; animate it in.
  // "shown": revealed.
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer support or reduced-motion: keep content plainly visible.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setState("shown");
      return;
    }

    // Already on screen at mount: leave it visible (no flash, no animation).
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      setState("shown");
      return;
    }

    // Below the fold: hide now (off-screen, so no visible flash) and animate in
    // when it scrolls into view.
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);

    // Safety net: if the observer never reports (iOS Safari IO quirks), reveal
    // anyway so content can never be left invisible.
    const failsafe = window.setTimeout(() => setState("shown"), 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  const hidden = state === "hidden";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(24px)" : "none",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: hidden ? "opacity, transform" : "auto",
      }}
    >
      {children}
    </div>
  );
}
