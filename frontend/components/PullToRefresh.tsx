"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70; // px of pull (after resistance) needed to trigger a refresh
const MAX_PULL = 110; // cap on how far the indicator travels

/**
 * Mobile pull-to-refresh. When the page is scrolled to the very top and the user
 * drags down past the threshold, the page reloads. Inert on desktop (no touch).
 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    function onStart(e: TouchEvent) {
      if (refreshing || e.touches.length !== 1 || !atTop()) {
        active.current = false;
        return;
      }
      startY.current = e.touches[0].clientY;
      active.current = true;
    }

    function onMove(e: TouchEvent) {
      if (!active.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || !atTop()) {
        if (pullRef.current !== 0) {
          pullRef.current = 0;
          setPull(0);
        }
        active.current = false;
        return;
      }
      // Rubber-band resistance so the pull feels natural.
      const dist = Math.min(MAX_PULL, dy * 0.5);
      pullRef.current = dist;
      setPull(dist);
      // Suppress the browser's native overscroll/refresh while we handle the gesture.
      if (e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // Brief delay so the spinner is visible before the reload.
        window.setTimeout(() => window.location.reload(), 150);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing]);

  const visible = pull > 0 || refreshing;
  const travel = refreshing ? THRESHOLD : pull;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center sm:hidden"
      style={{
        transform: `translateY(${visible ? travel - 6 : -48}px)`,
        transition: active.current ? "none" : "transform 0.25s ease, opacity 0.25s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="mt-2 grid h-9 w-9 place-items-center rounded-full border border-cream/10 bg-ink/90 text-gold shadow-lg backdrop-blur-md">
        <RefreshCw
          size={16}
          className={refreshing ? "animate-spin" : ""}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
            opacity: 0.4 + progress * 0.6,
          }}
        />
      </div>
    </div>
  );
}
